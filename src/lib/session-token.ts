// Jetons de session signés (HMAC-SHA256).
// Un cookie ne peut plus être fabriqué ou modifié à la main : sans la clé secrète du
// serveur, la signature ne correspond pas et le jeton est refusé.

import crypto from "crypto";

function secret(): string {
  // SESSION_SECRET est recommandé. À défaut, on utilise l'URL de la base (secrète elle aussi)
  // pour que la connexion continue de fonctionner tant que la variable n'est pas définie.
  const value =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!value) throw new Error("SESSION_SECRET est requis pour signer les sessions.");
  return value;
}

function sign(data: string): Buffer {
  return crypto.createHmac("sha256", secret()).update(data).digest();
}

/** Crée un jeton signé qui expire après maxAgeSeconds. */
export function signToken(payload: Record<string, unknown>, maxAgeSeconds: number): string {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + maxAgeSeconds };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  return data + "." + sign(data).toString("base64url");
}

/**
 * Vérifie un jeton (signature, expiration et type : "couple" ou "admin").
 * Renvoie son contenu, ou null s'il est absent, falsifié, expiré ou d'un autre type.
 */
export function verifyToken<T = Record<string, unknown>>(
  token: string | null | undefined,
  expectedType: "couple" | "admin"
): T | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const expected = sign(parts[0]);
  const given = Buffer.from(parts[1], "base64url");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (!payload || payload.typ !== expectedType) return null;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload as T;
  } catch {
    return null;
  }
}
