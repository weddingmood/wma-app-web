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
  for (const [k, v] of Object.entries(values)) {
    await db.execute(sql`insert into wma_settings (key, value, updated_at) values (${k}, ${v}, now()) on conflict (key) do update set value = excluded.value, updated_at = now()`);
  }
}