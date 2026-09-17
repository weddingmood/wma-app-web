import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { couples, tasks, expenses, guests, auditLogs, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Accès administrateur requis" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");
  const q = searchParams.get("q");

  let allCouples = await db.select().from(couples).orderBy(desc(couples.createdAt));

  if (status && status !== "all") {
    allCouples = allCouples.filter((c) => c.status === status);
  }

  if (plan && plan !== "all") {
    allCouples = allCouples.filter((c) => (c.planType || "couple") === plan);
  }

  if (q) {
    const term = q.toLowerCase();
    allCouples = allCouples.filter(
      (c) =>
        c.partner1Name.toLowerCase().includes(term) ||
        c.partner2Name.toLowerCase().includes(term) ||
        c.partner1Email.toLowerCase().includes(term) ||
        (c.partner2Email && c.partner2Email.toLowerCase().includes(term)) ||
        c.slug.toLowerCase().includes(term) ||
        (c.accessCode && c.accessCode.toLowerCase().includes(term)) ||
        (c.city && c.city.toLowerCase().includes(term))
    );
  }

  // Calculate quick stats for each couple
  const enriched = await Promise.all(
    allCouples.map(async (c) => {
      const coupleTasks = await db.select().from(tasks).where(eq(tasks.coupleId, c.id));
      const completedTasks = coupleTasks.filter((t) => t.status === "completed").length;
      const progressPercent = coupleTasks.length > 0 ? Math.round((completedTasks / coupleTasks.length) * 100) : 10;

      const coupleGuests = await db.select().from(guests).where(eq(guests.coupleId, c.id));
      const coupleExpenses = await db.select().from(expenses).where(eq(expenses.coupleId, c.id));
      const spent = coupleExpenses.reduce((sum, e) => sum + (e.advancePaid || 0), 0);

      return {
        id: c.id,
        slug: c.slug,
        partner1Name: c.partner1Name,
        partner2Name: c.partner2Name,
        partner1Email: c.partner1Email,
        partner2Email: c.partner2Email,
        accessCode: c.accessCode,
        planType: c.planType,
        planAmount: c.planAmount,
        partner1AccessActive: c.partner1AccessActive,
        partner2AccessActive: c.partner2AccessActive,
        weddingDate: c.weddingDate,
        city: c.city,
        status: c.status,
        totalBudget: c.totalBudget,
        spentAmount: spent,
        guestsCount: coupleGuests.length,
        progressPercent,
        trialEndsAt: c.trialEndsAt,
        createdAt: c.createdAt,
      };
    })
  );

  return Response.json({ success: true, couples: enriched });
}

async function logAudit(adminId: number | undefined, coupleId: number, action: string, details: string) {
  try {
    await db.insert(auditLogs).values({
      adminId: adminId || null,
      coupleId,
      action,
      details,
    });
  } catch {
    // L'audit ne doit jamais bloquer l'action principale
  }
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Accès administrateur requis" }, { status: 403 });
  }

  const body = await req.json();
  const {
    id,
    status,
    totalBudget,
    weddingDate,
    planType,
    planAmount,
    partner1AccessActive,
    partner2AccessActive,
    extendTrialDays,
    regenerateCode,
    activatePremium,
  } = body;

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  const [existing] = await db.select().from(couples).where(eq(couples.id, Number(id))).limit(1);
  if (!existing) {
    return Response.json({ success: false, message: "Couple introuvable" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  // Activation express du Pack Premium complet (Couple 3 000 FCFA)
  if (activatePremium) {
    updates.status = "active";
    updates.planType = "couple";
    updates.planAmount = 3000;
    updates.partner1AccessActive = true;
    updates.partner2AccessActive = true;
    await logAudit(session.adminId, Number(id), "activate_premium", "Pack Premium Couple activé manuellement par l'administrateur.");
    await db.insert(notifications).values({
      coupleId: Number(id),
      recipient: "both",
      title: "Pack Premium activé",
      message: `Félicitations ! Votre Pack Premium Couple est actif. Code d'accès : ${existing.accessCode}. Connectez-vous chacun avec votre email personnel.`,
      type: "payment",
      linkUrl: "/dashboard/subscription",
    });
  }

  if (status) updates.status = status;
  if (totalBudget !== undefined) updates.totalBudget = Number(totalBudget);
  if (weddingDate) updates.weddingDate = weddingDate;
  if (planType) {
    updates.planType = planType;
    updates.planAmount = planAmount !== undefined ? Number(planAmount) : planType === "individual" ? 2000 : 3000;
    if (planType === "individual") updates.partner2AccessActive = false;
    if (planType === "couple") updates.partner2AccessActive = true;
    await logAudit(session.adminId, Number(id), "change_plan", `Formule modifiée vers ${planType}.`);
  }
  if (partner1AccessActive !== undefined) updates.partner1AccessActive = Boolean(partner1AccessActive);
  if (partner2AccessActive !== undefined) updates.partner2AccessActive = Boolean(partner2AccessActive);

  // Prolongation de la période d'essai
  if (extendTrialDays && Number(extendTrialDays) > 0) {
    const base = existing.trialEndsAt ? new Date(existing.trialEndsAt) : new Date();
    const start = base.getTime() > Date.now() ? base : new Date();
    start.setDate(start.getDate() + Number(extendTrialDays));
    updates.trialEndsAt = start;
    if (existing.status === "expired") updates.status = "trial";
    await logAudit(session.adminId, Number(id), "extend_trial", `Essai prolongé de ${extendTrialDays} jour(s).`);
  }

  // Régénération du code d'accès unique
  if (regenerateCode) {
    let newCode = "";
    for (let attempt = 0; attempt < 30; attempt++) {
      const candidate = `WM-${Math.floor(1000 + Math.random() * 9000)}`;
      const [taken] = await db.select().from(couples).where(eq(couples.accessCode, candidate)).limit(1);
      if (!taken) {
        newCode = candidate;
        break;
      }
    }
    if (!newCode) newCode = `WM-${Date.now().toString().slice(-6)}`;
    updates.accessCode = newCode;
    await logAudit(session.adminId, Number(id), "regenerate_code", `Nouveau code d'accès généré : ${newCode}.`);
  }

  if (status === "suspended" || status === "blocked" || status === "active") {
    await logAudit(session.adminId, Number(id), `status_${status}`, `Statut du compte passé à "${status}".`);
  }

  const [updated] = await db
    .update(couples)
    .set(updates)
    .where(eq(couples.id, Number(id)))
    .returning();

  return Response.json({ success: true, couple: updated });
}

export async function DELETE(req: Request) {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Accès administrateur requis" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  await logAudit(session.adminId, Number(id), "delete_couple", "Compte couple supprimé par l'administrateur.");
  await db.delete(couples).where(eq(couples.id, Number(id)));
  return Response.json({ success: true, message: "Compte couple supprimé avec succès." });
}
