import { sql } from "drizzle-orm"; import { db } from "@/db";
import { PUBLIC_KEYS, readSettings } from "@/lib/wma-settings";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>; function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }
export async function GET(){
  try{
    const rows=rowsOf(await db.execute(sql`SELECT key,value FROM site_contents`));
    const settings:any = (await db.execute(sql`SELECT footer_signature,group_name,rccm,ncc,annonce_active,annonce_text,annonce_color,annonce_end_date FROM site_settings LIMIT 1`)) as any;
    const s = settings.rows?.[0] || settings[0] || {};
    const socials=rowsOf(await db.execute(sql`SELECT * FROM social_links WHERE is_active=true ORDER BY order_index ASC`));
    const partenaires=rowsOf(await db.execute(sql`SELECT * FROM partenaires WHERE is_active=true ORDER BY order_index ASC`));
    const wma = await readSettings(PUBLIC_KEYS);
    return Response.json({contents:rows, settings:s, socials, partenaires, wma});
  }catch(e){ return Response.json({contents:[], error:(e as Error).message}); }
}