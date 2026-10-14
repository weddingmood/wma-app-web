import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { verifyToken } from "@/lib/session-token";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const rowsOf = (res: unknown): Row[] => (Array.isArray(res) ? (res as Row[]) : ((res as { rows?: Row[] })?.rows ?? []));
const bad = (message: string, status = 400) => Response.json({ success: false, message }, { status });

async function currentAdmin() {
  const token = (await cookies()).get("wm_admin_session")?.value;
  if (!token) return null;
  const d = verifyToken<{ adminId: number }>(token, "admin");
  if (!d || !d.adminId) return null;
  const [a] = await db.select().from(admins).where(eq(admins.id, Number(d.adminId))).limit(1);
  return a ?? null;
}

async function ensure() {
  await db.execute(sql`create table if not exists wma_login_attempts (key text primary key, fails integer not null default 0, locked_until timestamptz, updated_at timestamptz not null default now())`);
}

export async function GET() {
  const me = await currentAdmin();
  if (!me) return bad("Session administrateur requise.", 401);
  try {
    await ensure();
    const rows = rowsOf(await db.execute(sql`
      select key, fails,
        (locked_until is not null and locked_until > now()) as locked,
        case when locked_until is not null and locked_until > now() then ceil(extract(epoch from (locked_until - now())) / 60)::int else 0 end as minutes
      from wma_login_attempts where fails > 0 order by updated_at desc limit 50`));
    const isSuper = me.role === "superadmin";
    const locks = rows
      .filter((r) => isSuper || !String(r.key).startsWith("admin"))
      .map((r) => ({ key: String(r.key), fails: Number(r.fails), locked: r.locked === true, minutes: Number(r.minutes) }));
    return Response.json({ success: true, locks });
  } catch (e) {
    console.error("Blocages (lecture):", e);
    return bad("Erreur serveur", 500);
  }
}

export async function DELETE(req: Request) {
  const me = await currentAdmin();
  if (!me) return bad("Session administrateur requise.", 401);
  const key = String(new URL(req.url).searchParams.get("key") || "");
  if (!key || key.length > 200) return bad("Cl\u00e9 invalide.");
  if (key.startsWith("admin") && me.role !== "superadmin") return bad("R\u00e9serv\u00e9 au super administrateur.", 403);
  try {
    await ensure();
    await db.execute(sql`delete from wma_login_attempts where key = ${key}`);
    return Response.json({ success: true });
  } catch (e) {
    console.error("Blocages (suppression):", e);
    return bad("Erreur serveur", 500);
  }
}