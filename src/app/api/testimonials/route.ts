import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

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
  return { coupleId: session.coupleId };
}

const unauthorized = () => Response.json({ success: false, message: "Non autoris\u00e9" }, { status: 401 });

async function isEligible(coupleId: number): Promise<boolean> {
  const res = await db.execute(sql`
    select 1 as ok from payments
    where couple_id = ${coupleId} and status = 'verified' and reviewed_at <= now() - interval '7 days'
    limit 1
  `);
  return rowsOf(res).length > 0;
}

export async function GET(req: Request) {
  const mine = new URL(req.url).searchParams.get("mine");

  if (!mine) {
    try {
      const res = await db.execute(sql`
        select id, couple_name, city, wedding_date, content, rating
        from testimonials where status = 'approved'
        order by created_at desc limit 5
      `);
      return Response.json({ success: true, testimonials: rowsOf(res) });
    } catch {
      return Response.json({ success: true, testimonials: [] });
    }
  }

  const player = await getPlayer();
  if (!player) return unauthorized();
  try {
    const eligible = await isEligible(player.coupleId);
    const existing = rowsOf(
      await db.execute(sql`select status from testimonials where couple_id = ${player.coupleId} and status in ('pending','approved') limit 1`)
    );
    const info = rowsOf(
      await db.execute(sql`select partner1_name, partner2_name, city from couples where id = ${player.coupleId} limit 1`)
    )[0];
    const defaultName = info ? [info.partner1_name, info.partner2_name].filter(Boolean).join(" & ") : "";
    return Response.json({
      success: true,
      eligible,
      alreadySent: existing.length > 0,
      defaultName,
      defaultCity: info && info.city ? String(info.city) : "",
    });
  } catch (error) {
    console.error("Erreur temoignages (lecture):", error);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const player = await getPlayer();
  if (!player) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const coupleName = String(body.coupleName ?? "").trim().slice(0, 80);
  const city = String(body.city ?? "").trim().slice(0, 60);
  const content = String(body.content ?? "").trim();
  const rating = Number(body.rating);
  if (!coupleName || content.length < 20 || content.length > 600 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json(
      { success: false, message: "Indiquez votre nom, une note de 1 \u00e0 5 et un texte de 20 \u00e0 600 caract\u00e8res." },
      { status: 400 }
    );
  }

  try {
    if (!(await isEligible(player.coupleId))) {
      return Response.json(
        { success: false, message: "Votre t\u00e9moignage sera possible 7 jours apr\u00e8s la validation de votre abonnement." },
        { status: 403 }
      );
    }
    const existing = rowsOf(
      await db.execute(sql`select 1 as ok from testimonials where couple_id = ${player.coupleId} and status in ('pending','approved') limit 1`)
    );
    if (existing.length > 0) {
      return Response.json({ success: false, message: "Vous avez d\u00e9j\u00e0 envoy\u00e9 votre t\u00e9moignage. Merci !" }, { status: 409 });
    }
    const info = rowsOf(await db.execute(sql`select wedding_date from couples where id = ${player.coupleId} limit 1`))[0];
    const weddingDate = info && info.wedding_date ? String(info.wedding_date) : null;

    await db.execute(sql`
      insert into testimonials (couple_id, couple_name, city, wedding_date, content, rating, status)
      values (${player.coupleId}, ${coupleName}, ${city || null}, ${weddingDate}, ${content}, ${rating}, 'pending')
    `);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur temoignages (envoi):", error);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}