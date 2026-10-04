import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/auth-helpers";
import { refuserSiEssaiExpire } from "@/lib/access-guard";

export const dynamic = "force-dynamic";

const KINDS = ["join", "offer", "answer", "ice", "leave"];

function rowsOf(res: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(res)) return res as Array<Record<string, unknown>>;
  const r = res as { rows?: Array<Record<string, unknown>> };
  return r?.rows ?? [];
}

async function getPlayer() {
  const cookieStore = await cookies();
  if (!cookieStore.get("wm_session")?.value) return null;
  const session = await getCurrentSession();
  if (!session?.coupleId) return null;
  return { coupleId: session.coupleId, partner: session.activePartner as string };
}

const unauthorized = () => Response.json({ success: false, message: "Non autoris\u00e9" }, { status: 401 });

export async function GET(req: Request) {
  const player = await getPlayer();
  if (!player) return unauthorized();

  const since = Number(new URL(req.url).searchParams.get("since") || 0);
  const safeSince = Number.isFinite(since) && since >= 0 ? Math.floor(since) : 0;

  try {
    const res = await db.execute(sql`
      select id, kind, payload from voice_signals
      where couple_id = ${player.coupleId}
        and from_partner <> ${player.partner}
        and id > ${safeSince}
        and created_at > now() - interval '2 minutes'
      order by id asc
      limit 100
    `);
    const signals = rowsOf(res).map((r) => ({
      id: Number(r.id),
      kind: String(r.kind),
      payload: r.payload === null || r.payload === undefined ? null : String(r.payload),
    }));
    return Response.json({ success: true, you: player.partner, signals });
  } catch (error) {
    console.error("Erreur voix (lecture):", error);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const player = await getPlayer();
  if (!player) return unauthorized();

  const blocage = await refuserSiEssaiExpire(player.coupleId);
  if (blocage) return blocage;

  const body = (await req.json().catch(() => ({}))) as { kind?: unknown; payload?: unknown };
  const kind = typeof body.kind === "string" ? body.kind : "";
  const payload = typeof body.payload === "string" ? body.payload : null;
  if (!KINDS.includes(kind) || (payload !== null && payload.length > 20000)) {
    return Response.json({ success: false, message: "Requ\u00eate invalide." }, { status: 400 });
  }

  try {
    await db.execute(sql`delete from voice_signals where created_at < now() - interval '10 minutes'`);
    await db.execute(sql`
      insert into voice_signals (couple_id, from_partner, kind, payload)
      values (${player.coupleId}, ${player.partner}, ${kind}, ${payload})
    `);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur voix (envoi):", error);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE() {
  const player = await getPlayer();
  if (!player) return unauthorized();
  try {
    await db.execute(sql`delete from voice_signals where couple_id = ${player.coupleId} and from_partner = ${player.partner}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur voix (nettoyage):", error);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}