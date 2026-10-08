import { sql } from "drizzle-orm"; import { db } from "@/db";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>; function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }
export async function GET(){
  try{
    await db.execute(sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMPTZ DEFAULT NOW())`);
    const rows = rowsOf(await db.execute(sql`SELECT key,value FROM settings`));
    const m: Record<string,string> = {}; rows.forEach((r:any)=>m[r.key]=r.value);
    // Tes valeurs actuelles sur la capture: 0 et 5000 -> si vide on garde 0/5000 pour ne pas casser
    if(!m.commission_rate) m.commission_rate="0";
    if(!m.payout_threshold) m.payout_threshold=m.seuil_paiement||"5000";
    if(!m.seuil_paiement) m.seuil_paiement=m.payout_threshold||"5000";
    return Response.json({settings:m, commission: m.commission_rate, seuil: m.payout_threshold});
  }catch(e){ return Response.json({settings:{commission_rate:"0", payout_threshold:"5000"}, error:(e as Error).message}); }
}
export async function POST(req: Request){
  try{
    const b = await req.json();
    await db.execute(sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMPTZ DEFAULT NOW())`);
    for(const k of Object.keys(b)){
      await db.execute(sql`INSERT INTO settings(key,value,updated_at) VALUES(${k},${String(b[k])},NOW()) ON CONFLICT(key) DO UPDATE SET value=${String(b[k])}, updated_at=NOW()`);
    }
    return Response.json({success:true, message:"Modifications enregistrées ✓"});
  }catch(e){ return Response.json({success:false, message:(e as Error).message}, {status:500}); }
}