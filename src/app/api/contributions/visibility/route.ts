/**
 * /api/contributions/visibility
 * ---------------------------------------------------------------------------
 * Piliers 2 et 3 : le couple ouvre ou masque sa cagnotte sur l'invitation.
 *
 * CALÉ sur votre schéma réel : il n'existe pas de table "cagnottes". Les
 * réglages sont des colonnes de la table `invitations`, et cette route écrit
 * `show_cagnotte` et `cagnotte_enabled`. Votre écran de cagnotte existant et
 * votre /api/cagnotte/toggle lisent donc exactement les mêmes valeurs.
 *
 * L'objectif de la collecte est écrit dans `invitations.cagnotte_goal_amount`,
 * la seule colonne que la migration ajoute à cette table.
 */
import { NextRequest } from "next/server";
import { ok, fail, body, coupleIdOu401 } from "@/lib/platform";
import { accesDe } from "@/lib/plans";
import { montant } from "@/lib/pays";
import {
  coupleParId, cagnotteDuCouple, visibiliteCagnotte,
  definirObjectifCagnotte, compteurCadeaux
} from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Plafond de l'objectif, pour rester cohérent avec celui des gestes. */
const OBJECTIF_MAX = 100_000_000;

export async function PATCH(req: NextRequest) {
  const { coupleId, reponse } = await coupleIdOu401();
  if (reponse) return reponse;

  const couple = await coupleParId(coupleId);
  if (!couple) return fail("Espace introuvable.", 404, "espace_introuvable");

  const acces = accesDe(couple);
  const p = await body(req);
  const visible = Boolean(p.visible);

  if (visible && !acces.premium) {
    return fail(
      acces.lectureSeule
        ? "Votre essai est terminé. Activez Premium pour ouvrir votre cagnotte."
        : "La cagnotte s'ouvre avec Premium. Vous pouvez d'abord essayer gratuitement.",
      403,
      "premium_requis"
    );
  }

  /* La configuration vit sur la ligne invitations : sans elle, rien à écrire. */
  const avant = await cagnotteDuCouple(coupleId);
  if (!avant) {
    return fail(
      "Votre invitation n'est pas encore créée. Publiez d'abord votre invitation, puis revenez régler la cagnotte.",
      409,
      "invitation_absente"
    );
  }

  // objectif facultatif, transmis en même temps que la visibilité
  const objectif = Number(p.goalAmount ?? p.objectif ?? 0);
  if (objectif > 0) {
    if (objectif > OBJECTIF_MAX) return fail("L'objectif dépasse le plafond autorisé.", 400, "objectif_trop_eleve");
    await definirObjectifCagnotte(coupleId, objectif);
  }

  const maj = await visibiliteCagnotte(coupleId, visible);
  const cagnotte = await cagnotteDuCouple(coupleId);
  const compteur = await compteurCadeaux(coupleId);
  const estVisible = Boolean(maj?.visible);

  return ok({
    misAJour: true,
    visible: estVisible,
    objectif: Number(cagnotte?.objectif || 0),
    libelle: cagnotte?.titre || "Notre cagnotte de mariage",
    compteur,
    texteCollecte: montant(compteur.collecte, couple.country),
    message: estVisible
      ? "Votre cagnotte est visible sur l'invitation. Vos invités peuvent y participer."
      : "Votre cagnotte est masquée. Les gestes déjà reçus sont conservés."
  });
}
