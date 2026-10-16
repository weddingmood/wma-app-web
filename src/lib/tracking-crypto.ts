import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// Le jeton Conversions API est chiffre (AES-256-GCM) avant d'etre stocke.
// Cle : TRACKING_ENC_KEY, sinon derivee de SESSION_SECRET (si ce secret change, ressaisir le jeton).
function key(): Buffer {
  const secret = process.env.TRACKING_ENC_KEY || process.env.SESSION_SECRET;
  if (!secret) throw new Error("TRACKING_ENC_KEY ou SESSION_SECRET manquant");
  return createHash("sha256").update("tracking-token:" + secret).digest();
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}

export function decryptToken(blob: string | null | undefined): string | null {
  if (!blob) return null;
  try {
    const [iv, tag, enc] = blob.split(".").map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}