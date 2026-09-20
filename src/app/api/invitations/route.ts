import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { invitations, rsvps, couples, couplePreferences } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  let [inv] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.coupleId, session.coupleId))
    .limit(1);

  const [couple] = await db
    .select()
    .from(couples)
    .where(eq(couples.id, session.coupleId))
    .limit(1);

  const [prefs] = await db
    .select()
    .from(couplePreferences)
    .where(eq(couplePreferences.coupleId, session.coupleId))
    .limit(1);

  // If no invitation exists yet, create default
  if (!inv && couple) {
    const [created] = await db
      .insert(invitations)
      .values({
        coupleId: couple.id,
        slug: couple.slug,
        heroTitle: `${couple.partner1Name} & ${couple.partner2Name}`,
        weddingDate: couple.weddingDate || "15 Novembre 2025",
        weddingTime: "10h00",
        venueName: couple.venue || "Espace Nuptial Riviera Golf",
        venueAddress: couple.city ? `${couple.city}, Côte d'Ivoire` : "Abidjan, Côte d'Ivoire",
        customVerse: couple.bibleVerse || "Ecclésiaste 4:12 - La corde à trois fils ne se rompt pas facilement.",
        hasPhoto: true,
        heroImageUrl: prefs?.coverPhotoUrl || couple.partner1Photo || couple.partner2Photo || "",
        cardTemplate: "terracotta_royal",
        photoLayout: "arched",
        ceremoniesSelected: ["dot", "civil", "church", "reception"],
        dotDate: "Samedi 13 Septembre 2025 à 10h00",
        civilDate: "Samedi 15 Novembre 2025 à 09h30",
        churchDate: "Samedi 15 Novembre 2025 à 11h30",
        receptionDate: "Samedi 15 Novembre 2025 à 14h00",
        rsvpDeadline: "31 Octobre 2025",
      })
      .returning();
    inv = created;
  }

  // Get RSVPs if inv exists
  let rsvpList: any[] = [];
  if (inv) {
    rsvpList = await db
      .select()
      .from(rsvps)
      .where(eq(rsvps.invitationId, inv.id))
      .orderBy(desc(rsvps.submittedAt));
  }

  const confirmedList = rsvpList.filter(
    (r) => r.attendanceStatus === "confirmed" || (r.attending && !r.attendanceStatus)
  );
  const declinedList = rsvpList.filter(
    (r) => r.attendanceStatus === "declined" || (!r.attending && !r.attendanceStatus)
  );
  const maybeList = rsvpList.filter((r) => r.attendanceStatus === "maybe");

  const totalGuestsConfirmed = confirmedList.reduce(
    (sum, r) => sum + 1 + (Number(r.plusOnesCount) || 0),
    0
  );

  const availablePhotos: { label: string; url: string }[] = [];
  if (couple?.partner1Photo) {
    availablePhotos.push({ label: `Photo de ${couple.partner1Name}`, url: couple.partner1Photo });
  }
  if (couple?.partner2Photo) {
    availablePhotos.push({ label: `Photo de ${couple.partner2Name}`, url: couple.partner2Photo });
  }
  if (prefs?.coverPhotoUrl) {
    availablePhotos.push({ label: "Photo principale du couple", url: prefs.coverPhotoUrl });
  }
  if (inv?.heroImageUrl && !availablePhotos.some((p) => p.url === inv?.heroImageUrl)) {
    availablePhotos.push({ label: "Photo actuelle du faire-part", url: inv.heroImageUrl });
  }

  return Response.json({
    success: true,
    invitation: inv,
    couple: couple
      ? {
          partner1Name: couple.partner1Name,
          partner2Name: couple.partner2Name,
          city: couple.city,
          venue: couple.venue,
          weddingDate: couple.weddingDate,
          slug: couple.slug,
          bibleVerse: couple.bibleVerse,
        }
      : null,
    availablePhotos,
    stats: {
      totalResponses: rsvpList.length,
      confirmedCount: confirmedList.length,
      declinedCount: declinedList.length,
      maybeCount: maybeList.length,
      totalGuestsConfirmed,
    },
    recentRsvps: rsvpList.slice(0, 10),
  });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const [existing] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.coupleId, session.coupleId))
    .limit(1);

  if (!existing) {
    const [created] = await db
      .insert(invitations)
      .values({
        coupleId: session.coupleId,
        slug: session.coupleSlug || `couple-${session.coupleId}`,
        heroTitle: body.heroTitle || "Invitation au Mariage",
        ...body,
      })
      .returning();
    return Response.json({ success: true, invitation: created });
  }

  const [updated] = await db
    .update(invitations)
    .set({
      ...body,
    })
    .where(eq(invitations.id, existing.id))
    .returning();

  return Response.json({ success: true, invitation: updated });
}

