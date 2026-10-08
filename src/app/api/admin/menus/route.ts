import { sql } from "drizzle-orm"; import { db } from "@/db";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>; function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }
export async function GET(){ const rows=rowsOf(await db.execute(sql`SELECT * FROM menus_africains ORDER BY servings ASC, order_index ASC`)); return Response.json({menus:rows}); }
export async function POST(req:Request){
  const b=await req.json(); const total=(b.dishes||[]).reduce((s:number,d:any)=>s+Number(d.quantity||0)*Number(d.unit_price||0),0);
  await db.execute(sql`INSERT INTO menus_africains(name,servings,dishes,total_price,cover_image,country_id,currency,order_index,is_active) VALUES(${b.name},${b.servings},${JSON.stringify(b.dishes||[])},${total},${b.cover_image},${b.country_id},${b.currency||"XOF"},${b.order_index||0},${b.is_active??true})`);
  return Response.json({success:true,total_price:total});
}