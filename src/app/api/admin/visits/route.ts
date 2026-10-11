import { sql } from "drizzle-orm";
import { db } from "@/db";
import { adminOu401 } from "@/lib/platform";
import { ensureVisitsTable } from "@/lib/visits";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const rowsOf = (res: unknown): Row[] => (Array.isArray(res) ? (res as Row[]) : ((res as { rows?: Row[] })?.rows ?? []));
const num = (v: unknown) => Number(v ?? 0);

export async function GET(req: Request) {
  const { reponse } = await adminOu401();
  if (reponse) return reponse;
  const asked = Number(new URL(req.url).searchParams.get("days") || 30);
  const days = [7, 30, 90, 365].includes(asked) ? asked : 30;
  try {
    await ensureVisitsTable();
    const tot = async (cond: ReturnType<typeof sql>) => {
      const r = rowsOf(await db.execute(sql`select count(distinct session_id)::int as visits, count(*)::int as views from site_visits where path not like 'event:%' and ${cond}`))[0] || {};
      return { visits: num(r.visits), views: num(r.views) };
    };
    const today = await tot(sql`created_at >= date_trunc('day', now())`);
    const week = await tot(sql`created_at > now() - interval '7 days'`);
    const period = await tot(sql`created_at > now() - make_interval(days => ${days})`);

    const byCountry = rowsOf(await db.execute(sql`
      select coalesce(country, '??') as country, count(distinct session_id)::int as visits, count(*)::int as views
      from site_visits where path not like 'event:%' and created_at > now() - make_interval(days => ${days})
      group by 1 order by 2 desc, 3 desc limit 30`)).map((r) => ({ country: String(r.country), visits: num(r.visits), views: num(r.views) }));

    const byRegion = rowsOf(await db.execute(sql`
      select coalesce(country, '??') as country, coalesce(region, '-') as region, mode() within group (order by city) as city, count(distinct session_id)::int as visits
      from site_visits where path not like 'event:%' and created_at > now() - make_interval(days => ${days})
      group by 1, 2 order by 4 desc limit 30`)).map((r) => ({ country: String(r.country), region: String(r.region), city: r.city ? String(r.city) : null, visits: num(r.visits) }));

    const topCities = rowsOf(await db.execute(sql`
      select city, country, count(distinct session_id)::int as visits
      from site_visits where path not like 'event:%' and city is not null and created_at > now() - make_interval(days => ${days})
      group by city, country order by 3 desc limit 15`)).map((r) => ({ city: String(r.city), country: r.country ? String(r.country) : null, visits: num(r.visits) }));

    const topPages = rowsOf(await db.execute(sql`
      select path, count(*)::int as views
      from site_visits where path not like 'event:%' and created_at > now() - make_interval(days => ${days})
      group by path order by 2 desc limit 10`)).map((r) => ({ path: String(r.path), views: num(r.views) }));

    const daily = rowsOf(await db.execute(sql`
      select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, count(distinct session_id)::int as visits
      from site_visits where path not like 'event:%' and created_at > now() - make_interval(days => ${days})
      group by 1 order by 1 desc limit 60`)).map((r) => ({ day: String(r.day), visits: num(r.visits) })).reverse();

    const bySource = rowsOf(await db.execute(sql`
      select coalesce(nullif(case when referrer like 'utm:%' then referrer else substring(referrer from '^https?://([^/]+)') end, ''), 'direct') as source, count(distinct session_id)::int as visits
      from site_visits where path not like 'event:%' and created_at > now() - make_interval(days => ${days})
      group by 1 order by 2 desc limit 12`)).map((r) => ({ source: String(r.source), visits: num(r.visits) }));

    const win = sql`created_at > now() - make_interval(days => ${days})`;
    const cnt = async (cond: ReturnType<typeof sql>) => {
      const r = rowsOf(await db.execute(sql`select count(distinct session_id)::int as n from site_visits where ${win} and ${cond}`))[0];
      return num(r?.n);
    };
    const visitors = await cnt(sql`path not like 'event:%'`);
    const home = await cnt(sql`path = '/'`);
    const pricing = await cnt(sql`path in ('/abonnement', '/dashboard/subscription')`);
    const waveClick = await cnt(sql`path = 'event:click_wave'`);
    const confirmPage = await cnt(sql`path = '/confirmation-paiement'`);
    const whatsappClick = await cnt(sql`path = 'event:click_whatsapp'`);
    const promoClick = await cnt(sql`path = 'event:click_invitation_promo'`);
    let signups: number | null = null;
    let payments: number | null = null;
    try { signups = num(rowsOf(await db.execute(sql`select count(*)::int as n from couples where created_at > now() - make_interval(days => ${days})`))[0]?.n); } catch {}
    try { payments = num(rowsOf(await db.execute(sql`select count(*)::int as n from payments where created_at > now() - make_interval(days => ${days})`))[0]?.n); } catch {}

    return Response.json({
      success: true, days, today, week, period, byCountry, byRegion, topCities, topPages, daily, bySource,
      funnel: { visitors, home, pricing, waveClick, confirmPage, whatsappClick, promoClick, signups, payments },
    });
  } catch (e) {
    console.error("Statistiques visites:", e);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}