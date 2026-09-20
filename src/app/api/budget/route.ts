import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { budgetCategories, expenses, couples } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const [couple] = await db.select().from(couples).where(eq(couples.id, session.coupleId)).limit(1);
  const categories = await db.select().from(budgetCategories).where(eq(budgetCategories.coupleId, session.coupleId));
  const coupleExpenses = await db.select().from(expenses).where(eq(expenses.coupleId, session.coupleId)).orderBy(desc(expenses.createdAt));

  const totalBudget = couple?.totalBudget || 5000000;
  const totalAllocated = categories.reduce((sum, c) => sum + (c.allocatedAmount || 0), 0);
  const totalSpent = coupleExpenses.reduce((sum, e) => sum + (e.advancePaid || 0), 0);
  const totalCommitted = coupleExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const remainingBudget = totalBudget - totalCommitted;
  const percentUsed = totalBudget > 0 ? Math.round((totalCommitted / totalBudget) * 100) : 0;

  // Pending dual validations (> 50 000 FCFA needing current partner approval)
  const pendingValidations = coupleExpenses.filter(
    (e) =>
      e.requiresDualValidation &&
      e.validationStatus === "pending" &&
      ((session.activePartner === "partner1" && !e.partner1Approved) ||
        (session.activePartner === "partner2" && !e.partner2Approved))
  );

  return Response.json({
    success: true,
    summary: {
      totalBudget,
      totalAllocated,
      totalSpent,
      totalCommitted,
      remainingBudget,
      percentUsed,
      pendingValidationsCount: pendingValidations.length,
    },
    categories,
    expenses: coupleExpenses,
    pendingValidations,
  });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { name, allocatedAmount, iconKey, colorKey } = body;

  if (!name) {
    return Response.json({ success: false, message: "Nom de catégorie requis" }, { status: 400 });
  }

  const [newCat] = await db
    .insert(budgetCategories)
    .values({
      coupleId: session.coupleId,
      name,
      allocatedAmount: Number(allocatedAmount) || 0,
      iconKey: iconKey || "wallet",
      colorKey: colorKey || "gold",
    })
    .returning();

  return Response.json({ success: true, category: newCat });
}

