import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
function rowsOf(res: unknown): Row[] {
  if (Array.isArray(res)) return res as Row[];
  const r = res as { rows?: Row[] };
  return r?.rows ?? [];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country");
  const servings = Math.floor(Number(searchParams.get("servings") || 0));

  let q = "SELECT m.*, c.currency as country_currency FROM menus_africains m LEFT JOIN countries c ON c.id=m.country_id WHERE m.is_active=true";
  if (servings > 0) q += " AND m.servings=" + servings;
  if (country && UUID.test(country)) q += " AND (m.country_id IS NULL OR m.country_id='" + country + "'::uuid)";
  q += " ORDER BY m.servings ASC, m.order_index ASC";

  try {
    const rows = rowsOf(await db.execute(sql.raw(q)));
    return Response.json({ menus: rows });
  } catch (e) {
    console.error("Menus:", e);
    return Response.json({ menus: [], detail: (e as Error).message });
  }
}