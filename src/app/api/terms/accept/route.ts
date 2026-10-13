import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

let ready = false;
async function ensure() {
  if (ready) return;
  await db.execute(sql`create table if not exists wma_terms_acceptance (id bigserial primary key, couple_id integer, partner text, session_id text, version text not null, context text, user_agent text, accepted_at timestamptz not null default now())`);
  ready = true;
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { version?: unknown; context?: unknown; sid?: unknown };
  const version = String(b.version || "").slice(0, 20);
  if (!version) return Response.json({ success: false, message: "Version manquante" }, { status: 400 });
  const context = String(b.context || "").slice(0, 30);
  const sid = String(b.sid || "").slice(0, 60);
  let coupleId: number | null = null;
  let partner: string | null = null;
  try {
    const store = await cookies();
    if (store.get("wm_session")?.value) {
      const s = await getCurrentSession();
      if (s && !s.isAdmin && s.coupleId) {
        coupleId = Number(s.coupleId);
        partner = s.activePartner === "partner2" ? "partner2" : "partner1";
      }
    }
  } catch {}
  const ua = (req.headers.get("user-agent") || "").slice(0, 200);
  try {
    await ensure();
    await db.execute(sql`insert into wma_terms_acceptance (couple_id, partner, session_id, version, context, user_agent) values (${coupleId}, ${partner}, ${sid || null}, ${version}, ${context || null}, ${ua || null})`);
    return Response.json({ success: true });
  } catch (e) {
    console.error("Acceptation des conditions:", e);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}