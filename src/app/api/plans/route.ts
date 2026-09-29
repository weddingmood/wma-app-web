/**
 * /api/plans
 * ---------------------------------------------------------------------------
 * Pilier 6 : les trois paliers, lus par la page tarifs et par le tableau de
 * bord. GET public : le catalogue des paliers est visible sans compte, et
 * renvoie en plus l'accès du couple connecté s'il y en a un.
 *
 * Aucune colonne nouvelle : les paliers s'appuient sur vos champs existants
 * planType, isPremium, trialEndsAt, status.
 */
import { ok, sessionCouple } from "@/lib/platform";
import { paliersPublics, accesDe, fonctionsParPalier, JOURS_ESSAI, LIMITE_INVITES_GRATUIT, PRIX } from "@/lib/plans";
import { coupleParId } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await sessionCouple();
  const coupleId = Number(session?.coupleId || 0);
  const couple = coupleId ? await coupleParId(coupleId) : null;
  const acces = accesDe(couple || {});

  return ok({
    paliers: paliersPublics(),
    prix: PRIX,
    joursEssai: JOURS_ESSAI,
    limiteInvitesGratuit: LIMITE_INVITES_GRATUIT,
    fonctions: fonctionsParPalier(acces),
    monAcces: couple ? acces : null,
    connecte: Boolean(couple)
  });
}
