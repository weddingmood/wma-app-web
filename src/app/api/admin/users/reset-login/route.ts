import { sql } from "drizzle-orm";
import { db } from "@/db";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
export const dynamic = "force-dynamic";
const KEY = (process.env.RESET_ENCRYPT_KEY || "wm-2026-bouake-store-5ans-secure-key-32b!").slice(0,32).padEnd(32,"0");
function encrypt(t: string){ const iv=randomBytes(12); const c=createCipheriv("aes-256-gcm", Buffer.from(KEY), iv); const enc=Buffer.concat([c.update(t,"utf8"), c.final()]); const tag=c.getAuthTag(); return Buffer.concat([iv,tag,enc]).toString("base64"); }
function decrypt(b64: string){ const d=Buffer.from(b64,"base64"); const iv=d.subarray(0,12); const tag=d.subarray(12,28); const enc=d.subarray(28); const dec=createDecipheriv("aes-256-gcm", Buffer.from(KEY), iv); dec.setAuthTag(tag); return Buffer.concat([dec.update(enc), dec.final()]).toString("utf8"); }
export async function POST(req: Request){
  try{
    const { userId, action, token, newPassword } = await req.json();
    if(action==="generate"){
      if(!userId) return Response.json({success:false},{status:400});
      const payload = JSON.stringify({ userId, exp: Date.now()+86400000 });
      const encrypted = encrypt(payload);
      return Response.json({success:true, link: `/reset-connexion?auth=${encodeURIComponent(encrypted)}`, token: encrypted});
    }
    if(action==="reset"){
      if(!token || !newPassword) return Response.json({success:false, message:"Token + mdp requis"}, {status:400});
      const data = JSON.parse(decrypt(token));
      if(data.exp < Date.now()) return Response.json({success:false, message:"Lien expiré 24h"}, {status:400});
      const { createHash } = await import("crypto");
      const hash = createHash("sha256").update(newPassword).digest("hex");
      await db.execute(sql`UPDATE users SET password_hash=${hash}, updated_at=NOW() WHERE id=${Number(data.userId)}`);
      return Response.json({success:true, message:"Mot de passe réinitialisé (autorisation chiffrée)"});
    }
    return Response.json({success:false}, {status:400});
  }catch(e){ return Response.json({success:false, message:(e as Error).message}, {status:500}); }
}