import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { couples, payments, tasks, libraryBooks, articles, quizAttempts, devotions } from "@/db/schema";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Accès administrateur requis" }, { status: 403 });
  }

  const allCouples = await db.select().from(couples);
  const allPayments = await db.select().from(payments);
  const allTasks = await db.select().from(tasks);
  const allBooks = await db.select().from(libraryBooks);
  const allArticles = await db.select().from(articles);
  const allAttempts = await db.select().from(quizAttempts);
  const allDevotions = await db.select().from(devotions);

  const activeCouples = allCouples.filter((c) => c.status === "active").length;
  const trialCouples = allCouples.filter((c) => c.status === "trial").length;
  const verificationCouples = allCouples.filter((c) => c.status === "verification").length;
  const pendingPaymentCouples = allCouples.filter((c) => c.status === "pending_payment").length;
  const suspendedCouples = allCouples.filter((c) => c.status === "suspended").length;
  const blockedCouples = allCouples.filter((c) => c.status === "blocked").length;

  const couplePlan = allCouples.filter((c) => (c.planType || "couple") === "couple").length;
  const individualPlan = allCouples.filter((c) => c.planType === "individual").length;

  const verifiedPayments = allPayments.filter((p) => p.status === "verified");
  const totalRevenueFCFA = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const revenueCouple = verifiedPayments
    .filter((p) => p.planType !== "individual")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const revenueIndividual = verifiedPayments
    .filter((p) => p.planType === "individual")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPaymentsCount = allPayments.filter((p) => p.status === "pending").length;
  const rejectedPaymentsCount = allPayments.filter((p) => p.status === "rejected").length;

  return Response.json({
    success: true,
    stats: {
      totalCouples: allCouples.length,
      activeCouples,
      trialCouples,
      verificationCouples,
      pendingPaymentCouples,
      suspendedCouples,
      blockedCouples,
      couplePlan,
      individualPlan,
      totalRevenueFCFA,
      revenueCouple,
      revenueIndividual,
      pendingPaymentsCount,
      rejectedPaymentsCount,
      verifiedPaymentsCount: verifiedPayments.length,
      totalTasksCreated: allTasks.length,
      totalBooks: allBooks.length,
      totalArticles: allArticles.length,
      totalQuizAttempts: allAttempts.length,
      totalDevotions: allDevotions.length,
    },
  });
}

