import { db } from "@/db";
import { invitations, rsvps, guests, couples, cagnotteContributions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { seedDatabaseIfEmpty } from "@/lib/seed";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  await seedDatabaseIfEmpty();
  const { slug } = await params;

  const [inv] = await db.select().from(invitations).where(eq(invitations.slug, slug)).limit(1);
  if (!inv) {
    return Response.json({ success: false, message: "Page d'invitation introuvable" }, { status: 404 });
  }

  const [couple] = await db.select().from(couples).where(eq(couples.id, inv.coupleId)).limit(1);

  // Cagnotte summary for public guest contribution view
  const contributions = await db
    .select()
    .from(cagnotteContributions)
    .where(eq(cagnotteContributions.coupleId, inv.coupleId));

  const totalCollected = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);

  return Response.json({
    success: true,
    invitation: inv,
    couple: couple
      ? {
          partner1Name: couple.partner1Name,
          partner2Name: couple.partner2Name,
          weddingDate: couple.weddingDate,
          city: couple.city,
          venue: couple.venue,
          church: couple.church,
          bibleVerse: couple.bibleVerse,
        }
      : null,
    cagnotte: {
      targetGoal: 2000000,
      totalCollected,
      contributionsCount: contributions.length,
    },
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [inv] = await db.select().from(invitations).where(eq(invitations.slug, slug)).limit(1);

  if (!inv) {
    return Response.json({ success: false, message: "Invitation introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const {
    guestName,
    email,
    phone,
    attending,
    attendanceStatus,
    plusOnesCount,
    messageForCouple,
    prayerWishes,
    adviceWishes,
  } = body;

  if (!guestName) {
    return Response.json({ success: false, message: "Le nom de l'invité est obligatoire." }, { status: 400 });
  }

  const resolvedAttendanceStatus = attendanceStatus || (attending ? "confirmed" : "declined");
  const isAttendingBool = resolvedAttendanceStatus === "confirmed";

  // Create RSVP record
  const [rsvp] = await db
    .insert(rsvps)
    .values({
      invitationId: inv.id,
      guestName: guestName.trim(),
      email: email ? email.trim() : "",
      phone: phone ? phone.trim() : "",
      attending: isAttendingBool,
      attendanceStatus: resolvedAttendanceStatus,
      plusOnesCount: Number(plusOnesCount) || 0,
      messageForCouple: messageForCouple || "",
      prayerWishes: prayerWishes || "",
      adviceWishes: adviceWishes || "",
    })
    .returning();

  // If matching guest in list by phone or email, update status
  if (phone || email) {
    let matchingGuest;
    if (phone) {
      const [g] = await db
        .select()
        .from(guests)
        .where(and(eq(guests.coupleId, inv.coupleId), eq(guests.phone, phone.trim())))
        .limit(1);
      matchingGuest = g;
    }
    if (!matchingGuest && email) {
      const [g] = await db
        .select()
        .from(guests)
        .where(and(eq(guests.coupleId, inv.coupleId), eq(guests.email, email.trim())))
        .limit(1);
      matchingGuest = g;
    }

    if (matchingGuest) {
      await db
        .update(guests)
        .set({
          rsvpStatus: isAttendingBool ? "confirmed" : resolvedAttendanceStatus === "maybe" ? "pending" : "declined",
          plusOnesConfirmed: isAttendingBool ? Number(plusOnesCount) || 0 : 0,
        })
        .where(eq(guests.id, matchingGuest.id));
    }
  }

  let message = "Votre réponse a été enregistrée avec joie. Que Dieu vous bénisse !";
  if (resolvedAttendanceStatus === "confirmed") {
    message = "Votre présence a été enregistrée avec joie. Les mariés ont hâte de célébrer avec vous !";
  } else if (resolvedAttendanceStatus === "declined") {
    message = "Votre réponse a été transmise aux mariés. Merci de vos vœux et prières bienveillantes.";
  } else if (resolvedAttendanceStatus === "maybe") {
    message = "Votre réponse en attente a bien été notée. Vous pourrez mettre à jour votre présence à tout moment.";
  }

  return Response.json({
    success: true,
    message,
    rsvp,
  });
}
