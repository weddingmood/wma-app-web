import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { payments, couples } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  WAVE_PAY_COUPLE_URL,
  WAVE_PAY_INDIVIDUAL_URL,
  OFFICIAL_WHATSAPP_URL,
  OFFICIAL_WHATSAPP_NUMBER,
  PRICING_PLANS,
} from "@/lib/constants";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const [couple] = await db.select().from(couples).where(eq(couples.id, session.coupleId)).limit(1);
  const paymentHistory = await db
    .select()
    .from(payments)
    .where(eq(payments.coupleId, session.coupleId))
    .orderBy(desc(payments.createdAt));

  const now = new Date();
  const trialEnds = couple?.trialEndsAt ? new Date(couple.trialEndsAt) : null;
  const isTrialActive = trialEnds ? trialEnds > now : false;
  const hoursLeftTrial = trialEnds
    ? Math.max(0, Math.round((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60)))
    : 0;

  return Response.json({
    success: true,
    coupleStatus: couple?.status || "trial",
    planType: couple?.planType || "couple",
    planAmount: couple?.planAmount || 3000,
    accessCode: couple?.accessCode || null,
    partner1Email: couple?.partner1Email || null,
    partner2Email: couple?.partner2Email || null,
    partner1Name: couple?.partner1Name || "",
    partner2Name: couple?.partner2Name || "",
    partner1AccessActive: couple?.partner1AccessActive ?? true,
    partner2AccessActive: couple?.partner2AccessActive ?? true,
    trialEndsAt: couple?.trialEndsAt,
    isTrialActive,
    hoursLeftTrial,
    plans: PRICING_PLANS,
    waveCoupleUrl: WAVE_PAY_COUPLE_URL,
    waveIndividualUrl: WAVE_PAY_INDIVIDUAL_URL,
    whatsappContactUrl: OFFICIAL_WHATSAPP_URL,
    whatsappNumber: OFFICIAL_WHATSAPP_NUMBER,
    payments: paymentHistory,
  });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { action, amount, planType, payerEmail, paymentDate, referenceNumber, proofImageUrl, partner2Email } = body;

  const [couple] = await db.select().from(couples).where(eq(couples.id, session.coupleId)).limit(1);

  // Mise à jour de l'adresse email du second partenaire
  if (action === "update-partner-emails") {
    const { newPartner1Email, newPartner2Email } = body;

    const [updated] = await db
      .update(couples)
      .set({
        partner1Email: newPartner1Email ? newPartner1Email.trim().toLowerCase() : couple?.partner1Email,
        partner2Email: newPartner2Email ? newPartner2Email.trim().toLowerCase() : couple?.partner2Email,
        updatedAt: new Date(),
      })
      .where(eq(couples.id, session.coupleId))
      .returning();

    return Response.json({
      success: true,
      message: "Les adresses email des partenaires ont été mises à jour. Chacun peut désormais se connecter avec son email et le code d'accès unique.",
      partner1Email: updated.partner1Email,
      partner2Email: updated.partner2Email,
    });
  }

  // Régénération du code d'accès unique
  if (action === "regenerate-code") {
    const newCode = `WM-${Math.floor(1000 + Math.random() * 9000)}`;
    const [updated] = await db
      .update(couples)
      .set({ accessCode: newCode, updatedAt: new Date() })
      .where(eq(couples.id, session.coupleId))
      .returning();

    return Response.json({
      success: true,
      message: `Nouveau code d'accès généré : ${newCode}`,
      accessCode: updated.accessCode,
    });
  }

  // Soumission manuelle de la preuve de règlement Wave
  if (!referenceNumber || !paymentDate) {
    return Response.json(
      {
        success: false,
        message: "La référence de transaction Wave et la date de paiement sont obligatoires.",
      },
      { status: 400 }
    );
  }

  const resolvedPlan = planType === "individual" ? "individual" : "couple";
  const resolvedAmount = Number(amount) || (resolvedPlan === "individual" ? 2000 : 3000);

  const [newPayment] = await db
    .insert(payments)
    .values({
      coupleId: session.coupleId,
      amount: resolvedAmount,
      planType: resolvedPlan,
      payerEmail: payerEmail ? payerEmail.trim().toLowerCase() : couple?.partner1Email || "",
      payerPartner: session.activePartner,
      paymentDate,
      referenceNumber: referenceNumber.trim(),
      proofImageUrl: proofImageUrl || null,
      status: "pending",
    })
    .returning();

  // Mise à jour du statut du couple et de la formule choisie
  await db
    .update(couples)
    .set({
      status: "verification",
      planType: resolvedPlan,
      planAmount: resolvedAmount,
      partner2AccessActive: resolvedPlan === "couple",
      partner2Email: partner2Email ? partner2Email.trim().toLowerCase() : couple?.partner2Email,
      updatedAt: new Date(),
    })
    .where(eq(couples.id, session.coupleId));

  return Response.json({
    success: true,
    message:
      resolvedPlan === "couple"
        ? "Preuve de règlement de 3 000 FCFA enregistrée. Après validation, les deux partenaires accéderont à l'espace avec le code unique."
        : "Preuve de règlement de 2 000 FCFA enregistrée. Votre accès individuel sera activé après vérification.",
    payment: newPayment,
  });
}
