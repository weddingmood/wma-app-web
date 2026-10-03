import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { budgetCategories, expenses, couples } from "@/db/schema";
import { refuserSiEssaiExpire } from "@/lib/access-guard";
import { and, eq, desc } from "drizzle-orm";

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
  const blocageEcriture = await refuserSiEssaiExpire(session.coupleId);
  if (blocageEcriture) return blocageEcriture;

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

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autoris\u00e9" }, { status: 401 });
  }
  const blocageEcriture = await refuserSiEssaiExpire(session.coupleId);
  if (blocageEcriture) return blocageEcriture;

  const body = (await req.json().catch(() => ({}))) as {
    totalBudget?: unknown;
    categoryId?: unknown;
    name?: unknown;
    allocatedAmount?: unknown;
  };

  if (body.totalBudget !== undefined) {
    const total = Number(body.totalBudget);
    if (!Number.isFinite(total) || total < 0) {
      return Response.json({ success: false, message: "Montant invalide." }, { status: 400 });
    }
    await db.update(couples).set({ totalBudget: Math.round(total) }).where(eq(couples.id, session.coupleId));
    return Response.json({ success: true, totalBudget: Math.round(total) });
  }

  if (body.categoryId !== undefined) {
    const id = Number(body.categoryId);
    if (!Number.isInteger(id)) {
      return Response.json({ success: false, message: "Cat\u00e9gorie invalide." }, { status: 400 });
    }
    const changes: { name?: string; allocatedAmount?: number } = {};
    if (typeof body.name === "string" && body.name.trim()) changes.name = body.name.trim();
    if (body.allocatedAmount !== undefined) {
      const amount = Number(body.allocatedAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        return Response.json({ success: false, message: "Montant invalide." }, { status: 400 });
      }
      changes.allocatedAmount = Math.round(amount);
    }
    if (Object.keys(changes).length === 0) {
      return Response.json({ success: false, message: "Rien \u00e0 modifier." }, { status: 400 });
    }
    const [updated] = await db
      .update(budgetCategories)
      .set(changes)
      .where(and(eq(budgetCategories.id, id), eq(budgetCategories.coupleId, session.coupleId)))
      .returning();
    if (!updated) {
      return Response.json({ success: false, message: "Cat\u00e9gorie introuvable." }, { status: 404 });
    }
    return Response.json({ success: true, category: updated });
  }

  return Response.json({ success: false, message: "Requ\u00eate invalide." }, { status: 400 });
}