import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { quizQuestions, quizAttempts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { seedDatabaseIfEmpty } from "@/lib/seed";

export async function GET(req: Request) {
  await seedDatabaseIfEmpty();
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category"); // 'connaissance', 'situation_reelle', 'discussion_couple'

  let questions = await db.select().from(quizQuestions);
  if (category && category !== "all") {
    questions = questions.filter((q) => q.category === category);
  }

  const attempts = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.coupleId, session.coupleId))
    .orderBy(desc(quizAttempts.attemptedAt));

  // Calculate Couple Complicity Score
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  const p1Attempts = attempts.filter((a) => a.partnerKey === "partner1").length;
  const p2Attempts = attempts.filter((a) => a.partnerKey === "partner2").length;

  const complicityScore = totalAttempts > 0 ? Math.min(100, Math.round((correctAttempts / totalAttempts) * 100)) : 85;

  return Response.json({
    success: true,
    questions,
    attempts,
    score: {
      complicityScore,
      totalAttempts,
      correctAttempts,
      p1Attempts,
      p2Attempts,
      hasSevenDayReward: totalAttempts >= 15,
    },
  });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { questionId, chosenOption, discussionNotes } = body;

  if (questionId === undefined || chosenOption === undefined) {
    return Response.json({ success: false, message: "Question et choix obligatoires." }, { status: 400 });
  }

  const [question] = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.id, Number(questionId)))
    .limit(1);

  if (!question) {
    return Response.json({ success: false, message: "Question introuvable" }, { status: 404 });
  }

  const isCorrect = question.category === "discussion_couple" ? true : question.correctOptionIndex === Number(chosenOption);

  const [attempt] = await db
    .insert(quizAttempts)
    .values({
      coupleId: session.coupleId,
      quizQuestionId: question.id,
      partnerKey: session.activePartner,
      chosenOption: Number(chosenOption),
      isCorrect,
      discussionNotes: discussionNotes || "",
    })
    .returning();

  return Response.json({
    success: true,
    isCorrect,
    explanation: question.explanation,
    bibleRef: question.bibleRef,
    attempt,
  });
}

