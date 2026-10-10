import { adminOu401 } from "@/lib/platform";
import { sql } from "drizzle-orm"; import { db } from "@/db";
export const dynamic = "force-dynamic";
export async function POST(){
  const __adm = await adminOu401();
  if (__adm.reponse) return __adm.reponse;
  try{
    await db.execute(sql`CREATE TABLE IF NOT EXISTS modeles_mariage (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), type TEXT CHECK (type IN ('traditionnel','moderne','petit-budget','grand-standing','mixte','royal')), title TEXT NOT NULL, description TEXT, cover_image TEXT, checklist JSONB DEFAULT '[]', musiques JSONB DEFAULT '[]', video_entree_url TEXT, video_ballet_url TEXT, video_entree_id TEXT, video_ballet_id TEXT, country_ids UUID[] DEFAULT '{}', city_ids UUID[] DEFAULT '{}', order_index INT DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW())`);
    return Response.json({success:true});
  }catch(e){ return Response.json({success:false,message:(e as Error).message},{status:500}); }
}