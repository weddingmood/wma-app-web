import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { couples } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const {
    partner1Name,
    partner2Name,
    partner1Photo,
    partner2Photo,
    weddingDate,
    city,
    venue,
    totalBudget,
    estimatedGuests,
    church,
    pastorName,
    ethnicity,
    traditions,
    bibleVerse,
  } = body;

  const [updatedCouple] = await db
    .update(couples)
    .set({
      partner1Name: partner1Name !== undefined ? partner1Name : undefined,
      partner2Name: partner2Name !== undefined ? partner2Name : undefined,
      partner1Photo: partner1Photo !== undefined ? partner1Photo : undefined,
      partner2Photo: partner2Photo !== undefined ? partner2Photo : undefined,
      weddingDate: weddingDate !== undefined ? weddingDate : undefined,
      city: city !== undefined ? city : undefined,
      venue: venue !== undefined ? venue : undefined,
      totalBudget: totalBudget !== undefined ? Number(totalBudget) : undefined,
      estimatedGuests: estimatedGuests !== undefined ? Number(estimatedGuests) : undefined,
      church: church !== undefined ? church : undefined,
      pastorName: pastorName !== undefined ? pastorName : undefined,
      ethnicity: ethnicity !== undefined ? ethnicity : undefined,
      traditions: traditions !== undefined ? traditions : undefined,
      bibleVerse: bibleVerse !== undefined ? bibleVerse : undefined,
      updatedAt: new Date(),
    })
    .where(eq(couples.id, session.coupleId))
    .returning();

  const { passwordHash: _, ...safeCouple } = updatedCouple;

  return Response.json({ success: true, couple: safeCouple });
}

