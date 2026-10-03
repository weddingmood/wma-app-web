import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const SLUGS = ["ludo", "awale", "dames", "mots"];

function rowsOf(res: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(res)) return res as Array<Record<string, unknown>>;
  const r = res as { rows?: Array<Record<string, unknown>> };
  return r?.rows ?? [];
}

export async function GET() {
  try {
    const res = await db.execute(sql`select slug, is_visible from wedding_games`);
    const hidden = rowsOf(res)
      .filter((r) => r.is_visible === false)
      .map((r) => String(r.slug));
    return Response.json({ success: true, hidden });
  } catch {
    return Response.json({ success: true, hidden: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Accès administrateur requis" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { slug?: unknown; isVisible?: unknown };
  const slug = typeof body.slug === "string" ? body.slug : "";
  if (!SLUGS.includes(slug) || typeof body.isVisible !== "boolean") {
    return Response.json({ success: false, message: "Requête invalide." }, { status: 400 });
  }

  try {
    await db.execute(sql`
      insert into wedding_games (slug, name, is_visible)
      values (${slug}, ${slug}, ${body.isVisible})
      on conflict (slug) do update set is_visible = excluded.is_visible
    `);
    return Response.json({ success: true, slug, isVisible: body.isVisible });
  } catch (error) {
    console.error("Erreur visibilité jeu:", error);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}