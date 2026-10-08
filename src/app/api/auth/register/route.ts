import { sql } from "drizzle-orm";
import { db } from "@/db";
import { createHash } from "crypto";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>;
function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }
export async function POST(req: Request){
  try{
    const b = await req.json();
    const email = String(b.email||"").trim().toLowerCase();
    const phone = String(b.phone||b.contact||"").trim();
    const couple = String(b.couple_name||b.nom||"").trim();
    const pwd = String(b.password||"");
    if(!email || !phone || !couple || !pwd) return Response.json({success:false, message:"Mail + nom couple + contact + mdp requis"}, {status:400});
    const dup = rowsOf(await db.execute(sql`SELECT id,email,phone FROM users WHERE LOWER(email)=${email} OR phone=${phone} OR LOWER(couple_name)=${couple.toLowerCase()} LIMIT 1`));
    if(dup.length>0) return Response.json({success:false, message:`Doublon bloqué: ${ (dup[0] as any).email } / ${ (dup[0] as any).phone } existe déjà. 1 mail+nom+contact = 1 seul compte.`}, {status:409});
    const hash = createHash("sha256").update(pwd).digest("hex");
    const code = "WM-"+Math.random().toString(36).substring(2,8).toUpperCase();
    await db.execute(sql`INSERT INTO users(email, phone, couple_name, password_hash, code_unique, subscription_status, created_at) VALUES(${email}, ${phone}, ${couple}, ${hash}, ${code}, 'trial', NOW())`);
    return Response.json({success:true, code_unique: code, message:"Compte créé - 1 couple unique"});
  }catch(e){ return Response.json({success:false, message:(e as Error).message}, {status:500}); }
}