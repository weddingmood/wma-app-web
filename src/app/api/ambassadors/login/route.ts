import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { AMB_COOKIE, makeToken, verifyPin } from "@/lib/ambassador-auth";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const rowsOf = (res: unknown): Row[] => (Array.isArray(res) ? (res as Row[]) : ((res as { rows?: Row[] })?.rows ?? []));

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { code?: unknown; pin?: unknown };
  const code = String(body.code || "").trim().toUpperCase().slice(0, 40);
  const pin = String(body.pin || "").trim().slice(0, 20);
  if (!code || !pin) return Response.json({ success: false, message: "Code et PIN requis" }, { status: 400 });

  try {
    await db.execute(sql`create table if not exists ambassador_attempts (code text primary key, fails int not null default 0, locked_until timestamptz)`);
    const att = rowsOf(await db.execute(sql`select fails, (locked_until is not null and locked_until > now()) as locked from ambassador_attempts where code = ${code}`))[0];
    if (att && att.locked === true) {
      return Response.json({ success: false, message: "Trop d'essais. R\u00e9essayez dans 15 minutes." }, { status: 429 });
    }

    const amb = rowsOf(await db.execute(sql`select pin_hash, is_active from ambassadors where code_unique = ${code} limit 1`))[0];
    const ok = Boolean(amb) && amb.is_active !== false && typeof amb.pin_hash === "string" && verifyPin(pin, amb.pin_hash as string);

    if (!ok) {
      const fails = Number(att?.fails ?? 0) + 1;
      if (fails >= MAX_FAILS) {
        await db.execute(sql`insert into ambassador_attempts (code, fails, locked_until) values (${code}, 0, now() + make_interval(mins => ${LOCK_MINUTES})) on conflict (code) do update set fails = 0, locked_until = now() + make_interval(mins => ${LOCK_MINUTES})`);
      } else {
        await db.execute(sql`insert into ambassador_attempts (code, fails, locked_until) values (${code}, ${fails}, null) on conflict (code) do update set fails = ${fails}, locked_until = null`);
      }
      return Response.json({ success: false, message: "Code ou PIN incorrect" }, { status: 401 });
    }

    await db.execute(sql`delete from ambassador_attempts where code = ${code}`);
    (await cookies()).set(AMB_COOKIE, makeToken(code), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 86400,
    });
    return Response.json({ success: true });
  } catch (e) {
    console.error("Connexion ambassadeur:", e);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}