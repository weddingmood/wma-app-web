import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { payments, couples, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Accès administrateur requis" }, { status: 403 });
  }

  const allPayments = await db.select().from(payments).orderBy(desc(payments.createdAt));
  const coupleList = await db.select().from(couples);
  const coupleMap = new Map();
  for (const c of coupleList) {
    coupleMap.set(c.id, c);
  }

  const enriched = allPayments.map((p) => {
    const c = coupleMap.get(p.coupleId);
    return {
      ...p,
      coupleName: c ? `${c.partner1Name} & ${c.partner2Name}` : "Couple inconnu",
      coupleEmail: c ? c.partner1Email : "",
      partner2Email: c ? c.partner2Email : "",
      accessCode: c ? c.accessCode : "",
      coupleStatus: c ? c.status : "unknown",
      coupleCity: c ? c.city : "",
    };
  });

  return Response.json({ success: true, payments: enriched });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Accès administrateur requis" }, { status: 403 });
  }

  const body = await req.json();
  const { id, action, adminNotes, rejectionReason } = body;

  if (!id || !action) {
    return Response.json({ success: false, message: "ID et action requis" }, { status: 400 });
  }

  const [payment] = await db.select().from(payments).where(eq(payments.id, Number(id))).limit(1);
  if (!payment) {
    return Response.json({ success: false, message: "Paiement introuvable" }, { status: 404 });
  }

  if (action === "accept") {
    const [updatedPayment] = await db
      .update(payments)
      .set({
        status: "verified",
        adminNotes: adminNotes || "Paiement Wave vérifié et validé par l'administrateur.",
        reviewedAt: new Date(),
        reviewedBy: session.adminId || null,
      })
      .where(eq(payments.id, Number(id)))
      .returning();

    // Activation du compte selon la formule réglée
    const isCouplePlan = payment.planType !== "individual";

    const [activatedCouple] = await db
      .update(couples)
      .set({
        status: "active",
        planType: payment.planType || "couple",
        planAmount: payment.amount || (isCouplePlan ? 3000 : 2000),
        partner1AccessActive: true,
        partner2AccessActive: isCouplePlan,
        updatedAt: new Date(),
      })
      .where(eq(couples.id, payment.coupleId))
      .returning();

    // Notification incluant le code d'accès unique du couple
    await db.insert(notifications).values({
      coupleId: payment.coupleId,
      recipient: "both",
      title: "Compte Wedding Mood Actif !",
      message: isCouplePlan
        ? `Votre règlement de ${(payment.amount || 3000).toLocaleString("fr-FR")} FCFA est validé. Les deux partenaires peuvent désormais se connecter avec leur email personnel et le code d'accès ${activatedCouple.accessCode}.`
        : `Votre règlement de ${(payment.amount || 2000).toLocaleString("fr-FR")} FCFA est validé. Votre accès individuel est actif avec le code ${activatedCouple.accessCode}.`,
      type: "payment",
      linkUrl: "/dashboard/subscription",
    });

    return Response.json({ success: true, message: "Paiement validé avec succès", payment: updatedPayment });
  }

  if (action === "reject") {
    const [updatedPayment] = await db
      .update(payments)
      .set({
        status: "rejected",
        rejectionReason: rejectionReason || "Référence Wave introuvable ou non conforme.",
        adminNotes: adminNotes || "",
        reviewedAt: new Date(),
        reviewedBy: session.adminId || null,
      })
      .where(eq(payments.id, Number(id)))
      .returning();

    await db
      .update(couples)
      .set({
        status: "pending_payment",
        updatedAt: new Date(),
      })
      .where(eq(couples.id, payment.coupleId));

    return Response.json({ success: true, message: "Paiement rejeté", payment: updatedPayment });
  }

  if (action === "request_new_proof") {
    const [updatedPayment] = await db
      .update(payments)
      .set({
        status: "need_new_proof",
        rejectionReason: rejectionReason || "Preuve illisible ou incomplète. Veuillez renvoyer une capture d'écran nette.",
        adminNotes: adminNotes || "",
        reviewedAt: new Date(),
        reviewedBy: session.adminId || null,
      })
      .where(eq(payments.id, Number(id)))
      .returning();

    await db
      .update(couples)
      .set({
        status: "verification",
        updatedAt: new Date(),
      })
      .where(eq(couples.id, payment.coupleId));

    return Response.json({ success: true, message: "Nouvelle preuve demandée", payment: updatedPayment });
  }

  return Response.json({ success: false, message: "Action non supportée" }, { status: 400 });
}

