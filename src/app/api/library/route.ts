import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { libraryBooks, coupleBooksProgress } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { seedDatabaseIfEmpty } from "@/lib/seed";

export async function GET(req: Request) {
  await seedDatabaseIfEmpty();
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let books = await db.select().from(libraryBooks);
  if (category && category !== "all") {
    books = books.filter((b) => b.category === category);
  }

  const progress = await db
    .select()
    .from(coupleBooksProgress)
    .where(eq(coupleBooksProgress.coupleId, session.coupleId));

  const progressMap = new Map();
  for (const p of progress) {
    progressMap.set(p.bookId, p);
  }

  const enriched = books.map((b) => ({
    ...b,
    userProgress: progressMap.get(b.id) || { currentChapter: 1, progressPercent: 0, notes: "" },
  }));

  return Response.json({ success: true, books: enriched });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { bookId, currentChapter, progressPercent, notes } = body;

  if (!bookId) {
    return Response.json({ success: false, message: "Book ID requis" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(coupleBooksProgress)
    .where(
      and(
        eq(coupleBooksProgress.coupleId, session.coupleId),
        eq(coupleBooksProgress.bookId, Number(bookId))
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(coupleBooksProgress)
      .set({
        currentChapter: Number(currentChapter) || existing.currentChapter,
        progressPercent: progressPercent !== undefined ? Number(progressPercent) : existing.progressPercent,
        notes: notes !== undefined ? notes : existing.notes,
        lastReadAt: new Date(),
      })
      .where(eq(coupleBooksProgress.id, existing.id))
      .returning();

    return Response.json({ success: true, progress: updated });
  } else {
    const [inserted] = await db
      .insert(coupleBooksProgress)
      .values({
        coupleId: session.coupleId,
        bookId: Number(bookId),
        currentChapter: Number(currentChapter) || 1,
        progressPercent: Number(progressPercent) || 10,
        notes: notes || "",
      })
      .returning();

    return Response.json({ success: true, progress: inserted });
  }
}

