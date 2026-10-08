import { sql } from "drizzle-orm"; import { db } from "@/db";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>; function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }
export async function GET(){ const rows=rowsOf(await db.execute(sql`SELECT * FROM partenaires ORDER BY order_index ASC`)); return Response.json({partenaires:rows}); }
export async function POST(req:Request){ const b=await req.json(); await db.execute(sql`INSERT INTO partenaires(name,logo_url,website,country_ids,order_index,is_active) VALUES(${b.name},${b.logo_url},${b.website},${b.country_ids||[]},${b.order_index||0},${b.is_active??true})`); return Response.json({success:true}); }