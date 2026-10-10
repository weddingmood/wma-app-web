import { createHmac, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const AMB_COOKIE = "wm_amb";
const DAYS = 30;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET manquant");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function makeToken(code: string): string {
  const payload = code + "|" + (Date.now() + DAYS * 86400000);
  return Buffer.from(payload).toString("base64url") + "." + sign(payload);
}

export function readToken(token: string): string | null {
  const [b, sig] = token.split(".");
  if (!b || !sig) return null;
  let payload = "";
  try { payload = Buffer.from(b, "base64url").toString("utf8"); } catch { return null; }
  const a = Buffer.from(sig);
  const e = Buffer.from(sign(payload));
  if (a.length !== e.length || !timingSafeEqual(a, e)) return null;
  const [code, exp] = payload.split("|");
  if (!code || !(Number(exp) > Date.now())) return null;
  return code;
}

export async function currentAmbassadorCode(): Promise<string | null> {
  try {
    const t = (await cookies()).get(AMB_COOKIE)?.value;
    return t ? readToken(t) : null;
  } catch {
    return null;
  }
}

export function verifyPin(pin: string, stored: string): boolean {
  const i = stored.indexOf(":");
  if (i < 1) return false;
  const salt = stored.slice(0, i);
  const hash = stored.slice(i + 1);
  try {
    const a = Buffer.from(scryptSync(pin, salt, 32).toString("hex"));
    const b = Buffer.from(hash);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}