import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function tests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? tests(path) : /\.test\.ts$/.test(path) ? [path] : [];
  });
}

const run = spawnSync(process.execPath, ["--import", "tsx", "--test", ...tests("src")], { stdio: "inherit" });
if (run.error) throw run.error;
process.exit(run.status ?? 1);
