// Bloque la création/modification de données une fois l'essai gratuit terminé.
// La lecture reste toujours autorisée : seules les routes qui écrivent doivent
// appeler cette fonction, juste après avoir vérifié la session.

import { db } from "@/db";
import { couples } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OFFICIAL_WHATSAPP_URL, WAVE_PAY_COUPLE_URL, WAVE_PAY_INDIVIDUAL_URL } from "@/lib/constants";

const MESSAGE_ESSAI_TERMINE =
  "Votre essai gratuit est terminé. Réglez votre abonnement pour continuer à modifier votre espace : " +
  WAVE_PAY_COUPLE_URL +
  " (ou contactez-nous sur WhatsApp : " +
  OFFICIAL_WHATSAPP_URL +
  ").";

/**
 * Renvoie une réponse 402 à retourner immédiatement si l'essai est expiré
 * (statut "trial" ou "pending_payment" avec trialEndsAt dépassé), sinon null.
 * Les statuts "active", "blocked" et "suspended" ne sont pas concernés ici :
 * "blocked"/"suspended" sont déjà bloqués à la connexion, "active" n'est jamais concerné.
 */
export async function refuserSiEssaiExpire(coupleId: number): Promise<Response | null> {
  const [couple] = await db
    .select({ status: couples.status, trialEndsAt: couples.trialEndsAt })
    .from(couples)
    .where(eq(couples.id, coupleId))
    .limit(1);

  if (!couple) return null;

  const enEssai = couple.status === "trial" || couple.status === "pending_payment";
  const essaiDepasse = couple.trialEndsAt ? new Date(couple.trialEndsAt) <= new Date() : false;

  if (enEssai && essaiDepasse) {
    return Response.json(
      {
        success: false,
        code: "TRIAL_EXPIRED",
        message: MESSAGE_ESSAI_TERMINE,
        waveCoupleUrl: WAVE_PAY_COUPLE_URL,
        waveIndividualUrl: WAVE_PAY_INDIVIDUAL_URL,
        whatsappContactUrl: OFFICIAL_WHATSAPP_URL,
      },
      { status: 402 }
    );
  }

  return null;
}