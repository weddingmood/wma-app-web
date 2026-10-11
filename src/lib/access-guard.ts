// Bloque la creation ou la modification de donnees une fois l'essai gratuit termine.
// La lecture reste toujours autorisee : seules les routes qui ecrivent appellent cette fonction,
// juste apres avoir verifie la session.

import { db } from "@/db";
import { couples } from "@/db/schema";
import { eq } from "drizzle-orm";
import { WAVE_PAY_COUPLE_URL, WAVE_PAY_INDIVIDUAL_URL } from "@/lib/constants";
import { getSupportWhatsapp } from "@/lib/wma-settings";

function messageEssaiTermine(whatsappUrl: string): string {
  return (
    "Votre essai gratuit est termin\u00e9. R\u00e9glez votre abonnement pour continuer \u00e0 modifier votre espace : " +
    WAVE_PAY_COUPLE_URL +
    " (ou contactez-nous sur WhatsApp : " +
    whatsappUrl +
    ")."
  );
}

/**
 * Renvoie une reponse 402 a retourner immediatement si l'essai est expire
 * (statut "trial" ou "pending_payment" avec trialEndsAt depasse), sinon null.
 * Les statuts "active", "blocked" et "suspended" ne sont pas concernes ici.
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
    const wa = await getSupportWhatsapp();
    return Response.json(
      {
        success: false,
        code: "TRIAL_EXPIRED",
        message: messageEssaiTermine(wa.url),
        waveCoupleUrl: WAVE_PAY_COUPLE_URL,
        waveIndividualUrl: WAVE_PAY_INDIVIDUAL_URL,
        whatsappContactUrl: wa.url,
      },
      { status: 402 }
    );
  }

  return null;
}