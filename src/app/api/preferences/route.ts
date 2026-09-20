import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { couplePreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { COLOR_THEMES, FONTS_LIST } from "@/lib/constants";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  let [prefs] = await db
    .select()
    .from(couplePreferences)
    .where(eq(couplePreferences.coupleId, session.coupleId))
    .limit(1);

  if (!prefs) {
    const [newPref] = await db
      .insert(couplePreferences)
      .values({
        coupleId: session.coupleId,
        themeId: 1,
        fontFamily: "cormorant",
        displayMode: "standard",
        density: "normal",
        fontSize: "md",
      })
      .returning();
    prefs = newPref;
  }

  return Response.json({
    success: true,
    preferences: prefs,
    availableThemes: COLOR_THEMES,
    availableFonts: FONTS_LIST,
  });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { themeId, fontFamily, displayMode, density, fontSize, coverPhotoUrl } = body;

  const [existing] = await db
    .select()
    .from(couplePreferences)
    .where(eq(couplePreferences.coupleId, session.coupleId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(couplePreferences)
      .set({
        themeId: themeId !== undefined ? Number(themeId) : existing.themeId,
        fontFamily: fontFamily || existing.fontFamily,
        displayMode: displayMode || existing.displayMode,
        density: density || existing.density,
        fontSize: fontSize || existing.fontSize,
        coverPhotoUrl: coverPhotoUrl !== undefined ? coverPhotoUrl : existing.coverPhotoUrl,
        updatedAt: new Date(),
      })
      .where(eq(couplePreferences.id, existing.id))
      .returning();

    return Response.json({ success: true, preferences: updated });
  } else {
    const [created] = await db
      .insert(couplePreferences)
      .values({
        coupleId: session.coupleId,
        themeId: Number(themeId) || 1,
        fontFamily: fontFamily || "cormorant",
        displayMode: displayMode || "standard",
        density: density || "normal",
        fontSize: fontSize || "md",
        coverPhotoUrl: coverPhotoUrl || null,
      })
      .returning();

    return Response.json({ success: true, preferences: created });
  }
}

