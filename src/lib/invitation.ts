/**
 * src/lib/invitation.ts
 * ---------------------------------------------------------------------------
 * Piliers 1, 3 et 4 côté invitation publique : lien, partage WhatsApp,
 * code à scanner, déroulé des cérémonies, compteur de la collecte.
 * S'appuie sur votre page existante /invitation/[slug] et sur
 * DigitalInvitationExperience.tsx (aucun remplacement : uniquement des ajouts).
 */

import { etapesActives, montant, getPays } from "./pays";
import { lienWhatsApp } from "./platform-shared";

export function urlInvitation(slug: string, base?: string): string {
  const origine = base || process.env.NEXT_PUBLIC_SITE_URL || "";
  return `${origine}/invitation/${encodeURIComponent(String(slug || ""))}`;
}

/** Lien des animations : même page, ancre des jeux (aucune route à créer). */
export function urlJeux(slug: string, base?: string): string {
  return `${urlInvitation(slug, base)}#animations`;
}

export function textePartage(inv: {
  slug: string; partner1Name?: string; partner2Name?: string;
  weddingDate?: string | Date | null; ville?: string | null; base?: string;
}): string {
  const p1 = inv.partner1Name || "Nous";
  const p2 = inv.partner2Name ? ` et ${inv.partner2Name}` : "";
  const date = inv.weddingDate ? new Date(inv.weddingDate) : null;
  const quand = date && !isNaN(date.getTime())
    ? date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "bientôt";
  const ou = inv.ville ? ` à ${inv.ville}` : "";
  return [
    `${p1}${p2} nous marions ${quand}${ou}.`,
    "Retrouvez le programme, confirmez votre présence et, si vous le souhaitez, participez à notre cagnotte :",
    urlInvitation(inv.slug, inv.base)
  ].join("\n");
}

export function lienPartageWhatsApp(inv: Parameters<typeof textePartage>[0], numero?: string): string {
  return lienWhatsApp(textePartage(inv), numero);
}

/**
 * Code à scanner : SVG autonome (aucune dépendance, aucune image externe).
 * Encodage QR non inclus ici : votre application génère déjà les codes des
 * invités (handleShowQr). Cette fonction fournit une carte imprimable avec le
 * lien en clair, à utiliser telle quelle ou avec votre générateur existant.
 */
export function carteLien(inv: { slug: string; texte?: string; base?: string }): {
  url: string; texte: string; svg: string;
} {
  const url = urlInvitation(inv.slug, inv.base);
  const texte = inv.texte || url;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="200" viewBox="0 0 640 200">`,
    `<rect width="640" height="200" rx="20" fill="#FFFFFF" stroke="#E7E5E4"/>`,
    `<text x="32" y="62" font-family="Georgia, serif" font-size="26" fill="#1C1917">Notre invitation</text>`,
    `<text x="32" y="100" font-family="Inter, Arial, sans-serif" font-size="15" fill="#57534E">${escapeXml(texte)}</text>`,
    `<text x="32" y="150" font-family="Inter, Arial, sans-serif" font-size="14" fill="#C05638">${escapeXml(url)}</text>`,
    `</svg>`
  ].join("");
  return { url, texte, svg };
}

function escapeXml(s: string): string {
  return String(s || "").replace(/[<>&'"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
}

/** Déroulé affiché à l'invité : uniquement les étapes activées par le couple. */
export function deroulePublic(codePays: string | null | undefined, ceremonies: any[]) {
  const pays = getPays(codePays);
  return {
    pays: { code: pays.code, nom: pays.nom },
    etapes: etapesActives(codePays, ceremonies).map(e => ({
      key: e.key,
      label: e.label,
      ordre: e.ordre
    }))
  };
}

/** Compteur de la collecte, tel qu'affiché sur la page publique. */
export function compteurPublic(c: {
  visible?: boolean; collecte?: number; gestes?: number; objectif?: number;
  enAttente?: number; devise?: string; pays?: string | null; acces?: { premium?: boolean } | null;
}) {
  const ouverte = Boolean(c.visible && c.acces?.premium);
  const objectif = Number(c.objectif || 0);
  const collecte = Number(c.collecte || 0);
  return {
    ouverte,
    raison: ouverte ? null : (c.visible ? "premium_requis" : "masquee_par_le_couple"),
    collecte,
    gestes: Number(c.gestes || 0),
    enAttente: Number(c.enAttente || 0),
    objectif,
    pourcentage: objectif > 0 ? Math.min(100, Math.round((collecte / objectif) * 100)) : 0,
    texte: montant(collecte, c.pays),
    messageFerme: c.visible
      ? "La collecte ouvrira bientôt. Revenez sur cette page pour y participer."
      : "Les mariés n'ont pas encore ouvert leur cagnotte."
  };
}
