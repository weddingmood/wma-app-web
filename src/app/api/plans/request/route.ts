/**
 * /api/plans/request
 * ---------------------------------------------------------------------------
 * Pilier 6 : demande d'activation Premium (ou de mise en avant prestataire)
 * via VOTRE flux existant : le couple règle dans Wave, déclare sa référence,
 * l'équipe valide dans /wma-admin-2026-secure (onglet Payments, "accept").
 *
 * Aucune API de paiement externe. Aucune activation automatique.
 * Wave est le seul opérateur branché ; les autres sont déclarés et validés
 * à la main, comme aujourd'hui.
 */
import { NextRequest } from "next/server";
import { ok, fail, body, coupleIdOu401 } from "@/lib/platform";
import { accesDe, PRIX } from "@/lib/plans";
import { peutPayer, montantValide, lienDePaiement, getOperateur, WAVE_MARCHAND } from "@/lib/paiements";
import { coupleParId, declarerPaiement } from "@/lib/queries";

export const dynamic = "force-dynamic";

const OBJETS = ["activation", "renouvellement", "prestataire", "mise_en_avant"] as const;

export async function POST(req: NextRequest) {
  const { coupleId, reponse } = await coupleIdOu401();
  if (reponse) return reponse;

  const couple = await coupleParId(coupleId);
  if (!couple) return fail("Espace introuvable.", 404, "espace_introuvable");

  const p = await body(req);
  const objet = String(p.objet || p.purpose || "activation");
  if (!OBJETS.includes(objet as any)) return fail("Objet de paiement inconnu.", 400, "objet_inconnu");

  const operateur = String(p.provider || p.operateur || "wave").toLowerCase();
  const op = getOperateur(operateur);
  if (!op) return fail("Opérateur inconnu.", 400, "operateur_inconnu");

  // montant attendu selon l'objet
  const attendu = objet === "prestataire" ? PRIX.prestataire : objet === "mise_en_avant" ? PRIX.miseEnAvant : PRIX.premium;
  const verif = montantValide(p.amount ?? p.montant ?? attendu);
  if (!verif.valide) return fail(verif.erreur || "Montant invalide.", 400, "montant_invalide");
  if (verif.valeur < attendu) return fail(`Le montant attendu pour cette demande est de ${attendu} FCFA.`, 400, "montant_insuffisant");

  // opérateur non branché : la demande est recevable, mais sans lien automatique
  const branche = peutPayer(operateur, couple.country);
  if (!branche && !p.transferReference) {
    return fail(
      `${op.nom} n'est pas encore branché. Réglez dans votre application, puis déclarez votre référence de transfert.`,
      400,
      "operateur_non_branche"
    );
  }

  /* Votre colonne reference_number est NOT NULL : la référence est donc
     obligatoire, jamais inventée. Sans elle l'équipe ne peut pas retrouver le
     règlement dans Wave, et la validation resterait bloquée. */
  const reference = String(p.transferReference || p.reference || p.referenceNumber || "").trim();
  if (!reference) {
    return fail(
      "Indiquez la référence de votre transaction Wave. Elle permet à l'équipe de retrouver votre règlement.",
      400,
      "reference_requise"
    );
  }
  if (reference.length > 60) return fail("La référence est trop longue.", 400, "reference_trop_longue");

  const compteMarchand = String(p.providerPhone || p.numeroMarchand || "").trim();
  const paiement = await declarerPaiement(coupleId, {
    amount: verif.valeur,
    planType: couple.plan_type || couple.planType || "couple",
    payerEmail: p.payerEmail || p.email || null,
    payerPartner: p.payerPartner || null,
    paymentDate: p.paymentDate || null,
    referenceNumber: reference,
    proofImageUrl: p.proofImageUrl || p.proof_image_url || null,
    /* votre table payments n'a pas de colonne pour l'opérateur ni pour l'objet :
       les deux sont inscrits dans admin_notes, que votre écran d'équipe affiche. */
    operator: operateur,
    note: `Objet : ${objet}${compteMarchand ? ` | Compte marchand : ${compteMarchand.slice(0, 40)}` : ""}`
  });

  if (!paiement) return fail("Le règlement n'a pas pu être enregistré. Vérifiez la référence.", 500, "enregistrement_echoue");

  return ok({
    declare: true,
    paiement,
    objet,
    montant: verif.valeur,
    operateur: { key: operateur, nom: op.nom, branche },
    lienPaiement: branche ? lienDePaiement(operateur, verif.valeur) : null,
    lienMarchand: branche ? WAVE_MARCHAND : null,
    acces: accesDe(couple),
    message: branche
      ? "Demande enregistrée. Réglez via le lien, puis l'équipe validera votre activation."
      : `Demande enregistrée. ${op.nom} n'est pas encore branché : l'équipe vérifiera votre référence avant d'activer.`,
    suite: "L'équipe valide votre paiement dans l'espace d'administration. Vous recevez l'activation sans nouvelle action de votre part."
  });
}
