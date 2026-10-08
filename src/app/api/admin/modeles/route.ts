import { sql } from "drizzle-orm"; import { db } from "@/db";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>; function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }
function extractId(url:string){ if(!url) return null; const m=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/); return m?m[1]:null; }
export async function GET(){ const rows=rowsOf(await db.execute(sql`SELECT * FROM modeles_mariage ORDER BY order_index ASC, created_at DESC`)); return Response.json({modeles:rows}); }
export async function POST(req:Request){
  const b=await req.json();
  await db.execute(sql`INSERT INTO modeles_mariage(type,title,description,cover_image,checklist,musiques,video_entree_url,video_ballet_url,video_entree_id,video_ballet_id,country_ids,order_index,is_active) VALUES(${b.type},${b.title},${b.description},${b.cover_image},${JSON.stringify(b.checklist||[])},${JSON.stringify(b.musiques||[])},${b.video_entree_url},${b.video_ballet_url},${extractId(b.video_entree_url)},${extractId(b.video_ballet_url)},${b.country_ids||[]},${b.order_index||0},${b.is_active??true})`);
  return Response.json({success:true});
}