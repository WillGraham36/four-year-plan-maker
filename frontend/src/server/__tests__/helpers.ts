import { readFileSync } from "node:fs";
import { createRequire, isBuiltin } from "node:module";
import { dirname, resolve } from "node:path";
import { runInThisContext } from "node:vm";
import ts from "typescript";

/** Load real TS implementations with isolated dependency doubles on Node 20.
 * No global require hooks, module cache mutations, database, or Clerk connection.
 * Type checking remains a separate `npm run typecheck` check.
 */
export function loadModule<T>(relativePath: string, mocks: Record<string, unknown> = {}): T {
  const root = resolve(process.cwd(), "src");
  const cache = new Map<string, { exports: unknown }>();
  const unavailable = () => { throw new Error("Test attempted an unmocked database call"); };
  const dependencies: Record<string, unknown> = {
    "server-only": {},
    "@/server/db/client": { query: unavailable, getPool: unavailable },
    ...mocks,
  };
  function load(filename: string): unknown {
    if (cache.has(filename)) return cache.get(filename)!.exports;
    const localRequire = createRequire(filename);
    if (!filename.startsWith(root) || !filename.endsWith(".ts")) return localRequire(filename);
    const loaded = { exports: {} };
    cache.set(filename, loaded);
    const source = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      fileName: filename,
    }).outputText;
    const requireDependency = (specifier: string) => {
      if (Object.hasOwn(dependencies, specifier)) return dependencies[specifier];
      if (isBuiltin(specifier)) return localRequire(specifier);
      const target = specifier.startsWith("@/") ? resolve(root, specifier.slice(2)) : specifier;
      const resolved = localRequire.resolve(target);
      if (resolved === resolve(root, "server/db/client.ts")) return dependencies["@/server/db/client"];
      return load(resolved);
    };
    runInThisContext(`(function(require, module, exports, __filename, __dirname) {\n${source}\n})`, { filename })(
      requireDependency, loaded, loaded.exports, filename, dirname(filename),
    );
    return loaded.exports;
  }
  return load(resolve(root, relativePath)) as T;
}

export function result(rows: unknown[] = [], rowCount = rows.length) {
  return { rows, rowCount, command: "", oid: 0, fields: [] };
}
