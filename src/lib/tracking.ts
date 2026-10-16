import { createHash } from "crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// Facebook exige un e-mail normalise (minuscules, sans espaces) puis hache en SHA-256
export function hashEmail(email: string): string {
  return sha256Hex(email.trim().toLowerCase());
}

export function isHex64(v: unknown): v is string {
  return typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
}

export function isEmail(v: unknown): v is string {
  return typeof v === "string" && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// RGPD : on ne stocke que l'IP anonymisee (IPv4 : dernier octet a 0, IPv6 : /48)
export function anonymizeIp(ip: string | null): string | null {
  if (!ip) return null;
  const v4 = ip.match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
  if (v4) return v4[1] + "." + v4[2] + "." + v4[3] + ".0";
  if (ip.includes(":")) return ip.split(":").filter(Boolean).slice(0, 3).join(":") + "::";
  return null;
}

// IP reelle : le Worker Cloudflare (secret partage) ou les en-tetes du proxy
export function clientIp(req: Request): string | null {
  const secret = process.env.TRACKING_PROXY_SECRET;
  if (secret && req.headers.get("x-wt-secret") === secret) {
    const forwarded = req.headers.get("x-client-ip");
    if (forwarded) return forwarded.trim();
  }
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return null;
}

export type Source = "facebook" | "google" | "direct" | "other";

export function detectSource(p: { fbclid?: string; fbc?: string; gclid?: string; utmSource?: string; referrer?: string }): Source {
  const utm = (p.utmSource || "").toLowerCase();
  if (p.fbclid || p.fbc || /^(facebook|fb|instagram|ig|meta)$/.test(utm)) return "facebook";
  if (p.gclid || utm === "google") return "google";
  let host = "";
  try {
    host = new URL(p.referrer || "").hostname.toLowerCase();
  } catch {
    host = "";
  }
  if (/(^|\.)(facebook|instagram|fb)\.com$/.test(host)) return "facebook";
  if (/(^|\.)google\./.test(host)) return "google";
  return host ? "other" : "direct";
}