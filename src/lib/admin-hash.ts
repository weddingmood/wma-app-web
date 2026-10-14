import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SECURE = true;
const PREFIX = "scrypt$";

function safeEq(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function makeHash(plain: string): string {
  if (!SECURE) return createHash("sha256").update(plain).digest("hex");
  const salt = randomBytes(16).toString("hex");
  return PREFIX + salt + "$" + scryptSync(plain, salt, 32).toString("hex");
}

export function checkHash(plain: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  if (stored.startsWith(PREFIX)) {
    const parts = stored.split("$");
    if (parts.length !== 3) return false;
    try {
      return safeEq(scryptSync(plain, parts[1], 32).toString("hex"), parts[2]);
    } catch {
      return false;
    }
  }
  return safeEq(createHash("sha256").update(plain).digest("hex"), stored);
}