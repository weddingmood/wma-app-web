import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { dayJItems, dayJBlessings } from "@/db/schema";
import { refuserSiEssaiExpire } from "@/lib/access-guard";
import { eq, asc, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode"); // 'screen' or 'all'

  const schedule = await db
    .select()
    .from(dayJItems)
    .where(eq(dayJItems.coupleId, session.coupleId))
    .orderBy(asc(dayJItems.orderIndex));

  let blessings = await db
    .select()
    .from(dayJBlessings)
    .where(eq(dayJBlessings.coupleId, session.coupleId))
    .orderBy(desc(dayJBlessings.createdAt));

  if (mode === "screen") {
    blessings = blessings.filter((b) => b.isApprovedForScreen);
  }

  return Response.json({
    success: true,
    schedule,
    blessings,
  });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }
  const blocageEcriture = await refuserSiEssaiExpire(session.coupleId);
  if (blocageEcriture) return blocageEcriture;

  const body = await req.json();
  const { type, timeSlot, activityTitle, location, personInCharge, contactPhone, notes, senderName, senderRelation, blessingText } = body;

  if (type === "schedule_item") {
    if (!timeSlot || !activityTitle) {
      return Response.json({ success: false, message: "Horaire et activité obligatoires" }, { status: 400 });
    }

    const [item] = await db
      .insert(dayJItems)
      .values({
        coupleId: session.coupleId,
        timeSlot,
        activityTitle,
        location: location || "",
        personInCharge: personInCharge || "",
        contactPhone: contactPhone || "",
        notes: notes || "",
        isCompleted: false,
      })
      .returning();

    return Response.json({ success: true, item });
  }

  if (type === "blessing") {
    if (!senderName || !blessingText) {
      return Response.json({ success: false, message: "Nom et texte de bénédiction obligatoires" }, { status: 400 });
    }

    const [blessing] = await db
      .insert(dayJBlessings)
      .values({
        coupleId: session.coupleId,
        senderName,
        senderRelation: senderRelation || "Invité(e)",
        blessingText,
        isApprovedForScreen: true,
      })
      .returning();

    return Response.json({ success: true, blessing });
  }

  return Response.json({ success: false, message: "Type non reconnu" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }
  const blocageEcriture = await refuserSiEssaiExpire(session.coupleId);
  if (blocageEcriture) return blocageEcriture;

  const body = await req.json();
  const { type, id, isCompleted, isApprovedForScreen } = body;

  if (type === "schedule_item" && id) {
    const [updated] = await db
      .update(dayJItems)
      .set({ isCompleted })
      .where(eq(dayJItems.id, Number(id)))
      .returning();
    return Response.json({ success: true, item: updated });
  }

  if (type === "blessing" && id) {
    const [updated] = await db
      .update(dayJBlessings)
      .set({ isApprovedForScreen })
      .where(eq(dayJBlessings.id, Number(id)))
      .returning();
    return Response.json({ success: true, blessing: updated });
  }

  return Response.json({ success: false, message: "Invalide" }, { status: 400 });
}

