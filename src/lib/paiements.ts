/**
 * src/lib/paiements.ts
 * ---------------------------------------------------------------------------
 * Pilier 2 : mobile money élargi.
 * Pilier 3 : cadeau offert par un invité depuis la page publique d'invitation.
 *
 * Règle inchangée de votre application : AUCUNE API de paiement externe.
 * Wave reste le seul opérateur branché (lien marchand Ivoirstore). Les autres
 * opérateurs sont annoncés "disponible prochainement", avec le numéro marchand
 * à utiliser et une déclaration de référence, exactement comme votre flux
 * d'activation actuel.
 */

import type { CodePays } from "./pays";

export type EtatOperateur = "actif" | "bientot" | "prevu";

export interface Operateur {
  key: "wave" | "orange" | "mtn" | "moov" | "mpesa" | "airtel";
  nom: string;
  etat: EtatOperateur;
  pays: CodePays[];
  texte: string;
  annonce?: string;
  marchand?: string;
  /** Lien de paiement (opérateur actif uniquement). */
  lien?: (montant: number, ctx?: { lienMarchand?: string }) => string;
}

export const WAVE_MARCHAND =
  process.env.NEXT_PUBLIC_WAVE_PAY_LINK || "https://pay.wave.com/m/M_W9fOyOGfFiNN/c/ci/";
export const WAVE_COMPTE_LIBELLE = "Ivoirstore";

export const MONTANT_MIN = 1000;
export const MONTANT_MAX = 2000000;
export const MONTANTS_SUGGERES = [5000, 10000, 25000, 50000];

export const OPERATEURS: Operateur[] = [
  {
    key: "wave", nom: "Wave", etat: "actif", pays: ["CI", "SN", "ML", "CM"],
    texte: "Paiement par lien marchand, puis déclaration de la référence.",
    marchand: WAVE_COMPTE_LIBELLE,
    lien: (montant, ctx) => `${ctx?.lienMarchand || WAVE_MARCHAND}${montant ? `?amount=${Math.round(montant)}` : ""}`
  },
  {
    key: "orange", nom: "Orange Money", etat: "bientot", pays: ["CI", "SN", "ML", "CM"],
    texte: "Disponible prochainement pour vos invités.",
    annonce: "Orange Money arrive dans les prochains mois. En attendant, vos invités peuvent utiliser Wave ou déclarer un transfert."
  },
  {
    key: "mtn", nom: "MTN Mobile Money", etat: "bientot", pays: ["CI", "CM"],
    texte: "Disponible prochainement pour vos invités.",
    annonce: "MTN Mobile Money arrive dans les prochains mois."
  },
  {
    key: "moov", nom: "Moov Money", etat: "bientot", pays: ["CI"],
    texte: "Disponible prochainement pour vos invités.",
    annonce: "Moov Money arrive dans les prochains mois."
  },
  {
    key: "mpesa", nom: "M-Pesa", etat: "prevu", pays: [],
    texte: "Prévu selon l'ouverture de nouveaux pays.",
    annonce: "M-Pesa sera proposé avec l'ouverture de nouveaux pays."
  },
  {
    key: "airtel", nom: "Airtel Money", etat: "prevu", pays: [],
    texte: "Prévu selon l'ouverture de nouveaux pays.",
    annonce: "Airtel Money sera proposé avec l'ouverture de nouveaux pays."
  }
];

export const getOperateur = (key?: string | null): Operateur | null =>
  OPERATEURS.find(o => o.key === String(key || "").toLowerCase()) || null;

/** Opérateurs proposés pour un pays : les actifs d'abord, puis les annoncés. */
export function operateursPour(codePays?: string | null): Operateur[] {
  const p = String(codePays || "CI").toUpperCase() as CodePays;
  const ordre: Record<EtatOperateur, number> = { actif: 0, bientot: 1, prevu: 2 };
  return OPERATEURS
    .filter(o => o.pays.includes(p) || o.etat === "actif")
    .sort((a, b) => ordre[a.etat] - ordre[b.etat]);
}

export const operateurActif = (codePays?: string | null): Operateur =>
  operateursPour(codePays).find(o => o.etat === "actif") || OPERATEURS[0];

/** Un opérateur peut-il recevoir un geste aujourd'hui ? */
export function peutPayer(key: string | null | undefined, codePays?: string | null): boolean {
  const o = getOperateur(key);
  if (!o || o.etat !== "actif") return false;
  const p = String(codePays || "CI").toUpperCase() as CodePays;
  return o.pays.includes(p);
}

export function montantValide(montant: any): { valide: boolean; valeur: number; erreur?: string } {
  const v = Math.round(Number(montant));
  if (!Number.isFinite(v)) return { valide: false, valeur: 0, erreur: "Montant invalide." };
  if (v < MONTANT_MIN) return { valide: false, valeur: v, erreur: `Le montant minimum est de ${MONTANT_MIN} FCFA.` };
  if (v > MONTANT_MAX) return { valide: false, valeur: v, erreur: `Le montant maximum est de ${MONTANT_MAX} FCFA.` };
  return { valide: true, valeur: v };
}

export function lienDePaiement(key: string, montant: number, ctx: { lienMarchand?: string } = {}): string | null {
  const o = getOperateur(key);
  if (!o || o.etat !== "actif" || typeof o.lien !== "function") return null;
  return o.lien(montant, ctx);
}

/**
 * Message prêt à envoyer sur WhatsApp pour un opérateur non branché :
 * l'invité règle dans son application habituelle, puis déclare la référence.
 */
export function consigneOperateur(key: string, montant: number, nomCouple: string): string {
  const o = getOperateur(key);
  if (!o) return "";
  const m = Math.round(Number(montant) || 0);
  return [
    `Cadeau de mariage pour ${nomCouple}.`,
    `Opérateur : ${o.nom}.`,
    `Montant : ${m} FCFA.`,
    o.marchand ? `Compte marchand : ${o.marchand}.` : "Envoyez au numéro marchand indiqué sur la page d'invitation.",
    "Après le transfert, revenez sur la page d'invitation et déclarez votre référence."
  ].join("\n");
}

export const ETAT_CONTRIBUTION: Record<string, { label: string; ton: "emerald" | "stone" | "rose" }> = {
  declare:  { label: "À vérifier",  ton: "stone" },
  confirme: { label: "Reçu",        ton: "emerald" },
  refuse:   { label: "Non retenu",  ton: "rose" }
};

/** Ce que l'invité voit avant de saisir un montant. */
export function encadrePaiement(codePays?: string | null) {
  const actifs = operateursPour(codePays).filter(o => o.etat === "actif");
  const annonces = operateursPour(codePays).filter(o => o.etat !== "actif");
  return {
    actifs: actifs.map(o => ({ key: o.key, nom: o.nom, texte: o.texte })),
    annonces: annonces.map(o => ({ key: o.key, nom: o.nom, annonce: o.annonce || o.texte })),
    montantsSuggeres: MONTANTS_SUGGERES,
    minimum: MONTANT_MIN,
    maximum: MONTANT_MAX,
    rappel: "Aucune donnée bancaire n'est enregistrée. Le paiement se fait dans l'application de l'opérateur, puis la référence est déclarée sur cette page."
  };
}
