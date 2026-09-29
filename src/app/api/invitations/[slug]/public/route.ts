/**
 * /api/invitations/[slug]/public
 * ---------------------------------------------------------------------------
 * Charge publique complète d'une invitation, en un seul appel : couple,
 * déroulé des cérémonies (pilier 1), compteur de la collecte (piliers 2 et 3),
 * animations disponibles (pilier 4).
 *
 * Votre endpoint /api/invitations/[slug] existant reste intact : celui-ci est
 * un ajout, utilisable par la page /invitation/[slug] ou par le Service Worker
 * hors connexion.
 *
 * Compatible Next.js 14 et 15 : params est attendu comme objet ou promesse.
 */
import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/platform";
import { accesDe } from "@/lib/plans";
import { deroulePublic } from "@/lib/invitation";
import { montant } from "@/lib/pays";
import {
  coupleParSlug, ceremoniesDuCouple, cagnotteDuCouple, compteurCadeaux,
  questionsQuiz, devinettes
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: any }) {
  const p: any = await ctx?.params;              // Next 15 : promesse ; Next 14 : objet
  const slug = String(p?.slug || new URL(req.url).searchParams.get("slug") || "").toLowerCase();
  if (!slug) return fail("Lien d'invitation manquant.", 400, "slug_manquant");

  const couple = await coupleParSlug(slug);
  if (!couple) return fail("Invitation introuvable.", 404, "invitation_introuvable");

  const statut = String(couple.status || "active").toLowerCase();
  if (statut === "blocked") return fail("Cette invitation n'est plus disponible.", 410, "invitation_fermee");

  const acces = accesDe(couple);
  const ceremonies = await ceremoniesDuCouple(couple.id);
  const deroule = deroulePublic(couple.country, ceremonies);

  const cagnotte = await cagnotteDuCouple(couple.id);
  const compteur = await compteurCadeaux(couple.id);
  const collecteOuverte = Boolean(cagnotte?.visible) && acces.premium;

  const quiz = collecteOuverte || acces.premium ? await questionsQuiz(couple.id, true) : [];
  const enigmes = collecteOuverte || acces.premium ? await devinettes(couple.id, true) : [];

  return ok({
    couple: {
      id: couple.id,
      slug: couple.slug,
      partenaire1: couple.partner1_name,
      partenaire2: couple.partner2_name,
      date: couple.wedding_date,
      pays: couple.country || "CI",
      ville: couple.city || ""
    },
    acces: { premium: acces.premium, palier: acces.palier, lectureSeule: acces.lectureSeule },
    ceremonies: deroule,
    cagnotte: {
      ouverte: collecteOuverte,
      raison: collecteOuverte ? null : (cagnotte?.visible ? "premium_requis" : "masquee_par_le_couple"),
      libelle: cagnotte?.titre || "Notre cagnotte de mariage",
      collecte: compteur.collecte,
      gestes: compteur.gestes,
      objectif: Number(cagnotte?.objectif || 0),
      pourcentage: Number(cagnotte?.objectif || 0) > 0
        ? Math.min(100, Math.round((compteur.collecte / Number(cagnotte?.objectif || 0)) * 100))
        : 0,
      texteCollecte: montant(compteur.collecte, couple.country),
      texteObjectif: montant(Number(cagnotte?.objectif || 0), couple.country)
    },
    animations: {
      disponibles: acces.premium,
      quiz: quiz.map(q => ({
        id: q.id, question: q.question,
        options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean)
      })),
      devinettes: enigmes.map(d => ({ id: d.id, devinette: d.riddle, indice: d.hint })),
      jeux: ["ludo", "awale", "dames", "mots"]
    }
  });
}
