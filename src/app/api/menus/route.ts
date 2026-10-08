import { sql } from "drizzle-orm"; import { db } from "@/db";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>; function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }
export async function GET(req:Request){
  const {searchParams}=new URL(req.url); const country=searchParams.get('country'); const servings=searchParams.get('servings');
  let q=`SELECT m.*, c.currency as country_currency FROM menus_africains m LEFT JOIN countries c ON c.id=m.country_id WHERE m.is_active=true`;
  if(servings) q+=` AND m.servings=${Number(servings)}`; if(country) q+=` AND (m.country_id IS NULL OR m.country_id='${country}'::uuid)`; q+=` ORDER BY m.servings ASC, m.order_index ASC`;
  const rows=rowsOf(await db.execute(sql.raw(q))); return Response.json({menus:rows});
}