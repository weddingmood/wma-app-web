export const WAVE_BASE = "https://pay.wave.com/m/M_W9fOyOGfFiNN/c/ci/";
export const SUPPORT_WHATSAPP_NUMBER = "22570501356";

export type OfferId = "individual" | "standard_couple" | "premium_couple";

export interface Offer {
  id: OfferId;
  name: string;
  amount: number;
  payUrl: string;
  tagline: string;
  highlight: boolean;
}

export const OFFERS: Offer[] = [
  {
    id: "individual",
    name: "Formule Individuelle",
    amount: 2000,
    payUrl: WAVE_BASE + "?amount=2000",
    tagline: "Pour un seul partenaire, avec \u00e9volution possible vers Couple.",
    highlight: false,
  },
  {
    id: "standard_couple",
    name: "Couple Standard",
    amount: 3000,
    payUrl: WAVE_BASE + "?amount=3000",
    tagline: "Les deux partenaires, synchronis\u00e9s, sans les options Premium.",
    highlight: false,
  },
  {
    id: "premium_couple",
    name: "Couple Premium",
    amount: 5000,
    payUrl: WAVE_BASE + "?amount=5000",
    tagline: "Acc\u00e8s total : traiteurs v\u00e9rifi\u00e9s, tous les jeux et les livres.",
    highlight: true,
  },
];

// Complement pour passer de Standard a Premium (lien Wave existant)
export const UPGRADE_OFFER = { amount: 2000, payUrl: WAVE_BASE + "?amount=2000" };

export const COMPARISON: Array<{ label: string; values: [boolean, boolean, boolean] }> = [
  { label: "Tous les modules de pr\u00e9paration (budget, t\u00e2ches, calendrier, invit\u00e9s\u2026)", values: [true, true, true] },
  { label: "Code d'acc\u00e8s unique (personnel ou du couple)", values: [true, true, true] },
  { label: "Connexion par email personnel", values: [true, true, true] },
  { label: "Acc\u00e8s simultan\u00e9 des 2 partenaires", values: [false, true, true] },
  { label: "Synchronisation instantan\u00e9e entre les 2 t\u00e9l\u00e9phones", values: [false, true, true] },
  { label: "Jeux contre l'ordinateur", values: [true, true, true] },
  { label: "Jeux \u00e0 deux en ligne (Ludo, Awal\u00e9, Dames, Mots)", values: [false, true, true] },
  { label: "Service traiteurs v\u00e9rifi\u00e9s", values: [false, false, true] },
  { label: "Livres et guides", values: [false, false, true] },
  { label: "Support WhatsApp prioritaire", values: [false, false, true] },
];