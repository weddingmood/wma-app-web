/**
 * src/components/invitation/GamesPanel.tsx
 * ---------------------------------------------------------------------------
 * Pilier 4 : animations jouables depuis le lien d'invitation, sans compte.
 * Quiz du couple et devinettes, plus l'accès aux jeux en ligne (ludo, awalé,
 * dames, mots) déjà présents dans votre application.
 *
 * Les réponses justes ne sont jamais envoyées au navigateur avant la fin de la
 * partie : le score est corrigé par /api/games/public/[slug].
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Gamepad2, Sparkles, Lightbulb, Trophy, RotateCcw, ArrowRight, Info } from "lucide-react";

type Question = { id: number; question: string; options: string[] };
type Devinette = { id: number; devinette: string; indice?: string | null };

type Props = {
  slug: string;
  couple?: { partenaire1?: string; partenaire2?: string } | null;
  questions?: Question[];
  devinettes?: Devinette[];
  disponibles?: boolean;
  message?: string;
};

const LETTRES = ["a", "b", "c", "d"];
const JEUX = [
  { key: "ludo", nom: "Ludo", texte: "Le classique, à quatre, en relais." },
  { key: "awale", nom: "Awalé", texte: "Le jeu de graines, en duel." },
  { key: "dames", nom: "Dames", texte: "Une partie posée, à deux." },
  { key: "mots", nom: "Mots mêlés", texte: "Les mots du mariage, à retrouver." }
];

export default function GamesPanel({ slug, couple, questions = [], devinettes = [], disponibles = true, message }: Props) {
  const [onglet, setOnglet] = useState<"quiz" | "devinettes" | "jeux">("quiz");
  const [index, setIndex] = useState(0);
  const [choix, setChoix] = useState<Record<number, string>>({});
  const [nom, setNom] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [erreur, setErreur] = useState("");
  const [indiceOuvert, setIndiceOuvert] = useState<Record<number, boolean>>({});

  const total = questions.length;
  const repondues = useMemo(() => Object.keys(choix).length, [choix]);
  const question = questions[index];

  useEffect(() => {
    if (!disponibles || total === 0) return;
  }, [disponibles, total]);

  async function envoyerScore() {
    if (total === 0) return;
    setEnvoi(true);
    setErreur("");
    try {
      const r = await fetch(`/api/games/public/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: nom.trim() || "Un invité",
          kind: "quiz",
          reponses: Object.entries(choix).map(([id, reponse]) => ({ id: Number(id), reponse }))
        })
      });
      const d = await r.json();
      if (d.success) setResultat(d);
      else setErreur(d.error || "Le score n'a pas pu être enregistré.");
    } catch {
      setErreur("Connexion impossible. Vérifiez votre réseau puis réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  function rejouer() {
    setResultat(null);
    setChoix({});
    setIndex(0);
    setErreur("");
  }

  const noms = [couple?.partenaire1, couple?.partenaire2].filter(Boolean).join(" et ") || "les mariés";

  if (!disponibles) {
    return (
      <section id="animations" className="glass-panel rounded-2xl border border-stone-200/70 p-6 shadow-2xs sm:p-8">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-400">
            <Gamepad2 className="size-5" strokeWidth={1.6} />
          </span>
          <div>
            <h2 className="font-serif text-2xl text-stone-900">Animations</h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-600">
              {message || "Les animations de ce mariage ouvriront bientôt."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="animations" className="glass-panel rounded-2xl border border-stone-200/70 p-6 shadow-2xs sm:p-8">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A86A]/15 text-[#8a6f3c]">
          <Gamepad2 className="size-5" strokeWidth={1.6} />
        </span>
        <div className="min-w-0">
          <h2 className="font-serif text-2xl text-stone-900">Animations</h2>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">
            En attendant le grand jour, {noms} vous proposent de quoi patienter.
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {[
          { key: "quiz", nom: `Quiz du couple${total ? ` (${total})` : ""}`, actif: questions.length > 0 },
          { key: "devinettes", nom: `Devinettes${devinettes.length ? ` (${devinettes.length})` : ""}`, actif: devinettes.length > 0 },
          { key: "jeux", nom: "Jeux en ligne", actif: true }
        ].map(o => (
          <button
            key={o.key}
            type="button"
            disabled={!o.actif}
            onClick={() => setOnglet(o.key as any)}
            className={`rounded-xl px-4 py-2 text-sm transition ${
              onglet === o.key
                ? "bg-stone-900 font-medium text-white"
                : o.actif
                  ? "text-stone-600 hover:bg-stone-100"
                  : "cursor-not-allowed text-stone-300"
            }`}
          >
            {o.nom}
          </button>
        ))}
      </div>

      {/* Quiz */}
      {onglet === "quiz" && (
        <div className="mt-6">
          {total === 0 ? (
            <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
              {noms.charAt(0).toUpperCase() + noms.slice(1)} n'ont pas encore publié de questions.
            </p>
          ) : resultat ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
              <div className="flex items-center gap-3">
                <Trophy className="size-6 text-emerald-700" strokeWidth={1.7} />
                <p className="font-serif text-2xl text-emerald-900">
                  {resultat.score} / {resultat.total}
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-emerald-800/80">{resultat.message}</p>

              {Array.isArray(resultat.corrections) && (
                <ul className="mt-5 space-y-3">
                  {resultat.corrections.filter((c: any) => c.connu).map((c: any) => {
                    const q = questions.find(x => x.id === c.id);
                    if (!q) return null;
                    const bonneLettre = c.bonne;
                    const bonneIndex = LETTRES.indexOf(bonneLettre);
                    return (
                      <li key={c.id} className="rounded-xl bg-white/70 p-4">
                        <p className="text-sm font-medium text-stone-800">{q.question}</p>
                        <p className="mt-2 text-sm text-emerald-700">
                          Bonne réponse : {bonneIndex >= 0 ? q.options[bonneIndex] : bonneLettre.toUpperCase()}
                        </p>
                        {!c.juste && (
                          <p className="mt-1 text-sm text-stone-500">
                            Vous aviez répondu : {q.options[LETTRES.indexOf(String(choix[c.id] || ""))] || "rien"}
                          </p>
                        )}
                        {c.explication && <p className="mt-2 text-sm italic text-stone-600">{c.explication}</p>}
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={rejouer}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400"
                >
                  <RotateCcw className="size-4" strokeWidth={1.8} />
                  Rejouer
                </button>
                {Number(resultat.classement?.parties || 0) > 0 && (
                  <p className="text-xs text-stone-500">
                    {resultat.classement.parties} partie{resultat.classement.parties > 1 ? "s" : ""} jouée{resultat.classement.parties > 1 ? "s" : ""} sur cette invitation
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-stone-200 bg-white/70 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 text-xs text-stone-500">
                  <span>Question {index + 1} sur {total}</span>
                  <span>{repondues} réponse{repondues > 1 ? "s" : ""} donnée{repondues > 1 ? "s" : ""}</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-[#C05638] transition-[width] duration-500"
                    style={{ width: `${((index + 1) / total) * 100}%` }}
                  />
                </div>

                <p className="mt-5 font-serif text-xl leading-snug text-stone-900">{question.question}</p>

                <div className="mt-4 grid gap-2">
                  {question.options.map((opt, i) => {
                    const lettre = LETTRES[i];
                    const choisi = choix[question.id] === lettre;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setChoix(c => ({ ...c, [question.id]: lettre }))}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                          choisi
                            ? "border-[#C05638] bg-[#C05638]/10 text-[#C05638]"
                            : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                        }`}
                      >
                        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${choisi ? "bg-[#C05638] text-white" : "bg-stone-100 text-stone-500"}`}>
                          {lettre.toUpperCase()}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => setIndex(i => Math.max(0, i - 1))}
                    className="rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-600 transition hover:border-stone-300 disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  {index < total - 1 ? (
                    <button
                      type="button"
                      onClick={() => setIndex(i => Math.min(total - 1, i + 1))}
                      className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                    >
                      Suivante <ArrowRight className="size-4" strokeWidth={1.8} />
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={nom}
                        onChange={e => setNom(e.target.value)}
                        maxLength={60}
                        placeholder="Votre nom (facultatif)"
                        className="w-40 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#C05638] focus:ring-2 focus:ring-[#C05638]/15"
                      />
                      <button
                        type="button"
                        onClick={envoyerScore}
                        disabled={envoi || repondues === 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#C05638] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#a8482f] disabled:opacity-50"
                      >
                        <Sparkles className="size-4" strokeWidth={1.8} />
                        {envoi ? "Envoi" : "Voir mon score"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {erreur && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-800">{erreur}</p>}

              {repondues < total && (
                <p className="mt-3 flex items-center gap-2 text-xs text-stone-500">
                  <Info className="size-3.5 shrink-0 text-stone-400" strokeWidth={1.8} />
                  Répondez à toutes les questions pour découvrir votre score.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Devinettes */}
      {onglet === "devinettes" && (
        <div className="mt-6 space-y-3">
          {devinettes.length === 0 ? (
            <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
              Aucune devinette publiée pour l'instant.
            </p>
          ) : (
            devinettes.map((d, i) => (
              <div key={d.id} className="rounded-2xl border border-stone-200 bg-white/70 p-5">
                <p className="text-xs uppercase tracking-wide text-stone-400">Devinette {i + 1}</p>
                <p className="mt-2 font-serif text-lg leading-snug text-stone-900">{d.devinette}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {d.indice && (
                    <button
                      type="button"
                      onClick={() => setIndiceOuvert(s => ({ ...s, [d.id]: !s[d.id] }))}
                      className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-600 transition hover:border-stone-300"
                    >
                      <Lightbulb className="size-4" strokeWidth={1.8} />
                      {indiceOuvert[d.id] ? "Masquer l'indice" : "Voir un indice"}
                    </button>
                  )}
                </div>
                {indiceOuvert[d.id] && d.indice && (
                  <p className="mt-3 rounded-xl bg-[#C9A86A]/10 px-4 py-3 text-sm italic text-stone-700">{d.indice}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Jeux en ligne */}
      {onglet === "jeux" && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {JEUX.map(j => (
            <a
              key={j.key}
              href={`/invitation/${encodeURIComponent(slug)}?jeu=${j.key}#animations`}
              className="group rounded-2xl border border-stone-200 bg-white/70 p-5 transition hover:border-[#C05638]/40 hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-serif text-lg text-stone-900">{j.nom}</p>
                <ArrowRight className="size-4 text-stone-300 transition group-hover:text-[#C05638]" strokeWidth={1.8} />
              </div>
              <p className="mt-1 text-sm text-stone-600">{j.texte}</p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
