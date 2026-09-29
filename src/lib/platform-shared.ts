/**
 * src/lib/platform-shared.ts
 * ---------------------------------------------------------------------------
 * Petits utilitaires partagés côté client ET côté serveur (aucun import de
 * next/server ici, contrairement à platform.ts).
 */

export const WHATSAPP_OFFICIEL = "22570501356";   // +225 70 50 13 56

export function lienWhatsApp(texte: string, numero?: string): string {
  const n = String(numero || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(texte)}`;
}

export function lienWhatsAppOfficiel(texte: string): string {
  return lienWhatsApp(texte, WHATSAPP_OFFICIEL);
}

export function slugify(texte: string): string {
  return String(texte || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export function fcfa(n: number | string | null | undefined): string {
  const v = Math.round(Number(n || 0));
  return `${new Intl.NumberFormat("fr-FR").format(v).replace(/[\u00A0\u202F\u2007]/g, " ")} FCFA`;
}

export function dateLongue(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function joursRestants(d: string | Date | null | undefined): number {
  if (!d) return 0;
  const fin = new Date(d).getTime();
  if (isNaN(fin)) return 0;
  return Math.max(0, Math.ceil((fin - Date.now()) / 86400000));
}
