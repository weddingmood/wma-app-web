import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const rowsOf = (res: unknown): Row[] => (Array.isArray(res) ? (res as Row[]) : ((res as { rows?: Row[] })?.rows ?? []));

const STATUSES = ["in_progress", "completed", "skipped"];

let ready = false;
async function ensure() {
  if (ready) return;
  await db.execute(sql`create table if not exists wma_tour (couple_id integer not null, partner text not null, status text not null default 'in_progress', step integer not null default 0, audio_on boolean not null default true, updated_at timestamptz not null default now(), primary key (couple_id, partner))`);
  ready = true;
}

async function who() {
  const store = await cookies();
  if (!store.get("wm_session")?.value) return null;
  const s = await getCurrentSession();
  if (!s || s.isAdmin || !s.coupleId) return null;
  return { coupleId: Number(s.coupleId), partner: s.activePartner === "partner2" ? "partner2" : "partner1" };
}

const unauthorized = () => Response.json({ success: false, message: "Non autoris\u00e9" }, { status: 401 });

export async function GET() {
  const w = await who();
  if (!w) return unauthorized();
  try {
    await ensure();
    const r = rowsOf(await db.execute(sql`select status, step, audio_on from wma_tour where couple_id = ${w.coupleId} and partner = ${w.partner} limit 1`))[0];
    return Response.json({
      success: true,
      status: r ? String(r.status) : "none",
      step: r ? Number(r.step) : 0,
      audio: r ? r.audio_on !== false : true,
    });
  } catch (e) {
    console.error("Parcours (lecture):", e);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const w = await who();
  if (!w) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as { status?: unknown; step?: unknown; audio?: unknown };
  try {
    await ensure();
    const cur = rowsOf(await db.execute(sql`select status, step, audio_on from wma_tour where couple_id = ${w.coupleId} and partner = ${w.partner} limit 1`))[0];
    const status = typeof b.status === "string" && STATUSES.includes(b.status) ? b.status : cur ? String(cur.status) : "in_progress";
    const stepRaw = Number(b.step);
    const step = Number.isInteger(stepRaw) ? Math.min(Math.max(stepRaw, 0), 20) : cur ? Number(cur.step) : 0;
    const audio = typeof b.audio === "boolean" ? b.audio : cur ? cur.audio_on !== false : true;
    await db.execute(sql`insert into wma_tour (couple_id, partner, status, step, audio_on, updated_at) values (${w.coupleId}, ${w.partner}, ${status}, ${step}, ${audio}, now()) on conflict (couple_id, partner) do update set status = excluded.status, step = excluded.step, audio_on = excluded.audio_on, updated_at = now()`);
    return Response.json({ success: true });
  } catch (e) {
    console.error("Parcours (enregistrement):", e);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}