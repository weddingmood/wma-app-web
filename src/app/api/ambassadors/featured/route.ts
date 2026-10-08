import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await db.execute(sql`
      select a.name, a.city, a.bio, a.photo_url, a.referral_slug, c.name as country_name, c.flag
      from ambassadors a left join countries c on c.slug = a.country_slug
      where a.is_featured = true and a.is_active = true
      order by a.total_clients desc, a.created_at desc
      limit 12
    `);
    const rows = Array.isArray(res) ? res : ((res as { rows?: unknown[] }).rows ?? []);
    return Response.json({ success: true, ambassadors: rows });
  } catch {
    return Response.json({ success: true, ambassadors: [] });
  }
}