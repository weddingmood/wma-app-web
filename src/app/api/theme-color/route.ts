import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/auth-helpers";
import { refuserSiEssaiExpire } from "@/lib/access-guard";

export const dynamic = "force-dynamic";

function rowsOf(res: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(res)) return res as Array<Record<string, unknown>>;
  const r = res as { rows?: Array<Record<string, unknown>> };
  return r?.rows ?? [];
}

async function getPlayer() {
  const cookieStore = await cookies();
  if (!cookieStore.get("wm_session")?.value) return null;
  const session = await getCurrentSession();
  if (!session?.coupleId) return null;
  return { coupleId: session.coupleId };
}

const unauthorized = () => Response.json({ success: false, message: "Non autoris\u00e9" }, { status: 401 });

export async function GET() {
  const player = await getPlayer();
  if (!player) return unauthorized();
  try {
    const row = rowsOf(
      await db.execute(sql`select color, base_theme_id from couple_custom_colors where couple_id = ${player.coupleId} limit 1`)
    )[0];
    return Response.json({
      success: true,
      color: row ? String(row.color) : null,
      baseThemeId: row && row.base_theme_id !== null && row.base_theme_id !== undefined ? Number(row.base_theme_id) : null,
    });
  } catch {
    return Response.json({ success: true, color: null, baseThemeId: null });
  }
}

export async function PATCH(req: Request) {
  const player = await getPlayer();
  if (!player) return unauthorized();

  const blocage = await refuserSiEssaiExpire(player.coupleId);
  if (blocage) return blocage;

  const body = (await req.json().catch(() => ({}))) as { color?: unknown; baseThemeId?: unknown };

  try {
    if (body.color === null) {
      await db.execute(sql`delete from couple_custom_colors where couple_id = ${player.coupleId}`);
      return Response.json({ success: true });
    }
    if (typeof body.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(body.color)) {
      return Response.json({ success: false, message: "Code couleur invalide (exemple : #C05638)." }, { status: 400 });
    }
    const base = Number(body.baseThemeId);
    const baseValue = Number.isInteger(base) && base >= 1 && base <= 20 ? base : null;
    await db.execute(sql`
      insert into couple_custom_colors (couple_id, color, base_theme_id)
      values (${player.coupleId}, ${body.color.toUpperCase()}, ${baseValue})
      on conflict (couple_id) do update
        set color = excluded.color, base_theme_id = excluded.base_theme_id, updated_at = now()
    `);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur couleur personnalisee:", error);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}