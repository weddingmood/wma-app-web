import { sql } from "drizzle-orm"; import { db } from "@/db";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>; function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }
export async function GET(req:Request){
  const {searchParams}=new URL(req.url); const country=searchParams.get('country'); const type=searchParams.get('type');
  let q=`SELECT * FROM modeles_mariage WHERE is_active=true`; if(type) q+=` AND type='${type}'`; if(country) q+=` AND (country_ids='{}' OR '${country}' = ANY(country_ids::text[]))`; q+=` ORDER BY order_index ASC`;
  const rows=rowsOf(await db.execute(sql.raw(q))); return Response.json({modeles:rows});
}