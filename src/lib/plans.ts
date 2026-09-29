/**
 * src/lib/plans.ts
 * ---------------------------------------------------------------------------
 * Pilier 6 : trois paliers clairs, adossés à VOTRE modèle existant.
 *
 * CALÉ sur votre schéma réel (src/db/schema.ts, lu le 29 septembre 2026) :
 *   couples.status       trial | pending_payment | verification | active
 *                        | expired | suspended
 *   couples.trial_ends_at  timestamp, déjà présent
 *   couples.plan_type      couple | individual, déjà présent
 *   couples.plan_amount    entier, déjà présent
 *
 * Il n'y a PAS de colonne is_premium chez vous : Premium = status "active",
 * essai = trial_ends_at dans le futur, lecture seule = "expired".
 * Ce module ne remplace rien : il met vos champs en forme et ajoute le palier
 * gratuit permanent, l'essai en libre-service et la lecture seule.
 *
 * Logique pure : aucun import serveur, testable sans base.
 */

export type Palier = "gratuit" | "premium" | "prestataire";

export const JOURS_ESSAI = 14;
export const LIMITE_INVITES_GRATUIT = 50;

export const PRIX = {
  premium: 2000,          // FCFA, paiement unique (votre activation actuelle)
  prestataire: 5000,      // FCFA par an
  miseEnAvant: 10000      // FCFA pour 30 jours
};

export interface DescriptifPalier {
  key: Palier;
  nom: string;
  prix: number;
  periode: string;
  accroche: string;
  inclus: string[];
  nonInclus: string[];
  cible: "couples" | "prestataires";
  recommande: boolean;
}

/** Ce qui est affiché sur la page tarifs, dans l'espace couple et en public. */
export function paliersPublics(devise = "FCFA"): DescriptifPalier[] {
  return [
    {
      key: "gratuit", nom: "Gratuit", prix: 0, periode: "sans limite de durée",
      accroche: "Pour annoncer votre mariage et recevoir les réponses de vos invités.",
      inclus: [
        "Invitation numérique et lien de partage",
        "Réponses des invités : présence, allergies, message aux mariés",
        "Carnet des prestataires vérifiés et prise de contact",
        `Jusqu'à ${LIMITE_INVITES_GRATUIT} invités`
      ],
      nonInclus: ["Cagnotte et cadeaux des invités", "Animations jouables par les invités", "Modèles d'invitation premium", "Personnalisation avancée"],
      cible: "couples", recommande: false
    },
    {
      key: "premium", nom: "Premium", prix: PRIX.premium, periode: "paiement unique pour l'ouverture de l'espace",
      accroche: "L'expérience complète : invitation soignée, cagnotte et animations pour vos invités.",
      inclus: [
        "Modèles d'invitation premium et carte personnalisable",
        "Cagnotte de mariage et cadeaux des invités en mobile money",
        "Animations pour les invités : quiz du couple, devinettes, jeux en ligne",
        "Personnalisation avancée : palettes, typographies, modes d'affichage",
        "Invités illimités et suivi complet des réponses",
        "Suivi le jour du mariage : présences, mur de bénédictions, grand écran"
      ],
      nonInclus: [],
      cible: "couples", recommande: true
    },
    {
      key: "prestataire", nom: "Prestataire", prix: PRIX.prestataire, periode: "par an",
      accroche: "Pour les professionnels qui veulent être trouvés par les couples.",
      inclus: [
        "Fiche vérifiée dans le carnet des prestataires",
        "Demandes de contact reçues sur WhatsApp",
        "Statistiques : vues de la fiche et mises en relation",
        "Accès à la mise en avant payante (en tête des recherches)"
      ],
      nonInclus: [],
      cible: "prestataires", recommande: false
    }
  ];
}

/** Palier requis pour chaque fonction. Une seule source de vérité. */
export const FONCTIONS: Record<string, Palier> = {
  invitation_simple: "gratuit",
  rsvp: "gratuit",
  partage_whatsapp: "gratuit",
  prestataires: "gratuit",          // vitrine publique : elle sert aussi la conversion
  budget: "gratuit",
  invites_illimites: "premium",
  modeles_premium: "premium",
  personnalisation_avancee: "premium",
  cagnotte: "premium",
  contributions: "premium",
  animations: "premium",
  jeux_publics: "premium",
  grand_ecran: "premium",
  fiche_prestataire: "prestataire",
  mise_en_avant: "prestataire"
};

export interface Acces {
  palier: Palier;
  premium: boolean;
  acquis: boolean;
  enEssai: boolean;
  /** paiement déclaré, en attente de validation par l'équipe */
  enAttente: boolean;
  essaiExpire: boolean;
  suspendu: boolean;
  /** valeur brute de couples.status, pour vos écrans */
  statut: string;
  joursRestants: number;
  lectureSeule: boolean;
  limiteInvites: number | null;
  planType: "couple" | "individual";
  message: string;
}

/**
 * Calcule l'accès d'un couple à partir de VOS colonnes.
 * Tolérant aux noms snake_case et camelCase (Drizzle renvoie ce que vous avez
 * défini dans votre schéma).
 */
export function accesDe(couple: any): Acces {
  const c = couple || {};
  const champ = (...cles: string[]) => {
    for (const k of cles) if (c[k] !== undefined && c[k] !== null) return c[k];
    return null;
  };

  /**
   * CALÉ sur votre schéma réel : la table couples n'a PAS de colonne
   * is_premium. Le palier se déduit de `status` et de `trial_ends_at` :
   *
   *   trial            essai en cours si trial_ends_at est dans le futur,
   *                    sinon espace gratuit encore vierge
   *   pending_payment  paiement déclaré, en attente de validation équipe
   *   verification     vérification en cours, même effet que pending_payment
   *   active           Premium acquis
   *   expired          essai terminé : lecture seule
   *   suspended        espace suspendu : lecture seule
   *
   * La colonne is_premium reste tolérée si vous l'ajoutez un jour.
   */
  const statut = String(champ("status", "statut") || "trial").toLowerCase();
  const planType = (String(champ("planType", "plan_type") || "couple") === "individual"
    ? "individual" : "couple") as "couple" | "individual";

  const brutEssai = champ("trialEndsAt", "trial_ends_at", "trialUntil", "trial_until");
  const finEssai = brutEssai ? new Date(brutEssai) : null;
  const finValide = Boolean(finEssai && !isNaN(finEssai!.getTime()));
  const maintenant = Date.now();

  const suspendu = statut === "suspended" || statut === "blocked";
  const acquis = statut === "active" || Boolean(champ("isPremium", "is_premium"));
  const enAttente = statut === "pending_payment" || statut === "verification";

  const enEssai = !acquis && !suspendu && finValide && finEssai!.getTime() > maintenant;
  const essaiExpire = !acquis && !suspendu && !enEssai &&
    (statut === "expired" || (finValide && finEssai!.getTime() <= maintenant));

  const premium = acquis || enEssai;
  const joursRestants = enEssai ? Math.max(0, Math.ceil((finEssai!.getTime() - maintenant) / 86400000)) : 0;
  const lectureSeule = suspendu || essaiExpire;

  const palier: Palier = premium ? "premium" : "gratuit";

  let message: string;
  if (suspendu) message = "Espace suspendu. Contactez l'équipe Wedding Mood pour le réactiver.";
  else if (acquis) message = "Espace Premium actif.";
  else if (enEssai) message = `Essai Premium, ${joursRestants} jour${joursRestants > 1 ? "s" : ""} restant${joursRestants > 1 ? "s" : ""}.`;
  else if (enAttente) message = "Paiement en cours de vérification par l'équipe. Votre accès s'ouvrira dès validation.";
  else if (essaiExpire) message = "Essai terminé. Votre espace reste consultable en lecture seule.";
  else message = "Espace gratuit. Premium ouvre la cagnotte, les animations et les modèles soignés.";

  return {
    palier,
    premium,
    acquis,
    enEssai,
    enAttente,
    essaiExpire,
    suspendu,
    statut,
    joursRestants,
    lectureSeule,
    limiteInvites: premium ? null : LIMITE_INVITES_GRATUIT,
    planType,
    message
  };
}

/** La fonction demandée est-elle utilisable avec cet accès ? */
export function peut(fonction: string, acces: Acces): boolean {
  const requis = FONCTIONS[fonction] || "premium";
  if (acces.lectureSeule) return false;
  if (requis === "gratuit") return true;
  return acces.premium;
}

/** Liste affichable : chaque fonction, son palier, son accessibilité. */
export function fonctionsParPalier(acces: Acces) {
  return Object.entries(FONCTIONS).map(([key, palier]) => ({
    key,
    requis: palier,
    accessible: peut(key, acces)
  }));
}

/** Fin d'un essai de N jours, en ISO (à écrire dans couples.trial_ends_at). */
export function finEssai(jours = JOURS_ESSAI, depuis: Date = new Date()): Date {
  const d = new Date(depuis.getTime());
  d.setDate(d.getDate() + jours);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Le couple peut-il ouvrir un essai ? (jamais deux fois, jamais après achat) */
export function essaiPossible(couple: any): { possible: boolean; raison?: string } {
  const a = accesDe(couple);
  if (a.acquis) return { possible: false, raison: "premium_deja_actif" };
  if (a.suspendu) return { possible: false, raison: "espace_suspendu" };
  // votre status vaut "trial" par défaut à la création : seul trial_ends_at
  // témoigne d'un essai réellement ouvert
  const brut = couple?.trialEndsAt ?? couple?.trial_ends_at;
  if (brut) return { possible: false, raison: a.enEssai ? "essai_en_cours" : "essai_deja_ouvert" };
  return { possible: true };
}

/** Mise en avant prestataire : date de fin à partir d'aujourd'hui. */
export function finMiseEnAvant(jours = 30, depuis: Date = new Date()): string {
  const d = new Date(depuis.getTime());
  d.setDate(d.getDate() + jours);
  return d.toISOString();
}

export function miseEnAvantActive(fiche: any, maintenant = new Date()): boolean {
  const fin = fiche?.featuredUntil ?? fiche?.featured_until;
  if (!fin) return false;
  return new Date(fin).getTime() > maintenant.getTime();
}
