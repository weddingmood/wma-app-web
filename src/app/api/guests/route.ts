import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { guests } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group");
  const rsvp = searchParams.get("rsvp");

  let list = await db
    .select()
    .from(guests)
    .where(eq(guests.coupleId, session.coupleId))
    .orderBy(asc(guests.firstName));

  if (group && group !== "all") {
    list = list.filter((g) => g.groupName === group);
  }
  if (rsvp && rsvp !== "all") {
    list = list.filter((g) => g.rsvpStatus === rsvp);
  }

  const totalGuests = list.length;
  const confirmedCount = list.filter((g) => g.rsvpStatus === "confirmed").length;
  const totalWithPlusOnes = list
    .filter((g) => g.rsvpStatus === "confirmed")
    .reduce((sum, g) => sum + 1 + (g.plusOnesConfirmed || 0), 0);
  const checkedInCount = list.filter((g) => g.isCheckedIn).length;

  return Response.json({
    success: true,
    guests: list,
    stats: {
      totalGuests,
      confirmedCount,
      totalWithPlusOnes,
      checkedInCount,
    },
  });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { action, batch, firstName, lastName, groupName, phone, email, plusOnesAllowed, dietaryNeeds, tableNumber, notes } = body;

  if (action === "import" && Array.isArray(batch)) {
    const inserted = [];
    for (const item of batch) {
      if (item.firstName) {
        const qrToken = `WM-${session.coupleId}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
        const [g] = await db
          .insert(guests)
          .values({
            coupleId: session.coupleId,
            firstName: item.firstName,
            lastName: item.lastName || "",
            groupName: item.groupName || "famille",
            phone: item.phone || "",
            email: item.email || "",
            plusOnesAllowed: Number(item.plusOnesAllowed) || 0,
            tableNumber: item.tableNumber || "",
            qrCodeToken: qrToken,
          })
          .returning();
        inserted.push(g);
      }
    }
    return Response.json({ success: true, count: inserted.length, guests: inserted });
  }

  if (!firstName) {
    return Response.json({ success: false, message: "Prénom requis" }, { status: 400 });
  }

  const qrToken = `WM-${session.coupleId}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  const [newGuest] = await db
    .insert(guests)
    .values({
      coupleId: session.coupleId,
      firstName,
      lastName: lastName || "",
      groupName: groupName || "famille",
      phone: phone || "",
      email: email || "",
      plusOnesAllowed: Number(plusOnesAllowed) || 0,
      plusOnesConfirmed: 0,
      rsvpStatus: "pending",
      dietaryNeeds: dietaryNeeds || "",
      tableNumber: tableNumber || "",
      notes: notes || "",
      qrCodeToken: qrToken,
    })
    .returning();

  return Response.json({ success: true, guest: newGuest });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { id, action, ...updates } = body;

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(guests)
    .where(and(eq(guests.id, Number(id)), eq(guests.coupleId, session.coupleId)))
    .limit(1);

  if (!existing) {
    return Response.json({ success: false, message: "Invité introuvable" }, { status: 404 });
  }

  if (action === "check-in") {
    const isNowChecked = !existing.isCheckedIn;
    const [updated] = await db
      .update(guests)
      .set({
        isCheckedIn: isNowChecked,
        checkedInAt: isNowChecked ? new Date() : null,
      })
      .where(eq(guests.id, Number(id)))
      .returning();

    return Response.json({ success: true, guest: updated });
  }

  const [updated] = await db
    .update(guests)
    .set({
      ...updates,
    })
    .where(eq(guests.id, Number(id)))
    .returning();

  return Response.json({ success: true, guest: updated });
}

export async function DELETE(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ success: false, message: "ID requis" }, { status: 400 });
  }

  await db.delete(guests).where(and(eq(guests.id, Number(id)), eq(guests.coupleId, session.coupleId)));
  return Response.json({ success: true, message: "Invité supprimé" });
}

