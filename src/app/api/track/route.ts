import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { anonymizeIp, clientIp, detectSource, hashEmail, isEmail, isHex64 } from "@/lib/tracking";
import { deliverEvent, retryFailed, rowsOf, type EventRow, type SiteRow } from "@/lib/tracking-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EVENTS: Record<string, string> = {
  PageView: "PageView", ViewContent: "ViewContent", Lead: "Lead", Purchase: "Purchase",
  page_view: "PageView", view_content: "ViewContent", lead: "Lead", purchase: "Purchase",
};

function cors(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": req.headers.get("origin") || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req) });
}

export async function POST(req: Request) {
  const headers = cors(req);
  const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });

  // 1) Lecture et validation (le navigateur envoie du text/plain pour eviter la pre-verification CORS)
  const raw = await req.text();
  if (raw.length > 8000) return reply({ ok: false, error: "payload_too_large" }, 413);
  let b: Record<string, unknown>;
  try {
    b = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return reply({ ok: false, error: "invalid_json" }, 400);
  }

  const slug = str(b.site, 120).toLowerCase();
  const eventName = EVENTS[str(b.event, 30)];
  if (!/^[a-z0-9-]{2,120}$/.test(slug) || !eventName) return reply({ ok: false, error: "invalid_event" }, 400);
  if (b.consent !== true) return reply({ ok: true, ignored: "no_consent" }, 202); // consent mode : rien n'est stocke

  try {
    // 2) Site de suivi (cree automatiquement pour un slug de couple existant)
    const find = async () =>
      rowsOf(await db.execute(sql`select id, pixel_id, capi_token_enc, test_event_code from tracking_sites where slug = ${slug} limit 1`))[0] as unknown as SiteRow | undefined;
    let site = await find();
    if (!site) {
      await db.execute(sql`insert into tracking_sites (couple_id, slug) select id, slug from couples where lower(slug) = ${slug} on conflict do nothing`);
      site = await find();
    }
    if (!site) return reply({ ok: false, error: "unknown_site" }, 404);

    // 3) Donnees de l'evenement
    const eventId = /^[A-Za-z0-9_-]{8,64}$/.test(str(b.event_id, 64)) ? str(b.event_id, 64) : randomUUID();
    const ip = clientIp(req);
    const ipAnon = anonymizeIp(ip);
    const ua = (req.headers.get("user-agent") || "").slice(0, 300);

    const emailHash = isHex64(b.email_hash) ? b.email_hash : isEmail(b.email) ? hashEmail(b.email) : null;
    const valueRaw = Number(b.value);
    const value = Number.isFinite(valueRaw) && valueRaw >= 0 && valueRaw <= 1e9 ? valueRaw : 0;
    const currency = /^[A-Za-z]{3}$/.test(str(b.currency, 3)) ? str(b.currency, 3).toUpperCase() : "XOF";
    const ts = Number(b.ts);
    const eventTime = new Date(Number.isFinite(ts) && Math.abs(Date.now() - ts) < 86400000 ? ts : Date.now()).toISOString();

    const fbp = str(b.fbp, 120) || null;
    const fbc = str(b.fbc, 200) || null;
    const fbclid = str(b.fbclid, 200) || null;
    const utmSource = str(b.utm_source, 80) || null;
    const referrer = str(b.ref, 500) || null;
    const pageUrl = str(b.url, 500) || null;
    const source = detectSource({ fbclid: fbclid || "", fbc: fbc || "", gclid: str(b.gclid, 200), utmSource: utmSource || "", referrer: referrer || "" });

    // 4) Limite simple par site et par IP anonymisee
    if (ipAnon) {
      const recent = rowsOf(
        await db.execute(sql`select count(*)::int as n from tracking_events where site_id = ${site.id} and ip_anon = ${ipAnon} and created_at > now() - interval '1 minute'`)
      )[0];
      if (Number(recent?.n ?? 0) > 300) return reply({ ok: false, error: "rate_limited" }, 429);
    }

    // 5) Stockage ; (site, event_id) unique : un doublon est ignore
    const inserted = rowsOf(
      await db.execute(sql`
        insert into tracking_events (site_id, event_id, event_name, event_time, value, currency, source, campaign_id,
          utm_source, utm_medium, utm_campaign, fbp, fbc, fbclid, email_hash, ip_anon, user_agent, page_url, referrer, consent)
        values (${site.id}, ${eventId}, ${eventName}, ${eventTime}::timestamptz, ${value}, ${currency}, ${source}, ${str(b.campaign_id, 80) || null},
          ${utmSource}, ${str(b.utm_medium, 80) || null}, ${str(b.utm_campaign, 120) || null}, ${fbp}, ${fbc}, ${fbclid}, ${emailHash},
          ${ipAnon}, ${ua || null}, ${pageUrl}, ${referrer}, true)
        on conflict (site_id, event_id) do nothing
        returning id
      `)
    )[0];
    if (!inserted) return reply({ ok: true, event_id: eventId, deduplicated: true });

    // 6) Envoi a Facebook avec l'IP complete (en memoire seulement)
    const ev: EventRow = {
      id: String(inserted.id), event_id: eventId, event_name: eventName, event_time: eventTime, page_url: pageUrl,
      fbp, fbc, email_hash: emailHash, user_agent: ua || null, value, currency,
    };
    const status = await deliverEvent(site, ev, ip);

    // 7) Rattrapage opportuniste des anciens echecs de ce site
    await retryFailed(site, 3, 2).catch(() => 0);

    return reply({ ok: true, event_id: eventId, capi: status });
  } catch (error) {
    console.error("Erreur /api/track:", error instanceof Error ? error.message : "inconnue");
    return reply({ ok: false, error: "server_error" }, 500);
  }
}