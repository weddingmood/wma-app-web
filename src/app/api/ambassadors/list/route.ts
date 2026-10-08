import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function rowsOf(res: unknown): Row[] {
  if (Array.isArray(res)) return res as Row[];
  const r = res as { rows?: Row[] };
  return r?.rows ?? [];
}

export async function GET() {
  try {
    const list = rowsOf(
      await db.execute(sql`
        select a.referral_slug as slug, a.name, a.city, a.country_slug, a.photo_url, c.name as country_name, c.flag
        from ambassadors a left join countries c on c.slug = a.country_slug
        where a.is_active = true and a.referral_slug is not null
        order by a.is_featured desc, a.total_clients desc, a.name
        limit 300
      `)
    );
    const rateRow = rowsOf(await db.execute(sql`select value from site_settings where key = 'commission_rate' limit 1`))[0];
    const rate = rateRow ? Number(rateRow.value) : 15;
    return Response.json({ success: true, ambassadors: list, commissionRate: Number.isFinite(rate) ? rate : 15 });
  } catch {
    return Response.json({ success: true, ambassadors: [], commissionRate: 15 });
  }
}