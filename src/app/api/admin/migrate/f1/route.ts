import { adminOu401 } from "@/lib/platform";
import { sql } from "drizzle-orm"; import { db } from "@/db";
export const dynamic = "force-dynamic";
export async function POST(){
  const __adm = await adminOu401();
  if (__adm.reponse) return __adm.reponse;
  try{
    await db.execute(sql`CREATE TABLE IF NOT EXISTS medias (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), youtube_url TEXT NOT NULL, youtube_id TEXT, category TEXT CHECK (category IN ('entree-maries','ballet-danse','chants-dansants','sortie-eglise','musique-ambiance','deco-salle','tenue-traditionnelle','photographie')), title TEXT, country_ids UUID[] DEFAULT '{}', city_ids UUID[] DEFAULT '{}', order_index INT DEFAULT 0, is_featured BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS partenaires (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, logo_url TEXT, website TEXT, country_ids UUID[] DEFAULT '{}', order_index INT DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS site_contents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), key TEXT UNIQUE NOT NULL, value JSONB DEFAULT '{}', updated_at TIMESTAMPTZ DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS social_links (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), platform TEXT CHECK (platform IN ('facebook','tiktok','instagram','youtube','whatsapp_channel','whatsapp_group')), url TEXT NOT NULL, country_ids UUID[] DEFAULT '{}', order_index INT DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS faqs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), question TEXT, answer TEXT, country_id UUID REFERENCES countries(id), order_index INT DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW())`);
    // site_settings colonnes manquantes sans écraser
    try{ await db.execute(sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_signature TEXT DEFAULT '©{YEAR} Wedding Mood Africa. Tous droits réservés'`);}catch{}
    try{ await db.execute(sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS group_name TEXT DEFAULT 'Wedding Mood Africa'`);}catch{}
    try{ await db.execute(sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS rccm TEXT`);}catch{}
    try{ await db.execute(sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS ncc TEXT`);}catch{}
    try{ await db.execute(sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS annonce_active BOOLEAN DEFAULT false`);}catch{}
    try{ await db.execute(sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS annonce_text TEXT`);}catch{}
    try{ await db.execute(sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS annonce_color TEXT DEFAULT '#D4AF37'`);}catch{}
    try{ await db.execute(sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS annonce_end_date DATE`);}catch{}
    // seed site_contents clés si vide
    await db.execute(sql`INSERT INTO site_contents(key,value) VALUES ('phones','{}'),('whatsapps','{}'),('emails','{}'),('addresses','{}') ON CONFLICT(key) DO NOTHING`);
    return Response.json({success:true, message:"F1 tables OK"});
  }catch(e){ return Response.json({success:false, message:(e as Error).message},{status:500}); }
}