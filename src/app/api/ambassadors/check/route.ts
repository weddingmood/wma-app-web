import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function rowsOf(res: unknown): Row[] {
  if (Array.isArray(res)) return res as Row[];
  const r = res as { rows?: Row[] };
  return r?.rows ?? [];
}

export async function GET(req: Request) {
  let code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase();
  if (!code) code = ((await cookies()).get("ambassador_code")?.value || "").trim().toUpperCase();
  if (!code || code.length > 40) return Response.json({ success: true, valid: false });

  try {
    const amb = rowsOf(
      await db.execute(sql`
        select a.code_unique, a.referral_slug, a.name, a.city, a.country_slug, a.photo_url, c.name as country_name, c.flag
        from ambassadors a left join countries c on c.slug = a.country_slug
        where a.code_unique = ${code} and a.is_active = true
        limit 1
      `)
    )[0];
    if (!amb) return Response.json({ success: true, valid: false });

    const rateRow = rowsOf(await db.execute(sql`select value from site_settings where key = 'commission_rate' limit 1`))[0];
    const rate = rateRow ? Number(rateRow.value) : 15;
    return Response.json({
      success: true,
      valid: true,
      commissionRate: Number.isFinite(rate) ? rate : 15,
      ambassador: {
        slug: amb.referral_slug ? String(amb.referral_slug) : "",
        name: String(amb.name),
        city: amb.city ? String(amb.city) : "",
        countrySlug: amb.country_slug ? String(amb.country_slug) : "",
        countryName: amb.country_name ? String(amb.country_name) : "",
        flag: amb.flag ? String(amb.flag) : "",
        photoUrl: amb.photo_url ? String(amb.photo_url) : "",
      },
    });
  } catch {
    return Response.json({ success: true, valid: false });
  }
}