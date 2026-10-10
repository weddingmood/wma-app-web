import { adminOu401 } from "@/lib/platform";
import { sql } from "drizzle-orm"; import { db } from "@/db";
export const dynamic = "force-dynamic";
export async function POST(){
  const __adm = await adminOu401();
  if (__adm.reponse) return __adm.reponse;
  try{
    await db.execute(sql`CREATE TABLE IF NOT EXISTS menus_africains (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, servings INT CHECK (servings IN (100,200,300,400,500,1000)), dishes JSONB DEFAULT '[]', total_price NUMERIC DEFAULT 0, cover_image TEXT, country_id UUID REFERENCES countries(id), city_id UUID, currency TEXT DEFAULT 'XOF', order_index INT DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW())`);
    return Response.json({success:true});
  }catch(e){ return Response.json({success:false,message:(e as Error).message},{status:500}); }
}