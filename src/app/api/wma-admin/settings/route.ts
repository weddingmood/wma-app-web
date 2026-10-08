import { sql } from "drizzle-orm"; import { db } from "@/db";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>; function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }
// Alias pour ton ancienne route si ta page appelle /api/wma-admin/...
export async function GET(){
  try{
    await db.execute(sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMPTZ DEFAULT NOW())`);
    const rows = rowsOf(await db.execute(sql`SELECT key,value FROM settings`));
    const m: Record<string,string> = {}; rows.forEach((r:any)=>m[r.key]=r.value);
    return Response.json({success:true, commission: Number(m.commission_rate||0), seuil: Number(m.payout_threshold||5000), settings:m});
  }catch(e){ return Response.json({success:false, message:(e as Error).message}); }
}
export async function POST(req: Request){
  const b = await req.json();
  await db.execute(sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMPTZ DEFAULT NOW())`);
  for(const k of Object.keys(b)){
    await db.execute(sql`INSERT INTO settings(key,value,updated_at) VALUES(${k},${String(b[k])},NOW()) ON CONFLICT(key) DO UPDATE SET value=${String(b[k])}, updated_at=NOW()`);
  }
  return Response.json({success:true, message:"Modifications enregistrées ✓"});
}