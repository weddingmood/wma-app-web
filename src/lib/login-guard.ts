import { sql } from "drizzle-orm";
import { db } from "@/db";

let ready = false;
async function ensure() {
  if (ready) return;
  await db.execute(sql`create table if not exists wma_login_attempts (key text primary key, fails integer not null default 0, locked_until timestamptz, updated_at timestamptz not null default now())`);
  ready = true;
}

export async function loginLockMinutes(key: string): Promise<number> {
  try {
    await ensure();
    const res: any = await db.execute(sql`select ceil(extract(epoch from (locked_until - now())) / 60)::int as m from wma_login_attempts where key = ${key} and locked_until is not null and locked_until > now()`);
    const rows = Array.isArray(res) ? res : res?.rows ?? [];
    return rows[0] ? Math.max(1, Number(rows[0].m)) : 0;
  } catch {
    return 0;
  }
}

export async function recordLoginFailure(key: string, maxMinutes = 1440): Promise<void> {
  try {
    await ensure();
    await db.execute(sql`delete from wma_login_attempts where key = ${key} and updated_at < now() - interval '24 hours' and (locked_until is null or locked_until < now())`);
    await db.execute(sql`
      insert into wma_login_attempts (key, fails, locked_until, updated_at) values (${key}, 1, null, now())
      on conflict (key) do update set
        fails = wma_login_attempts.fails + 1,
        locked_until = case
          when (wma_login_attempts.fails + 1) % 5 = 0
          then now() + make_interval(mins => least(${maxMinutes}::int, case when wma_login_attempts.fails + 1 >= 15 then 1440 when wma_login_attempts.fails + 1 >= 10 then 60 else 15 end))
          else wma_login_attempts.locked_until end,
        updated_at = now()
    `);
  } catch {}
}

export async function clearLoginFailures(key: string): Promise<void> {
  try {
    await ensure();
    await db.execute(sql`delete from wma_login_attempts where key = ${key}`);
  } catch {}
}