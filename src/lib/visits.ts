import { sql } from "drizzle-orm";
import { db } from "@/db";

let ready = false;
export async function ensureVisitsTable() {
  if (ready) return;
  await db.execute(sql`create table if not exists site_visits (id bigserial primary key, created_at timestamptz not null default now(), session_id text, path text, country text, region text, city text, referrer text)`);
  await db.execute(sql`create index if not exists site_visits_created_idx on site_visits (created_at)`);
  ready = true;
}