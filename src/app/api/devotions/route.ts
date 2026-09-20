import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { devotions, coupleDevotionProgress } from "@/db/schema";
import { asc, eq, and } from "drizzle-orm";
import { seedDatabaseIfEmpty } from "@/lib/seed";

export async function GET() {
  await seedDatabaseIfEmpty();
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const allDevotions = await db.select().from(devotions).orderBy(asc(devotions.themeNumber));
  const progressList = await db
    .select()
    .from(coupleDevotionProgress)
    .where(eq(coupleDevotionProgress.coupleId, session.coupleId));

  const progressMap = new Map();
  for (const p of progressList) {
    progressMap.set(p.devotionId, p);
  }

  const enriched = allDevotions.map((d) => {
    const prog = progressMap.get(d.id);
    return {
      ...d,
      partner1Completed: !!prog?.partner1Completed,
      partner2Completed: !!prog?.partner2Completed,
      isFullyCompleted: !!(prog?.partner1Completed && prog?.partner2Completed),
      notes: prog?.notes || "",
    };
  });

  return Response.json({ success: true, devotions: enriched });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { devotionId, notes } = body;

  if (!devotionId) {
    return Response.json({ success: false, message: "Devotion ID requis" }, { status: 400 });
  }

  const [existingProg] = await db
    .select()
    .from(coupleDevotionProgress)
    .where(
      and(
        eq(coupleDevotionProgress.coupleId, session.coupleId),
        eq(coupleDevotionProgress.devotionId, Number(devotionId))
      )
    )
    .limit(1);

  const isP1 = session.activePartner === "partner1";

  if (existingProg) {
    const newP1 = isP1 ? !existingProg.partner1Completed : existingProg.partner1Completed;
    const newP2 = !isP1 ? !existingProg.partner2Completed : existingProg.partner2Completed;
    const isBothDone = newP1 && newP2;

    const [updated] = await db
      .update(coupleDevotionProgress)
      .set({
        partner1Completed: newP1,
        partner2Completed: newP2,
        notes: notes !== undefined ? notes : existingProg.notes,
        completedAt: isBothDone ? new Date() : null,
      })
      .where(eq(coupleDevotionProgress.id, existingProg.id))
      .returning();

    return Response.json({ success: true, progress: updated });
  } else {
    const [inserted] = await db
      .insert(coupleDevotionProgress)
      .values({
        coupleId: session.coupleId,
        devotionId: Number(devotionId),
        partner1Completed: isP1,
        partner2Completed: !isP1,
        notes: notes || "",
      })
      .returning();

    return Response.json({ success: true, progress: inserted });
  }
}

