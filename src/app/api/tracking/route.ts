import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/auth-helpers";
import { encryptToken } from "@/lib/tracking-crypto";
import { retryFailed, rowsOf, type SiteRow } from "@/lib/tracking-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function coupleId(): Promise<number | null> {
  if (!(await cookies()).get("wm_session")?.value) return null;
  const session = await getCurrentSession();
  return session?.coupleId ? Number(session.coupleId) : null;
}

const unauthorized = () => Response.json({ success: false, message: "Non autoris\u00e9" }, { status: 401 });

async function ensureSite(id: number) {
  const find = async () =>
    rowsOf(await db.execute(sql`select id, slug, pixel_id, capi_token_enc, test_event_code, ad_spend, currency from tracking_sites where couple_id = ${id} limit 1`))[0];
  let site = await find();
  if (!site) {
    await db.execute(sql`insert into tracking_sites (couple_id, slug) select id, slug from couples where id = ${id} on conflict do nothing`);
    site = await find();
  }
  return site ?? null;
}

export async function GET() {
  const id = await coupleId();
  if (!id) return unauthorized();
  try {
    const site = await ensureSite(id);
    if (!site) return Response.json({ success: false, message: "Espace introuvable" }, { status: 404 });
    const siteId = String(site.id);

    const events = rowsOf(
      await db.execute(sql`
        select id, event_name, value, currency, source, campaign_id, fbc, capi_status, capi_response, created_at
        from tracking_events where site_id = ${siteId} order by created_at desc limit 200
      `)
    );

    const t = rowsOf(
      await db.execute(sql`
        select
          coalesce(sum(value) filter (where event_name = 'Purchase' and source = 'facebook'), 0) as fb_value,
          count(*) filter (where capi_status = 'sent')::int as sent,
          count(*) filter (where capi_status = 'failed')::int as failed,
          count(*) filter (where capi_status = 'pending')::int as pending,
          count(*)::int as total
        from tracking_events where site_id = ${siteId} and created_at > now() - interval '30 days'
      `)
    )[0];

    // ROAS reel : contributions de la cagnotte verifiees sur 30 jours (hors tracking)
    let realValue: number | null = null;
    try {
      const real = rowsOf(
        await db.execute(sql`select coalesce(sum(amount), 0) as v from cagnotte_contributions where couple_id = ${id} and is_verified = true and created_at > now() - interval '30 days'`)
      )[0];
      realValue = Number(real?.v ?? 0);
    } catch {
      realValue = null;
    }

    const spend = Number(site.ad_spend ?? 0);
    const fbValue = Number(t?.fb_value ?? 0);
    return Response.json({
      success: true,
      site: { slug: site.slug, pixelId: site.pixel_id, hasToken: Boolean(site.capi_token_enc), testEventCode: site.test_event_code, adSpend: spend, currency: site.currency },
      events,
      totals: {
        sent: Number(t?.sent ?? 0), failed: Number(t?.failed ?? 0), pending: Number(t?.pending ?? 0), total: Number(t?.total ?? 0),
        fbValue, realValue, roasFacebook: spend > 0 ? fbValue / spend : null, roasReal: spend > 0 && realValue !== null ? realValue / spend : null,
      },
    });
  } catch (error) {
    console.error("Erreur tableau de bord suivi:", error instanceof Error ? error.message : "inconnue");
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const id = await coupleId();
  if (!id) return unauthorized();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const pixelId = String(b.pixelId ?? "").trim();
  const token = String(b.accessToken ?? "").trim();
  const test = String(b.testEventCode ?? "").trim().slice(0, 40);
  const spend = Number(b.adSpend);

  if (pixelId && !/^\d{5,20}$/.test(pixelId)) return Response.json({ success: false, message: "Identifiant de pixel invalide (chiffres uniquement)." }, { status: 400 });
  if (token && (token.length < 20 || token.length > 600)) return Response.json({ success: false, message: "Jeton d'acc\u00e8s invalide." }, { status: 400 });
  if (!Number.isFinite(spend) || spend < 0) return Response.json({ success: false, message: "D\u00e9pense publicitaire invalide." }, { status: 400 });

  try {
    const site = await ensureSite(id);
    if (!site) return Response.json({ success: false, message: "Espace introuvable" }, { status: 404 });
    await db.execute(sql`update tracking_sites set pixel_id = ${pixelId || null}, test_event_code = ${test || null}, ad_spend = ${spend} where id = ${String(site.id)}`);
    if (token) await db.execute(sql`update tracking_sites set capi_token_enc = ${encryptToken(token)} where id = ${String(site.id)}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur reglages suivi:", error instanceof Error ? error.message : "inconnue");
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

// Renvoie les evenements echoues ou en attente
export async function POST() {
  const id = await coupleId();
  if (!id) return unauthorized();
  try {
    const site = await ensureSite(id);
    if (!site) return Response.json({ success: false, message: "Espace introuvable" }, { status: 404 });
    const sent = await retryFailed(site as unknown as SiteRow, 50, 0);
    return Response.json({ success: true, sent });
  } catch (error) {
    console.error("Erreur renvoi suivi:", error instanceof Error ? error.message : "inconnue");
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}