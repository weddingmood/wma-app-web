import { sql } from "drizzle-orm"; import { db } from "@/db";
export const dynamic = "force-dynamic";
function extractId(url:string){ const m=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/); return m?m[1]:null; }
type Row = Record<string, unknown>; function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }
export async function GET(){ const rows=rowsOf(await db.execute(sql`SELECT * FROM medias ORDER BY order_index ASC, created_at DESC`)); return Response.json({medias:rows}); }
export async function POST(req:Request){
  const b=await req.json(); const yid=extractId(b.youtube_url)||b.youtube_id; const thumb=yid?`https://img.youtube.com/vi/${yid}/mqdefault.jpg`:null;
  await db.execute(sql`INSERT INTO medias(youtube_url,youtube_id,category,title,country_ids,order_index,is_featured,is_active) VALUES(${b.youtube_url},${yid},${b.category},${b.title},${b.country_ids||[]},${b.order_index||0},${b.is_featured||false},${b.is_active??true})`);
  return Response.json({success:true, thumbnail:thumb, youtube_id:yid});
}