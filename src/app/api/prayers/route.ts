import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { prayers } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const couplePrayers = await db
    .select()
    .from(prayers)
    .where(eq(prayers.coupleId, session.coupleId))
    .orderBy(desc(prayers.createdAt));

  return Response.json({ success: true, prayers: couplePrayers });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { title, prayerText, category, prayerDate } = body;

  if (!title || !prayerText) {
    return Response.json({ success: false, message: "Titre et texte de prière obligatoires." }, { status: 400 });
  }

  const isP1 = session.activePartner === "partner1";

  const [newPrayer] = await db
    .insert(prayers)
    .values({
      coupleId: session.coupleId,
      title,
      prayerText,
      category: category || "couple",
      prayerDate: prayerDate || new Date().toISOString().split("T")[0],
      isAnswered: false,
      partner1Prayed: isP1,
      partner2Prayed: !isP1,
      createdBy: session.activePartner,
    })
    .returning();

  return Response.json({ success: true, prayer: newPrayer });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { id, isAnswered, testimony, action } = body;

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(prayers)
    .where(and(eq(prayers.id, Number(id)), eq(prayers.coupleId, session.coupleId)))
    .limit(1);

  if (!existing) {
    return Response.json({ success: false, message: "Prière introuvable" }, { status: 404 });
  }

  if (action === "toggle-partner-pray") {
    const isP1 = session.activePartner === "partner1";
    const [updated] = await db
      .update(prayers)
      .set({
        partner1Prayed: isP1 ? !existing.partner1Prayed : existing.partner1Prayed,
        partner2Prayed: !isP1 ? !existing.partner2Prayed : existing.partner2Prayed,
      })
      .where(eq(prayers.id, Number(id)))
      .returning();

    return Response.json({ success: true, prayer: updated });
  }

  const [updated] = await db
    .update(prayers)
    .set({
      isAnswered: isAnswered !== undefined ? isAnswered : existing.isAnswered,
      testimony: testimony !== undefined ? testimony : existing.testimony,
    })
    .where(eq(prayers.id, Number(id)))
    .returning();

  return Response.json({ success: true, prayer: updated });
}

export async function DELETE(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  await db.delete(prayers).where(and(eq(prayers.id, Number(id)), eq(prayers.coupleId, session.coupleId)));
  return Response.json({ success: true, message: "Prière supprimée" });
}

