/**
 * /api/games/public/[slug]
 * ---------------------------------------------------------------------------
 * Pilier 4 : animations jouables depuis le lien d'invitation, sans compte.
 *   GET  -> questions du couple et devinettes (réponses non envoyées)
 *   POST -> un invité envoie son score ; le couple le voit dans son tableau
 *
 * Les réponses justes ne quittent jamais le serveur en GET : elles sont
 * renvoyées uniquement dans la réponse du POST, une fois la partie jouée.
 */
import { NextRequest } from "next/server";
import { ok, fail, body } from "@/lib/platform";
import { accesDe } from "@/lib/plans";
import { coupleParSlug, questionsQuiz, devinettes, enregistrerPartie, statistiquesJeux } from "@/lib/queries";

export const dynamic = "force-dynamic";

const REPONSES = ["a", "b", "c", "d"];

export async function GET(req: NextRequest, ctx: { params: any }) {
  const p: any = await ctx?.params;
  const slug = String(p?.slug || new URL(req.url).searchParams.get("slug") || "").toLowerCase();
  if (!slug) return fail("Lien d'invitation manquant.", 400, "slug_manquant");

  const couple = await coupleParSlug(slug);
  if (!couple) return fail("Invitation introuvable.", 404, "invitation_introuvable");

  const acces = accesDe(couple);
  if (!acces.premium) {
    return ok({
      disponibles: false,
      raison: acces.lectureSeule ? "essai_termine" : "premium_requis",
      message: "Les animations de ce mariage ouvriront bientôt.",
      questions: [],
      devinettes: []
    });
  }

  const questions = await questionsQuiz(couple.id, true);
  const enigmes = await devinettes(couple.id, true);

  return ok({
    disponibles: true,
    couple: { slug: couple.slug, partenaire1: couple.partner1_name, partenaire2: couple.partner2_name },
    questions: questions.map(q => ({
      id: q.id,
      question: q.question,
      options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean)
    })),
    devinettes: enigmes.map(d => ({ id: d.id, devinette: d.riddle, indice: d.hint || null })),
    jeux: ["ludo", "awale", "dames", "mots"],
    parties: (await statistiquesJeux(couple.id)).parties
  });
}

/** Un invité termine une partie : score enregistré, corrections renvoyées. */
export async function POST(req: NextRequest, ctx: { params: any }) {
  const p: any = await ctx?.params;
  const slug = String(p?.slug || "").toLowerCase();
  const couple = await coupleParSlug(slug);
  if (!couple) return fail("Invitation introuvable.", 404, "invitation_introuvable");

  const acces = accesDe(couple);
  if (!acces.premium) return fail("Les animations de ce mariage ne sont pas ouvertes.", 403, "premium_requis");

  const payload = await body(req);
  const nom = String(payload.guestName || payload.nom || "").trim().slice(0, 60) || "Un invité";
  const reponses = Array.isArray(payload.reponses) ? payload.reponses : [];
  const kind = String(payload.kind || "quiz").toLowerCase() === "devinette" ? "devinette" : "quiz";

  if (reponses.length === 0) return fail("Aucune réponse transmise.", 400, "aucune_reponse");
  if (reponses.length > 50) return fail("Trop de réponses transmises.", 400, "trop_de_reponses");

  const questions = await questionsQuiz(couple.id, true);
  const parId = new Map(questions.map(q => [Number(q.id), q]));

  let score = 0;
  const corrections = [];
  for (const r of reponses) {
    const id = Number(r.id || r.questionId);
    const donne = String(r.reponse || r.answer || "").toLowerCase().trim();
    const q = parId.get(id);
    if (!q) { corrections.push({ id, connu: false }); continue; }
    const bonne = String(q.good_answer || "a").toLowerCase();
    const juste = REPONSES.includes(donne) && donne === bonne;
    if (juste) score += 1;
    corrections.push({ id, juste, bonne, explication: q.explanation || null, connu: true });
  }

  const partie = await enregistrerPartie(couple.id, { guestName: nom, kind, score, total: reponses.length });
  const stats = await statistiquesJeux(couple.id);

  return ok({
    enregistre: true,
    score,
    total: reponses.length,
    corrections,
    partie,
    classement: stats,
    message: score === reponses.length
      ? "Sans faute, vous connaissez bien les mariés."
      : `Vous avez ${score} bonne${score > 1 ? "s" : ""} réponse${reponses.length > 1 ? "s" : ""} sur ${reponses.length}.`
  }, { status: 201 });
}
