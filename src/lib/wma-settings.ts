import { sql } from "drizzle-orm";
import { db } from "@/db";

type Row = Record<string, unknown>;
const rowsOf = (res: unknown): Row[] => (Array.isArray(res) ? (res as Row[]) : ((res as { rows?: Row[] })?.rows ?? []));

export const PUBLIC_KEYS = [
  "whatsapp", "phone", "email_contact", "email_support", "address",
  "company_name", "dfe", "rccm", "footer_signature", "faq", "terms", "privacy", "payment_methods",
] as const;
export const PRIVATE_KEYS = ["mail_from", "mail_signature", "mail_welcome"] as const;
export const ALL_KEYS: readonly string[] = [...PUBLIC_KEYS, ...PRIVATE_KEYS];

let ready = false;
export async function ensureSettingsTable() {
  if (ready) return;
  await db.execute(sql`create table if not exists wma_settings (key text primary key, value text not null default '', updated_at timestamptz not null default now())`);
  ready = true;
}

export async function readSettings(keys: readonly string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    await ensureSettingsTable();
    const rows = rowsOf(await db.execute(sql`select key, value from wma_settings`));
    for (const r of rows) {
      const k = String(r.key);
      if (keys.includes(k)) out[k] = String(r.value ?? "");
    }
  } catch (e) {
    console.error("Lecture parametres:", e);
  }
  return out;
}

export async function writeSettings(values: Record<string, string>) {
  await ensureSettingsTable();
  const keys = Object.keys(values);
  if (keys.length === 0) return;
  const parts = keys.map((k) => sql`(${k}, ${values[k]}, now())`);
  await db.execute(sql`insert into wma_settings (key, value, updated_at) values ${sql.join(parts, sql`, `)} on conflict (key) do update set value = excluded.value, updated_at = now()`);
}
const DEFAULT_WA = "22570501356";
const DEFAULT_WA_LABEL = "+225 70 50 13 56";

export async function getSupportWhatsapp(): Promise<{ digits: string; url: string; label: string }> {
  const s = await readSettings(["whatsapp"]);
  const digits = (s.whatsapp || "").replace(/\D/g, "");
  const valid = digits.length >= 8 && digits.length <= 15;
  const d = valid ? digits : DEFAULT_WA;
  return { digits: d, url: "https://wa.me/" + d, label: valid ? String(s.whatsapp).trim() : DEFAULT_WA_LABEL };
}
