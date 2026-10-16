import { sql } from "drizzle-orm";
import { db } from "@/db";
import { sendToFacebookCAPI } from "@/lib/facebook-capi";
import { decryptToken } from "@/lib/tracking-crypto";

type Row = Record<string, unknown>;

export function rowsOf(res: unknown): Row[] {
  if (Array.isArray(res)) return res as Row[];
  const r = res as { rows?: Row[] };
  return r?.rows ?? [];
}

export interface SiteRow {
  id: string;
  pixel_id: string | null;
  capi_token_enc: string | null;
  test_event_code: string | null;
}

export interface EventRow {
  id: string;
  event_id: string;
  event_name: string;
  event_time: Date | string;
  page_url: string | null;
  fbp: string | null;
  fbc: string | null;
  email_hash: string | null;
  user_agent: string | null;
  value: number | string | null;
  currency: string | null;
}

// Envoie un evenement a Facebook puis enregistre le statut (sent / failed / skipped)
export async function deliverEvent(site: SiteRow, ev: EventRow, ip: string | null): Promise<string> {
  const token = decryptToken(site.capi_token_enc);
  if (!site.pixel_id || !site.capi_token_enc) {
    await db.execute(sql`update tracking_events set capi_status = 'skipped' where id = ${ev.id}`);
    return "skipped";
  }
  if (!token) {
    await db.execute(sql`update tracking_events set capi_status = 'failed', capi_attempts = capi_attempts + 1, capi_response = 'jeton illisible' where id = ${ev.id}`);
    return "failed";
  }

  const result = await sendToFacebookCAPI(
    { pixelId: site.pixel_id, accessToken: token, testEventCode: site.test_event_code },
    {
      eventId: ev.event_id,
      eventName: ev.event_name,
      eventTime: Math.floor(new Date(ev.event_time).getTime() / 1000),
      eventSourceUrl: ev.page_url,
      fbp: ev.fbp,
      fbc: ev.fbc,
      emailHash: ev.email_hash,
      userAgent: ev.user_agent,
      ip,
      value: Number(ev.value) || 0,
      currency: ev.currency,
    }
  );

  const detail = result.detail.slice(0, 500);
  if (result.ok) {
    await db.execute(sql`update tracking_events set capi_status = 'sent', capi_attempts = capi_attempts + 1, capi_response = ${detail}, capi_sent_at = now() where id = ${ev.id}`);
    return "sent";
  }
  await db.execute(sql`update tracking_events set capi_status = 'failed', capi_attempts = capi_attempts + 1, capi_response = ${detail} where id = ${ev.id}`);
  return "failed";
}

// Renvoie les evenements en attente ou echoues (5 tentatives maximum, sans IP : elle n'est jamais conservee)
export async function retryFailed(site: SiteRow, limit: number, minAgeMinutes: number): Promise<number> {
  const rows = rowsOf(
    await db.execute(sql`
      select id, event_id, event_name, event_time, page_url, fbp, fbc, email_hash, user_agent, value, currency
      from tracking_events
      where site_id = ${site.id} and capi_status in ('pending','failed') and capi_attempts < 5
        and created_at < now() - (${minAgeMinutes} * interval '1 minute')
      order by created_at limit ${limit}
    `)
  ) as unknown as EventRow[];
  let sent = 0;
  for (const ev of rows) {
    if ((await deliverEvent(site, ev, null)) === "sent") sent++;
  }
  return sent;
}