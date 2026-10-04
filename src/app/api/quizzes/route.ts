import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { quizQuestions, quizAttempts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { seedDatabaseIfEmpty } from "@/lib/seed";

// Questions par jour et par categorie (jour UTC = jour a Abidjan)
const DAILY_LIMITS: Record<string, number> = {
  connaissance: 5,
  situation_reelle: 3,
  discussion_couple: 5,
};

function startOfTodayUtc(): number {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function timeOf(value: unknown): number {
  return new Date(value as string | number | Date).getTime();
}

export async function GET(req: Request) {
  await seedDatabaseIfEmpty();
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autoris\u00e9" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category"); // 'connaissance', 'situation_reelle', 'discussion_couple'

  const allQuestions = await db.select().from(quizQuestions);
  const attempts = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.coupleId, session.coupleId))
    .orderBy(desc(quizAttempts.attemptedAt));

  // Score de complicite du couple
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  const p1Attempts = attempts.filter((a) => a.partnerKey === "partner1").length;
  const p2Attempts = attempts.filter((a) => a.partnerKey === "partner2").length;
  const complicityScore = totalAttempts > 0 ? Math.min(100, Math.round((correctAttempts / totalAttempts) * 100)) : 85;

  const categoryOf = new Map<number, string>();
  for (const q of allQuestions) categoryOf.set(q.id, String(q.category));

  let questions = allQuestions;
  let daily: {
    limit: number;
    answeredToday: number;
    remaining: number;
    done: boolean;
    todayCorrect: number;
    todayTotal: number;
  } | null = null;

  if (category && category !== "all") {
    const limit = DAILY_LIMITS[category] ?? 5;
    const todayMs = startOfTodayUtc();
    const inCategory = allQuestions.filter((q) => q.category === category);

    const todayAttempts = attempts.filter(
      (a) => timeOf(a.attemptedAt) >= todayMs && categoryOf.get(Number(a.quizQuestionId)) === category
    );
    const answeredToday = todayAttempts.length;
    const remaining = Math.max(0, limit - answeredToday);
    const todayIds = new Set<number>(todayAttempts.map((a) => Number(a.quizQuestionId)));

    const lastSeen = new Map<number, number>();
    for (const a of attempts) {
      const id = Number(a.quizQuestionId);
      const t = timeOf(a.attemptedAt);
      const prev = lastSeen.get(id);
      if (prev === undefined || t > prev) lastSeen.set(id, t);
    }

    // D'abord les questions jamais vues, puis les plus anciennes deja vues
    const fresh = inCategory.filter((q) => !lastSeen.has(q.id)).sort((a, b) => a.id - b.id);
    const seen = inCategory
      .filter((q) => lastSeen.has(q.id) && !todayIds.has(q.id))
      .sort((a, b) => (lastSeen.get(a.id) ?? 0) - (lastSeen.get(b.id) ?? 0));
    questions = [...fresh, ...seen].slice(0, remaining);

    daily = {
      limit,
      answeredToday,
      remaining,
      done: remaining === 0,
      todayCorrect: todayAttempts.filter((a) => a.isCorrect).length,
      todayTotal: answeredToday,
    };
  }

  return Response.json({
    success: true,
    questions,
    attempts,
    daily,
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
    return Response.json({ success: false, message: "Non autoris\u00e9" }, { status: 401 });
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

  // Limite quotidienne appliquee c\u00f4t\u00e9 serveur
  const limit = DAILY_LIMITS[String(question.category)];
  if (limit) {
    const todayMs = startOfTodayUtc();
    const allQ = await db.select({ id: quizQuestions.id, category: quizQuestions.category }).from(quizQuestions);
    const catOf = new Map<number, string>();
    for (const q of allQ) catOf.set(q.id, String(q.category));
    const mine = await db
      .select({ q: quizAttempts.quizQuestionId, at: quizAttempts.attemptedAt })
      .from(quizAttempts)
      .where(eq(quizAttempts.coupleId, session.coupleId));
    const doneToday = mine.filter(
      (a) => timeOf(a.at) >= todayMs && catOf.get(Number(a.q)) === String(question.category)
    ).length;
    if (doneToday >= limit) {
      return Response.json(
        { success: false, dailyDone: true, message: "Vous avez termin\u00e9 vos " + limit + " questions du jour. Revenez demain !" },
        { status: 429 }
      );
    }
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