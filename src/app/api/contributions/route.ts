/**
 * /api/contributions
 * ---------------------------------------------------------------------------
 * Piliers 2 et 3 : cadeaux des invités en mobile money.
 *
 *   GET   public   ?slug=...        -> compteur de la collecte + derniers gestes
 *   POST  public   { slug, ... }    -> un invité déclare son cadeau
 *   GET   session  (couple)         -> ses gestes, y compris ceux à vérifier
 *   PATCH session  { id, statut }   -> le couple confirme ou écarte un geste
 *
 * Votre table contributions existante n'est ni modifiée ni remplacée : les
 * gestes publics sont écrits dans gift_contributions et les deux sources sont
 * réunies à la lecture du compteur.
 *
 * Aucun paiement automatique : Wave via le lien marchand Ivoirstore, les
 * autres opérateurs en déclaration de référence.
 */
import { NextRequest } from "next/server";
import { ok, fail, body, params, coupleIdOu401, sessionCouple } from "@/lib/platform";
import { accesDe } from "@/lib/plans";
import { montantValide, peutPayer, getOperateur, lienDePaiement, consigneOperateur, encadrePaiement } from "@/lib/paiements";
import { compteurCadeaux, cadeauxDuCouple, insererCadeau, confirmerCadeau, coupleParSlug, coupleParId, cagnotteDuCouple } from "@/lib/queries";

export const dynamic = "force-dynamic";

const NOM_MAX = 60;
const MESSAGE_MAX = 300;

export async function GET(req: NextRequest) {
  const p = params(req);
  const slug = String(p.get("slug") || "").toLowerCase();

  // ---- appel du couple connecté : vue privée ----
  const session = await sessionCouple();
  const coupleIdSession = Number(session?.coupleId || 0);
  if (coupleIdSession && !slug) {
    const couple = await coupleParId(coupleIdSession);
    if (!couple) return fail("Espace introuvable.", 404, "espace_introuvable");
    const acces = accesDe(couple);
    const cagnotte = await cagnotteDuCouple(coupleIdSession);
    const gestes = await cadeauxDuCouple(coupleIdSession, 200);
    const compteur = await compteurCadeaux(coupleIdSession);
    return ok({
      acces,
      cagnotte: {
        visible: Boolean(cagnotte?.visible),
        objectif: Number(cagnotte?.objectif || 0),
        libelle: cagnotte?.titre || "Notre cagnotte de mariage"
      },
      compteur,
      gestes: gestes.map(g => ({
        id: g.id,
        nom: g.donor_name,
        telephone: g.donor_phone,
        message: g.guest_message,
        montant: Number(g.amount),
        devise: g.currency,
        operateur: g.provider,
        numeroMarchand: g.provider_phone,
        reference: g.reference,
        statut: g.status,
        date: g.created_at,
        confirmeLe: g.confirmed_at
      })),
      aVerifier: gestes.filter(g => g.status === "declare").length,
      operateurs: encadrePaiement(couple.country)
    });
  }

  // ---- appel public : compteur affiché sur l'invitation ----
  if (!slug) return fail("Lien d'invitation manquant.", 400, "slug_manquant");
  const couple = await coupleParSlug(slug);
  if (!couple) return fail("Invitation introuvable.", 404, "invitation_introuvable");

  const acces = accesDe(couple);
  const cagnotte = await cagnotteDuCouple(couple.id);
  const visible = Boolean(cagnotte?.visible);
  const compteur = await compteurCadeaux(couple.id);

  if (!visible || !acces.premium) {
    return ok({
      ouverte: false,
      raison: visible ? "premium_requis" : "masquee_par_le_couple",
      compteur: { collecte: 0, gestes: 0, pourcentage: 0 },
      message: visible
        ? "La collecte ouvrira bientôt. Revenez sur cette page pour y participer."
        : "Les mariés n'ont pas encore ouvert leur cagnotte.",
      operateurs: encadrePaiement(couple.country)
    });
  }

  const objectif = Number(cagnotte?.objectif || 0);
  const gestes = await cadeauxDuCouple(couple.id, 5);

  return ok({
    ouverte: true,
    libelle: cagnotte?.titre || "Notre cagnotte de mariage",
    compteur: {
      collecte: compteur.collecte,
      gestes: compteur.gestes,
      objectif,
      pourcentage: objectif > 0 ? Math.min(100, Math.round((compteur.collecte / objectif) * 100)) : 0
    },
    derniers: gestes
      .filter(g => g.status === "confirme" && g.is_public)
      .map(g => ({ nom: g.donor_name, montant: Number(g.amount), date: g.created_at })),
    operateurs: encadrePaiement(couple.country),
    rappel: "Aucune donnée bancaire n'est enregistrée sur ce site."
  });
}

/** Un invité déclare son cadeau depuis la page publique d'invitation. */
export async function POST(req: NextRequest) {
  const p = await body(req);
  const slug = String(p.slug || params(req).get("slug") || "").toLowerCase();
  if (!slug) return fail("Lien d'invitation manquant.", 400, "slug_manquant");

  const couple = await coupleParSlug(slug);
  if (!couple) return fail("Invitation introuvable.", 404, "invitation_introuvable");

  const acces = accesDe(couple);
  const cagnotte = await cagnotteDuCouple(couple.id);
  if (!cagnotte?.visible) return fail("Les mariés n'ont pas ouvert leur cagnotte.", 403, "cagnotte_masquee");
  if (!acces.premium) return fail("La collecte ouvrira bientôt. Revenez plus tard.", 403, "premium_requis");

  const nom = String(p.donorName || p.nom || "").trim();
  if (nom.length < 2) return fail("Indiquez votre nom, il apparaîtra dans le fil des gestes.", 400, "nom_manquant");
  if (nom.length > NOM_MAX) return fail("Le nom est trop long (soixante caractères maximum).", 400, "nom_trop_long");

  const verif = montantValide(p.amount ?? p.montant);
  if (!verif.valide) return fail(verif.erreur || "Montant invalide.", 400, "montant_invalide");

  const operateur = String(p.provider || p.operateur || "wave").toLowerCase();
  const op = getOperateur(operateur);
  if (!op) return fail("Opérateur inconnu.", 400, "operateur_inconnu");
  if (!peutPayer(operateur, couple.country) && op.etat === "actif") {
    return fail(`${op.nom} n'est pas disponible pour ce mariage. Choisissez un autre opérateur.`, 400, "operateur_indisponible");
  }

  const message = String(p.guestMessage || p.message || "").trim();
  if (message.length > MESSAGE_MAX) return fail("Le message est trop long (trois cents caractères maximum).", 400, "message_trop_long");

  const telephone = String(p.donorPhone || "").replace(/[^0-9+ ]/g, "").slice(0, 20) || null;
  const reference = String(p.transferReference || p.reference || "").trim().slice(0, 60) || null;

  const geste = await insererCadeau(couple.id, {
    donorName: nom,
    donorPhone: telephone,
    guestMessage: message || null,
    amount: verif.valeur,
    currency: "XOF",
    provider: operateur,
    providerPhone: p.providerPhone || null,
    transferReference: reference
  });

  if (!geste) return fail("Le geste n'a pas pu être enregistré. Réessayez.", 500, "enregistrement_echoue");

  const branche = peutPayer(operateur, couple.country);
  const nomCouple = [couple.partner1_name, couple.partner2_name].filter(Boolean).join(" et ");

  return ok({
    enregistre: true,
    geste: { id: geste.id, nom, montant: verif.valeur, statut: geste.status },
    operateur: { key: operateur, nom: op.nom, branche },
    lienPaiement: branche ? lienDePaiement(operateur, verif.valeur) : null,
    consigne: branche ? null : consigneOperateur(operateur, verif.valeur, nomCouple),
    message: branche
      ? "Votre geste est enregistré. Réglez via le lien, les mariés le confirmeront à réception."
      : `Votre geste est enregistré. Réglez dans ${op.nom}, puis conservez votre référence : les mariés confirmeront à réception.`,
    compteur: await compteurCadeaux(couple.id)
  }, { status: 201 });
}

/** Le couple confirme ou écarte un geste déclaré. */
export async function PATCH(req: NextRequest) {
  const { coupleId, reponse } = await coupleIdOu401();
  if (reponse) return reponse;

  const p = await body(req);
  const id = Number(p.id || p.cadeauId || 0);
  if (!id) return fail("Geste introuvable.", 400, "id_manquant");

  const statut = String(p.statut || p.status || "").toLowerCase();
  if (statut !== "confirme" && statut !== "refuse") {
    return fail("Statut attendu : confirme ou refuse.", 400, "statut_invalide");
  }

  const maj = await confirmerCadeau(coupleId, id, statut);
  if (!maj) return fail("Ce geste ne fait pas partie de votre espace.", 404, "geste_introuvable");

  return ok({
    misAJour: true,
    geste: { id: maj.id, statut: maj.status, montant: Number(maj.amount) },
    compteur: await compteurCadeaux(coupleId),
    message: statut === "confirme" ? "Geste confirmé, il est ajouté à votre collecte." : "Geste écarté, il n'est pas compté."
  });
}
