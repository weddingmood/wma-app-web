import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PREFIX = "scrypt$";

export function hashSecure(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  return PREFIX + salt + "$" + scryptSync(plain, salt, 32).toString("hex");
}

function safeEq(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function verifySecure(plain: string, stored: string | null | undefined): { ok: boolean; upgrade: boolean } {
  if (!stored) return { ok: false, upgrade: false };
  if (stored.startsWith(PREFIX)) {
    const parts = stored.split("$");
    if (parts.length !== 3) return { ok: false, upgrade: false };
    try {
      return { ok: safeEq(scryptSync(plain, parts[1], 32).toString("hex"), parts[2]), upgrade: false };
    } catch {
      return { ok: false, upgrade: false };
    }
  }
  const legacy = createHash("sha256").update(plain).digest("hex");
  const ok = safeEq(legacy, stored);
  return { ok, upgrade: ok };
}