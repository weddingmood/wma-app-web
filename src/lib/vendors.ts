/**
 * src/lib/vendors.ts
 * ---------------------------------------------------------------------------
 * Pilier 5 : marketplace des prestataires.
 * Complète votre /marketplace et /devenir-prestataire existants :
 * métiers normalisés, filtres pays / ville / service, mise en avant payante,
 * mise en relation WhatsApp avec le contexte du couple.
 * Logique pure, testable sans base.
 */

import { villesDe, type CodePays } from "./pays";
import { miseEnAvantActive } from "./plans";

/** Réexporté : les écrans et les tests lisent l'état d'une mise en avant ici. */
export { miseEnAvantActive };

export interface Metier { key: string; nom: string; icone: string; description: string; }

/** Douze métiers, dans l'ordre d'affichage du catalogue. */
/* CALÉ sur le vocabulaire exact de votre colonne providers.service.
   Votre schéma déclare : traiteur, decorateur, photographe, videaste, dj_sono,
   salle, makeup_coiffure, robe_tenues, patisserie, fleuriste, transport,
   animation_mc, autre. Toute autre clé aurait rendu le filtre inopérant :
   aucune fiche n'aurait jamais correspondu. */
export const METIERS: Metier[] = [
  { key: "traiteur",        nom: "Traiteur",                     icone: "utensils",       description: "Buffet, plats ivoiriens et européens, service à table." },
  { key: "decorateur",      nom: "Décoration",                   icone: "sparkles",       description: "Décor de salle, arche, mise en lumière, scénographie." },
  { key: "photographe",     nom: "Photographe",                  icone: "camera",         description: "Reportage du jour, séance de couple, album." },
  { key: "videaste",        nom: "Vidéaste",                     icone: "video",          description: "Film du mariage, montage, prise de vue par drone." },
  { key: "dj_sono",         nom: "DJ et sono",                   icone: "music",          description: "Animation musicale, sonorisation, éclairage de piste." },
  { key: "salle",           nom: "Lieu de réception",            icone: "mapPin",         description: "Salle, jardin, hôtel, espace en bord de mer." },
  { key: "makeup_coiffure", nom: "Coiffure et maquillage",       icone: "brush",          description: "Coiffure de la mariée, tresses, maquillage du cortège." },
  { key: "robe_tenues",     nom: "Robes et tenues",              icone: "shirt",          description: "Robe, costume, tenues traditionnelles, retouches." },
  { key: "patisserie",      nom: "Pâtisserie",                   icone: "cake",           description: "Pièce montée, douceurs, table à desserts." },
  { key: "fleuriste",       nom: "Fleuriste",                    icone: "flower2",        description: "Bouquets, boutonnières, décoration florale." },
  { key: "transport",       nom: "Transport et cortège",         icone: "car",            description: "Véhicule des mariés, navettes des invités, cortège." },
  { key: "animation_mc",    nom: "Animation et maître de cérémonie", icone: "mic",        description: "Animation, maître de cérémonie, orchestre et chorale." },
  { key: "autre",           nom: "Autre prestation",             icone: "moreHorizontal", description: "Prestation non classée, à préciser dans la description." }
];

export const JOURS_MISE_EN_AVANT = 30;
export const PRIX_MISE_EN_AVANT = 10000;   // FCFA pour 30 jours
export const PRIX_FICHE_ANNUEL = 5000;     // FCFA par an (palier Prestataire)

export const getMetier = (key?: string | null): Metier | null =>
  METIERS.find(m => m.key === String(key || "").toLowerCase()) || null;

export const metiersParPays = (_codePays?: string | null) => METIERS;

export const villesParPays = (codePays?: string | null) => villesDe(codePays as CodePays);

/** Slug lisible pour /prestataires/[slug] et le partage. */
export function slugify(texte: string): string {
  return String(texte || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Champs obligatoires pour qu'une inscription publique soit recevable. */
export function inscriptionValide(f: any): { valide: boolean; erreurs: string[] } {
  const erreurs: string[] = [];
  if (!f?.businessName || String(f.businessName).trim().length < 3) erreurs.push("Le nom de l'entreprise est requis (3 caractères minimum).");
  if (!f?.city || String(f.city).trim().length < 2) erreurs.push("La ville est requise.");
  if (!getMetier(f?.serviceKey || f?.service)) erreurs.push("Choisissez un métier dans la liste proposée.");
  const tel = String(f?.whatsapp || f?.phone || "").replace(/[^0-9]/g, "");
  if (tel.length < 8) erreurs.push("Un numéro WhatsApp valide est requis pour recevoir les demandes.");
  if (!f?.description || String(f.description).trim().length < 20) erreurs.push("Décrivez votre activité en 20 caractères minimum.");
  return { valide: erreurs.length === 0, erreurs };
}

/**
 * Filtre et trie le catalogue.
 * Les fiches mises en avant passent en tête, puis les plus récentes.
 * `fiches` = lignes de votre table providers déjà filtrées sur status = approved.
 */
export function trier(fiches: any[], filtres: { pays?: string | null; ville?: string | null; service?: string | null; q?: string | null } = {}): any[] {
  const liste = Array.isArray(fiches) ? [...fiches] : [];
  const pays = String(filtres.pays || "").toUpperCase();
  const ville = String(filtres.ville || "").trim().toLowerCase();
  const service = String(filtres.service || "").toLowerCase();
  const q = String(filtres.q || "").trim().toLowerCase();

  const out = liste.filter(f => {
    if (pays && f.country && String(f.country).toUpperCase() !== pays) return false;
    if (ville && String(f.city || "").toLowerCase() !== ville) return false;
    if (service && String(f.service || f.service_key || f.serviceKey || "").toLowerCase() !== service) return false;
    if (q) {
      const texte = [f.business_name, f.businessName, f.city, f.description, f.service, f.service_key, f.serviceKey]
        .filter(Boolean).join(" ").toLowerCase();
      if (!texte.includes(q)) return false;
    }
    return true;
  });

  const maintenant = new Date();
  return out.sort((a, b) => {
    const fa = miseEnAvantActive(a, maintenant) ? 1 : 0;
    const fb = miseEnAvantActive(b, maintenant) ? 1 : 0;
    if (fa !== fb) return fb - fa;
    const da = new Date(a.created_at || a.createdAt || 0).getTime();
    const dbb = new Date(b.created_at || b.createdAt || 0).getTime();
    return dbb - da;
  });
}

/** Fiche prête pour l'affichage public (aucun champ interne ne fuit). */
export function fichePublique(f: any, ctx: { origine?: string } = {}) {
  const maintenant = new Date();
  return {
    id: f.id,
    slug: f.slug || slugify(f.business_name || f.businessName || `prestataire-${f.id}`),
    nom: f.business_name || f.businessName || "",
    pays: f.country || "CI",
    ville: f.city || "",
    service: f.service || f.service_key || f.serviceKey || "",
    serviceNom: getMetier(f.service || f.service_key || f.serviceKey)?.nom || "Prestataire",
    description: f.description || "",
    prixDepart: f.price_from || f.priceFrom || null,
    photos: (() => { try { return typeof f.photos === "string" ? JSON.parse(f.photos) : (f.photos || []); } catch { return []; } })(),
    whatsapp: f.whatsapp || f.phone || "",
    miseEnAvant: miseEnAvantActive(f, maintenant),
    finMiseEnAvant: miseEnAvantActive(f, maintenant) ? new Date(f.featured_until || f.featuredUntil).toISOString().slice(0, 10) : null,
    origine: ctx.origine || "catalogue"
  };
}

/**
 * Lien WhatsApp de mise en relation, avec le contexte du couple.
 * Compatible avec votre helper existant waveLinkWhatsapp().
 */
export function lienContact(fiche: any, couple: { nom?: string; telephone?: string; date?: string | null; message?: string } = {}): string {
  const numero = String(fiche?.whatsapp || fiche?.phone || "").replace(/[^0-9]/g, "");
  const lignes = [
    `Bonjour ${fiche?.nom || fiche?.business_name || ""},`,
    couple.nom ? `Nous sommes ${couple.nom}.` : "Nous préparons notre mariage.",
    couple.date ? `Notre mariage est prévu le ${couple.date}.` : "",
    couple.message ? String(couple.message).slice(0, 400) : "Pouvez-vous nous indiquer vos disponibilités et vos tarifs ?",
    couple.telephone ? `Vous pouvez nous joindre au ${couple.telephone}.` : ""
  ].filter(Boolean);
  return `https://wa.me/${numero}?text=${encodeURIComponent(lignes.join("\n"))}`;
}

/** Résumé affiché à l'équipe : ce qui attend une vérification. */
export function aVerifier(fiches: any[]) {
  const liste = Array.isArray(fiches) ? fiches : [];
  return {
    total: liste.length,
    enAttente: liste.filter(f => String(f.status).toLowerCase() === "pending").length,
    approuvees: liste.filter(f => String(f.status).toLowerCase() === "approved").length,
    suspendues: liste.filter(f => String(f.status).toLowerCase() === "suspended").length,
    misesEnAvant: liste.filter(f => miseEnAvantActive(f)).length
  };
}
