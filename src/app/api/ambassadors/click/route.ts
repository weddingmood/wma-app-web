import { sql } from "drizzle-orm";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function rowsOf(res: unknown): Row[] {
  if (Array.isArray(res)) return res as Row[];
  const r = res as { rows?: Row[] };
  return r?.rows ?? [];
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { slug?: unknown };
  const slug = String(body.slug ?? "").trim().toLowerCase().slice(0, 60);
  if (!slug) return Response.json({ success: false }, { status: 400 });

  try {
    const amb = rowsOf(
      await db.execute(sql`select id, code_unique, country_slug from ambassadors where referral_slug = ${slug} and is_active = true limit 1`)
    )[0];
    if (!amb) return Response.json({ success: false }, { status: 404 });

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "inconnue";
    const ipHash = createHash("sha256").update(ip + "|" + String(amb.id)).digest("hex").slice(0, 32);

    // Un seul clic par appareil et par ambassadeur toutes les 30 minutes
    const recent = rowsOf(
      await db.execute(sql`
        select 1 as ok from ambassador_clicks
        where ambassador_id = ${Number(amb.id)} and ip_hash = ${ipHash} and created_at > now() - interval '30 minutes'
        limit 1
      `)
    );
    if (recent.length === 0) {
      await db.execute(sql`insert into ambassador_clicks (ambassador_id, country_slug, ip_hash) values (${Number(amb.id)}, ${amb.country_slug ? String(amb.country_slug) : null}, ${ipHash})`);
      await db.execute(sql`update ambassadors set total_clicks = total_clicks + 1 where id = ${Number(amb.id)}`);
    }

    (await cookies()).set("ambassador_code", String(amb.code_unique), {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur clic ambassadeur:", error);
    return Response.json({ success: false }, { status: 500 });
  }
}