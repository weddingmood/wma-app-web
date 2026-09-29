import { NextRequest } from "next/server";
/**
 * /api/plans/trial
 * ---------------------------------------------------------------------------
 * Pilier 6 : essai en libre-service, une seule fois par couple.
 * Ouvre Premium pour 14 jours (cagnotte, animations, modèles soignés).
 * À l'expiration, l'espace passe en lecture seule : rien n'est supprimé,
 * l'invitation reste en ligne.
 *
 * Réutilise votre colonne couples.trial_ends_at et votre prolongation d'équipe
 * (extendTrialDays) : les deux écrivent dans le même champ.
 */
import { ok, fail, body, coupleIdOu401 } from "@/lib/platform";
import { accesDe, essaiPossible, finEssai, JOURS_ESSAI } from "@/lib/plans";
import { coupleParId, ouvrirEssai } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { coupleId, reponse } = await coupleIdOu401();
  if (reponse) return reponse;

  const couple = await coupleParId(coupleId);
  if (!couple) return fail("Espace introuvable.", 404, "espace_introuvable");

  const statut = String(couple.status || "active").toLowerCase();
  if (statut === "suspended" || statut === "blocked") {
    return fail("Espace suspendu. Contactez l'équipe Wedding Mood.", 403, "espace_suspendu");
  }

  const { possible, raison } = essaiPossible(couple);
  if (!possible) {
    if (raison === "premium_deja_actif") return fail("Premium est déjà actif sur cet espace.", 409, "premium_deja_actif");
    return fail("L'essai a déjà été utilisé sur cet espace.", 409, "essai_deja_ouvert");
  }

  const payload = await body(req);
  const jours = Math.min(JOURS_ESSAI, Math.max(1, Number(payload.jours || JOURS_ESSAI)));
  const fin = finEssai(jours);

  await ouvrirEssai(coupleId, fin);
  const apres = await coupleParId(coupleId);

  return ok({
    ouvert: true,
    jours,
    jusquau: fin.toISOString(),
    acces: accesDe(apres),
    message: `Essai Premium ouvert pour ${jours} jours.`
  });
}
