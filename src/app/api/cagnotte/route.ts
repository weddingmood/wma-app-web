import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { cagnotteContributions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const list = await db
    .select()
    .from(cagnotteContributions)
    .where(eq(cagnotteContributions.coupleId, session.coupleId))
    .orderBy(desc(cagnotteContributions.createdAt));

  const totalCollected = list.reduce((sum, c) => sum + (c.amount || 0), 0);
  const targetGoal = 2500000; // 2.5M FCFA for first home
  const progressPercent = Math.min(100, Math.round((totalCollected / targetGoal) * 100));

  return Response.json({
    success: true,
    targetGoal,
    totalCollected,
    progressPercent,
    contributionsCount: list.length,
    contributions: list,
  });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { donorName, donorPhone, amount, message, paymentReference } = body;

  if (!donorName || !amount) {
    return Response.json({ success: false, message: "Nom et montant obligatoires." }, { status: 400 });
  }

  const [contrib] = await db
    .insert(cagnotteContributions)
    .values({
      coupleId: session.coupleId,
      donorName,
      donorPhone: donorPhone || "",
      amount: Number(amount),
      message: message || "",
      paymentReference: paymentReference || `WAVE-MANUAL-${Date.now().toString().slice(-6)}`,
      isVerified: true,
    })
    .returning();

  return Response.json({ success: true, contribution: contrib });
}

