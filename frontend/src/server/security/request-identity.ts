import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";

export function positiveLimit(name: string, fallback: number, maximum = 100_000) {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new Error(`Invalid security limit: ${name}`);
  }
  return parsed;
}

export function hashSubject(value: string) {
  const secret = process.env.ABUSE_IP_HASH_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error("ABUSE_IP_HASH_SECRET must contain at least 32 characters");
  }
  return createHmac("sha256", secret || "local-development-only").update(value).digest("hex");
}

export function ipSubject(requestHeaders: Pick<Headers, "get">) {
  // Only trust a header supplied by the configured ingress. Never trust a caller's XFF by default.
  const header = process.env.VERCEL === "1"
    ? "x-vercel-forwarded-for"
    : process.env.ABUSE_TRUSTED_IP_HEADER;
  const raw = header ? requestHeaders.get(header)?.trim() : undefined;
  let address = raw && isIP(raw) ? raw : "unknown";
  if (isIP(address) === 6) {
    const canonical = new URL(`http://[${address}]/`).hostname.slice(1, -1);
    // Group IPv6 addresses by /64 so rotating privacy addresses cannot reset quotas.
    const [left, right = ""] = canonical.split("::");
    const first = left ? left.split(":") : [];
    const last = right ? right.split(":") : [];
    address = [...first, ...Array(8 - first.length - last.length).fill("0"), ...last]
      .slice(0, 4).map((part: string) => part.padStart(4, "0")).join(":");
  }
  return hashSubject(`ip:${address}`);
}

export async function currentIpSubject() {
  return ipSubject(await headers());
}
