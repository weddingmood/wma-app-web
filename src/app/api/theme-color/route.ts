import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/auth-helpers";
import { refuserSiEssaiExpire } from "@/lib/access-guard";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function rowsOf(res: unknown): Row[] {
  if (Array.isArray(res)) return res as Row[];
  const r = res as { rows?: Row[] };
  return r?.rows ?? [];
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const clean = (v: unknown): string | null => (typeof v === "string" && HEX.test(v) ? v.toUpperCase() : null);
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

let columnsReady = false;
async function ensureColumns() {
  if (columnsReady) return;
  try {
    await db.execute(sql`alter table couple_custom_colors add column if not exists text_color text`);
    await db.execute(sql`alter table couple_custom_colors add column if not exists button_color text`);
    await db.execute(sql`alter table couple_custom_colors alter column color drop not null`);
    columnsReady = true;
  } catch (error) {
    console.error("Migration couleurs:", error);
  }
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
    await ensureColumns();
    const row = rowsOf(
      await db.execute(sql`select color, base_theme_id, text_color, button_color from couple_custom_colors where couple_id = ${player.coupleId} limit 1`)
    )[0];
    return Response.json({
      success: true,
      color: row ? str(row.color) : null,
      textColor: row ? str(row.text_color) : null,
      buttonColor: row ? str(row.button_color) : null,
      baseThemeId: row && row.base_theme_id !== null && row.base_theme_id !== undefined ? Number(row.base_theme_id) : null,
    });
  } catch {
    return Response.json({ success: true, color: null, textColor: null, buttonColor: null, baseThemeId: null });
  }
}

export async function PATCH(req: Request) {
  const player = await getPlayer();
  if (!player) return unauthorized();

  const blocage = await refuserSiEssaiExpire(player.coupleId);
  if (blocage) return blocage;

  const body = (await req.json().catch(() => ({}))) as {
    color?: unknown; textColor?: unknown; buttonColor?: unknown; baseThemeId?: unknown; reset?: unknown;
  };

  try {
    await ensureColumns();
    const invalid = [body.color, body.textColor, body.buttonColor].some((v) => v !== undefined && v !== null && clean(v) === null);
    if (invalid) {
      return Response.json({ success: false, message: "Code couleur invalide (exemple : #C05638)." }, { status: 400 });
    }
    const color = clean(body.color);
    const textColor = clean(body.textColor);
    const buttonColor = clean(body.buttonColor);

    if (body.reset === true || (!color && !textColor && !buttonColor)) {
      await db.execute(sql`delete from couple_custom_colors where couple_id = ${player.coupleId}`);
      return Response.json({ success: true });
    }

    const base = Number(body.baseThemeId);
    const baseValue = Number.isInteger(base) && base >= 1 && base <= 20 ? base : null;
    await db.execute(sql`
      insert into couple_custom_colors (couple_id, color, base_theme_id, text_color, button_color)
      values (${player.coupleId}, ${color}, ${baseValue}, ${textColor}, ${buttonColor})
      on conflict (couple_id) do update
        set color = excluded.color, base_theme_id = excluded.base_theme_id,
            text_color = excluded.text_color, button_color = excluded.button_color, updated_at = now()
    `);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur couleur personnalisee:", error);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}