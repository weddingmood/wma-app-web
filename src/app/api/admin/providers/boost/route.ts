/**
 * /api/admin/providers/boost
 * ---------------------------------------------------------------------------
 * Pilier 5 : mise en avant d'une fiche prestataire, activée par l'équipe après
 * encaissement (votre onglet Providers de /wma-admin-2026-secure).
 *   POST -> active 30 jours de mise en avant
 *   DELETE -> retire la mise en avant
 *
 * Session requise : cookie wm_admin_session. Aucun prestataire ne peut
 * s'auto-mettre en avant.
 */
import { NextRequest } from "next/server";
import { ok, fail, body, adminOu401 } from "@/lib/platform";
import { JOURS_MISE_EN_AVANT, PRIX_MISE_EN_AVANT, fichePublique } from "@/lib/vendors";
import {
  providerParId, activerMiseEnAvant,
  retirerMiseEnAvant, compterMisesEnAvantActives
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { reponse } = await adminOu401();
  if (reponse) return reponse;

  const p = await body(req);
  const identifiant = String(p.providerId || p.id || "");
  if (!identifiant) return fail("Prestataire manquant.", 400, "prestataire_manquant");

  const fiche = await providerParId(identifiant);
  if (!fiche) return fail("Prestataire introuvable.", 404, "prestataire_introuvable");
  if (String(fiche.status || "").toLowerCase() !== "approved") {
    return fail("Seule une fiche approuvée peut être mise en avant.", 409, "fiche_non_approuvee");
  }

  const jours = Math.min(365, Math.max(1, Number(p.jours || p.days || JOURS_MISE_EN_AVANT)));
  const montant = Math.max(0, Number(p.montant || p.amount || (jours / JOURS_MISE_EN_AVANT) * PRIX_MISE_EN_AVANT));
  const paiement = Number(p.paymentId || p.payment_id || 0) || null;

  const maj = await activerMiseEnAvant(fiche.id, jours, montant, paiement);
  if (!maj) return fail("La mise en avant n'a pas pu être activée.", 500, "activation_echouee");

  const apres = await providerParId(String(fiche.id));

  return ok({
    active: true,
    jours,
    montant,
    jusquau: maj.ends_at,          // provider_features.ends_at
    prestataire: fichePublique(apres || fiche),
    message: `Mise en avant activée pour ${jours} jours.`
  });
}

export async function DELETE(req: NextRequest) {
  const { reponse } = await adminOu401();
  if (reponse) return reponse;

  const identifiant = new URL(req.url).searchParams.get("providerId") || new URL(req.url).searchParams.get("id") || "";
  if (!identifiant) return fail("Prestataire manquant.", 400, "prestataire_manquant");

  const fiche = await providerParId(String(identifiant));
  if (!fiche) return fail("Prestataire introuvable.", 404, "prestataire_introuvable");

  await retirerMiseEnAvant(fiche.id);

  const apres = await providerParId(String(fiche.id));

  return ok({
    retiree: true,
    prestataire: fichePublique(apres || fiche),
    misesEnAvantActives: await compterMisesEnAvantActives(),
    message: "Mise en avant retirée."
  });
}
