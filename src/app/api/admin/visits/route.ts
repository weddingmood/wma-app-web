import { sql } from "drizzle-orm";
import { db } from "@/db";
import { adminOu401 } from "@/lib/platform";
import { ensureVisitsTable } from "@/lib/visits";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const rowsOf = (res: unknown): Row[] => (Array.isArray(res) ? (res as Row[]) : ((res as { rows?: Row[] })?.rows ?? []));
const num = (v: unknown) => Number(v ?? 0);

type Tally = Map<string, Map<string, number>>;
function add(m: Tally, key: string, source: string, v: number) {
  const inner = m.get(key) ?? new Map<string, number>();
  inner.set(source, (inner.get(source) ?? 0) + v);
  m.set(key, inner);
}
function top(m: Map<string, number> | undefined): string | null {
  if (!m) return null;
  let best: string | null = null;
  let bestValue = -1;
  m.forEach((v, k) => {
    if (v > bestValue) { bestValue = v; best = k; }
  });
  return best;
}

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

    const srcRows = rowsOf(await db.execute(sql`
      with first as (
        select distinct on (session_id) session_id, coalesce(country, '??') as country, coalesce(region, '-') as region, coalesce(city, '') as city, lower(coalesce(referrer, '')) as r
        from site_visits
        where path not like 'event:%' and created_at > now() - make_interval(days => ${days})
        order by session_id, created_at asc
      )
      select country, region, city,
        case
          when r like 'utm:%' then
            case substring(r from 5)
              when 'whatsapp' then 'WhatsApp'
              when 'facebook' then 'Facebook'
              when 'instagram' then 'Instagram'
              when 'tiktok' then 'TikTok'
              when 'youtube' then 'YouTube'
              when 'telegram' then 'Telegram'
              when 'invitation' then 'Invitation d''un couple'
              when 'pwa' then 'Application install\u00e9e'
              when 'pwa_shortcut' then 'Application install\u00e9e'
              else 'Lien suivi : ' || substring(r from 5) end
          when r like '%weddingmood%' or r like '%bouakestore%' then 'Navigation interne'
          when r ~ 'facebook|fb[.]com|fb[.]me|katana' then 'Facebook'
          when r ~ 'whatsapp|wa[.]me' then 'WhatsApp'
          when r ~ 'instagram' then 'Instagram'
          when r ~ 'tiktok|musically' then 'TikTok'
          when r ~ 'youtube|youtu[.]be' then 'YouTube'
          when r ~ 'google' then 'Google'
          when r ~ 'bing|duckduckgo|yahoo|ecosia|qwant' then 'Autre moteur de recherche'
          when r ~ 'twitter[.]com|//t[.]co|//x[.]com|//www[.]x[.]com' then 'X (Twitter)'
          when r ~ 'telegram|//t[.]me' then 'Telegram'
          when r ~ 'linkedin' then 'LinkedIn'
          when r like 'android-app://%' then 'Application mobile'
          when r = '' then 'Acc\u00e8s direct'
          else coalesce(substring(r from '^https?://([^/]+)'), r)
        end as source,
        count(*)::int as visits
      from first
      group by 1, 2, 3, 4
    `)).map((r) => ({ country: String(r.country), region: String(r.region), city: String(r.city), source: String(r.source), visits: num(r.visits) }));

    const totalBySource = new Map<string, number>();
    const byC: Tally = new Map();
    const byR: Tally = new Map();
    const byCity: Tally = new Map();
    for (const r of srcRows) {
      totalBySource.set(r.source, (totalBySource.get(r.source) ?? 0) + r.visits);
      add(byC, r.country, r.source, r.visits);
      add(byR, r.country + "|" + r.region, r.source, r.visits);
      if (r.city) add(byCity, r.city + "|" + r.country, r.source, r.visits);
    }
    const bySource = Array.from(totalBySource.entries())
      .map(([source, visits]) => ({ source, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 12);

    const byCountry = rowsOf(await db.execute(sql`
      select coalesce(country, '??') as country, count(distinct session_id)::int as visits, count(*)::int as views
      from site_visits where path not like 'event:%' and created_at > now() - make_interval(days => ${days})
      group by 1 order by 2 desc, 3 desc limit 30`)).map((r) => ({ country: String(r.country), visits: num(r.visits), views: num(r.views), topSource: top(byC.get(String(r.country))) }));

    const byRegion = rowsOf(await db.execute(sql`
      select coalesce(country, '??') as country, coalesce(region, '-') as region, mode() within group (order by city) as city, count(distinct session_id)::int as visits
      from site_visits where path not like 'event:%' and created_at > now() - make_interval(days => ${days})
      group by 1, 2 order by 4 desc limit 30`)).map((r) => ({ country: String(r.country), region: String(r.region), city: r.city ? String(r.city) : null, visits: num(r.visits), topSource: top(byR.get(String(r.country) + "|" + String(r.region))) }));

    const topCities = rowsOf(await db.execute(sql`
      select city, country, count(distinct session_id)::int as visits
      from site_visits where path not like 'event:%' and city is not null and created_at > now() - make_interval(days => ${days})
      group by city, country order by 3 desc limit 15`)).map((r) => ({ city: String(r.city), country: r.country ? String(r.country) : null, visits: num(r.visits), topSource: top(byCity.get(String(r.city) + "|" + (r.country ? String(r.country) : "??"))) }));

    const topPages = rowsOf(await db.execute(sql`
      select path, count(*)::int as views
      from site_visits where path not like 'event:%' and created_at > now() - make_interval(days => ${days})
      group by path order by 2 desc limit 10`)).map((r) => ({ path: String(r.path), views: num(r.views) }));

    const daily = rowsOf(await db.execute(sql`
      select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, count(distinct session_id)::int as visits
      from site_visits where path not like 'event:%' and created_at > now() - make_interval(days => ${days})
      group by 1 order by 1 desc limit 60`)).map((r) => ({ day: String(r.day), visits: num(r.visits) })).reverse();

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