import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { expenses, notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");

  let exps = await db
    .select()
    .from(expenses)
    .where(eq(expenses.coupleId, session.coupleId))
    .orderBy(desc(expenses.createdAt));

  if (categoryId && categoryId !== "all") {
    exps = exps.filter((e) => e.categoryId === Number(categoryId));
  }

  return Response.json({ success: true, expenses: exps });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { categoryId, title, amount, advancePaid, dueDate, paymentStatus, recipient, notes } = body;

  const numAmount = Number(amount);
  if (!title || !numAmount || numAmount <= 0) {
    return Response.json({ success: false, message: "Titre et montant valide requis." }, { status: 400 });
  }

  const numAdvance = Number(advancePaid) || 0;
  const remaining = Math.max(0, numAmount - numAdvance);
  const requiresDual = numAmount > 50000; // Requirement: > 50 000 FCFA requires dual validation

  const isPartner1 = session.activePartner === "partner1";

  const [newExpense] = await db
    .insert(expenses)
    .values({
      coupleId: session.coupleId,
      categoryId: categoryId ? Number(categoryId) : null,
      title,
      amount: numAmount,
      advancePaid: numAdvance,
      remainingAmount: remaining,
      dueDate: dueDate || "",
      paymentStatus: paymentStatus || (remaining === 0 ? "paid" : numAdvance > 0 ? "partial" : "unpaid"),
      recipient: recipient || "",
      requiresDualValidation: requiresDual,
      validationStatus: requiresDual ? "pending" : "approved_by_both",
      partner1Approved: isPartner1,
      partner2Approved: !isPartner1,
      createdBy: session.activePartner,
      notes: notes || "",
    })
    .returning();

  // If requires dual validation, send notification to the other partner
  if (requiresDual) {
    await db.insert(notifications).values({
      coupleId: session.coupleId,
      recipient: isPartner1 ? "partner2" : "partner1",
      title: "Validation de dépense requise (> 50 000 FCFA)",
      message: `${session.partnerName} a proposé la dépense "${title}" d'un montant de ${numAmount.toLocaleString("fr-FR")} FCFA.`,
      type: "expense",
      linkUrl: "/dashboard/budget",
    });
  }

  return Response.json({ success: true, expense: newExpense });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { id, action, ...otherUpdates } = body;

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, Number(id)), eq(expenses.coupleId, session.coupleId)))
    .limit(1);

  if (!existing) {
    return Response.json({ success: false, message: "Dépense introuvable" }, { status: 404 });
  }

  if (action === "approve") {
    const isP1 = session.activePartner === "partner1";
    const p1App = isP1 ? true : existing.partner1Approved;
    const p2App = !isP1 ? true : existing.partner2Approved;
    const bothApproved = p1App && p2App;

    const [updated] = await db
      .update(expenses)
      .set({
        partner1Approved: p1App,
        partner2Approved: p2App,
        validationStatus: bothApproved ? "approved_by_both" : "pending",
      })
      .where(eq(expenses.id, Number(id)))
      .returning();

    return Response.json({ success: true, expense: updated });
  }

  if (action === "reject") {
    const [updated] = await db
      .update(expenses)
      .set({
        validationStatus: "rejected",
      })
      .where(eq(expenses.id, Number(id)))
      .returning();

    return Response.json({ success: true, expense: updated });
  }

  // General update
  const [updated] = await db
    .update(expenses)
    .set({
      ...otherUpdates,
    })
    .where(eq(expenses.id, Number(id)))
    .returning();

  return Response.json({ success: true, expense: updated });
}

export async function DELETE(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ success: false, message: "ID requis" }, { status: 400 });
  }

  await db.delete(expenses).where(and(eq(expenses.id, Number(id)), eq(expenses.coupleId, session.coupleId)));
  return Response.json({ success: true, message: "Dépense supprimée" });
}

