/**
 * src/components/invitation/GiftPanel.tsx
 * ---------------------------------------------------------------------------
 * Piliers 2 et 3 : cadeaux des invités en mobile money, sur la page publique
 * d'invitation (/invitation/[slug]).
 *
 * À brancher dans DigitalInvitationExperience.tsx (voir patches/02-invitation.md).
 * Aucun emoji, aucune donnée bancaire, aucun lien d'API de paiement :
 * Wave via le lien marchand, les autres opérateurs en déclaration de référence.
 */
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Gift, ShieldCheck, Send, CheckCircle2, Clock3, Info } from "lucide-react";

type Operateur = { key: string; nom: string; texte?: string; annonce?: string };

type Props = {
  slug: string;
  /** payload renvoyé par /api/invitations/[slug]/public */
  cagnotte?: {
    ouverte: boolean;
    raison?: string | null;
    libelle?: string;
    collecte?: number;
    gestes?: number;
    objectif?: number;
    pourcentage?: number;
    texteCollecte?: string;
    texteObjectif?: string;
  } | null;
  /** payload renvoyé par /api/contributions?slug=... */
  operateurs?: { actifs: Operateur[]; annonces: Operateur[]; montantsSuggeres: number[]; minimum: number; maximum: number } | null;
  derniers?: { nom: string; montant: number; date: string }[];
};

const fcfa = (n: number) =>
  `${new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0)).replace(/[\u00A0\u202F\u2007]/g, " ")} FCFA`;

export default function GiftPanel({ slug, cagnotte, operateurs, derniers = [] }: Props) {
  const [nom, setNom] = useState("");
  const [montant, setMontant] = useState<number | "">(10000);
  const [message, setMessage] = useState("");
  const [operateur, setOperateur] = useState("wave");
  const [reference, setReference] = useState("");
  const [publicVisible, setPublicVisible] = useState(true);
  const [etat, setEtat] = useState<"inactif" | "envoi" | "fait" | "erreur">("inactif");
  const [reponse, setReponse] = useState<any>(null);
  const [erreur, setErreur] = useState("");

  const ouverte = Boolean(cagnotte?.ouverte);
  const actif = useMemo(
    () => (operateurs?.actifs || []).find(o => o.key === operateur) || (operateurs?.actifs || [])[0],
    [operateurs, operateur]
  );
  const branche = Boolean(actif);

  useEffect(() => {
    if (actif) setOperateur(actif.key);
  }, [actif?.key]);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!ouverte) return;
    setEtat("envoi");
    setErreur("");
    try {
      const r = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          donorName: nom.trim(),
          amount: Number(montant),
          guestMessage: message.trim(),
          provider: operateur,
          transferReference: reference.trim() || null,
          isPublic: publicVisible
        })
      });
      const d = await r.json();
      if (d.success) {
        setReponse(d);
        setEtat("fait");
        setNom(""); setMessage(""); setReference(""); setMontant(10000);
      } else {
        setErreur(d.error || "Le geste n'a pas pu être enregistré.");
        setEtat("erreur");
      }
    } catch {
      setErreur("Connexion impossible. Vérifiez votre réseau puis réessayez.");
      setEtat("erreur");
    }
  }

  const pourcentage = Math.max(0, Math.min(100, Number(cagnotte?.pourcentage || 0)));

  return (
    <section id="cagnotte" className="glass-panel rounded-2xl border border-stone-200/70 p-6 shadow-2xs sm:p-8">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#C05638]/10 text-[#C05638]">
          <Gift className="size-5" strokeWidth={1.6} />
        </span>
        <div className="min-w-0">
          <h2 className="font-serif text-2xl text-stone-900">{cagnotte?.libelle || "Notre cagnotte de mariage"}</h2>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">
            Votre présence est le plus beau des cadeaux. Si vous souhaitez participer, chaque geste compte.
          </p>
        </div>
      </div>

      {!ouverte ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
          <Info className="mt-0.5 size-4 shrink-0 text-stone-400" strokeWidth={1.8} />
          <p className="leading-relaxed">
            {cagnotte?.raison === "premium_requis"
              ? "La collecte ouvrira bientôt. Revenez sur cette page pour y participer."
              : "Les mariés n'ont pas encore ouvert leur cagnotte."}
          </p>
        </div>
      ) : (
        <>
          {/* Compteur de la collecte */}
          <div className="mt-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="font-serif text-3xl text-stone-900">{fcfa(cagnotte?.collecte || 0)}</p>
              <p className="text-sm text-stone-500">
                {cagnotte?.gestes || 0} geste{(cagnotte?.gestes || 0) > 1 ? "s" : ""} reçu{(cagnotte?.gestes || 0) > 1 ? "s" : ""}
                {Number(cagnotte?.objectif || 0) > 0 ? ` sur ${fcfa(cagnotte?.objectif || 0)}` : ""}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#C05638] to-[#C9A86A] transition-[width] duration-700 ease-out"
                style={{ width: `${pourcentage}%` }}
              />
            </div>
            {pourcentage > 0 && (
              <p className="mt-2 text-xs text-stone-500">{pourcentage} % de l'objectif atteint</p>
            )}
          </div>

          {/* Derniers gestes */}
          {derniers.length > 0 && (
            <ul className="mt-5 space-y-2">
              {derniers.slice(0, 3).map((g, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-white/60 px-4 py-2.5 text-sm">
                  <span className="min-w-0 truncate text-stone-700">{g.nom}</span>
                  <span className="shrink-0 font-medium text-emerald-700">{fcfa(g.montant)}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Formulaire */}
          {etat === "fait" && reponse ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" strokeWidth={1.7} />
                <div className="min-w-0">
                  <p className="font-medium text-emerald-900">Merci, votre geste est enregistré.</p>
                  <p className="mt-1 text-sm leading-relaxed text-emerald-800/80">{reponse.message}</p>
                  {reponse.lienPaiement && (
                    <a
                      href={reponse.lienPaiement}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#C05638] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#a8482f]"
                    >
                      <Send className="size-4" strokeWidth={1.8} />
                      Régler maintenant
                    </a>
                  )}
                  {reponse.consigne && (
                    <p className="mt-3 whitespace-pre-line rounded-lg bg-white/70 p-3 text-sm text-stone-700">{reponse.consigne}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => { setEtat("inactif"); setReponse(null); }}
                    className="mt-4 text-sm text-stone-600 underline underline-offset-4 hover:text-stone-900"
                  >
                    Faire un autre geste
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={envoyer} className="mt-6 space-y-4">
              {/* Opérateurs */}
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">Opérateur</label>
                <div className="flex flex-wrap gap-2">
                  {(operateurs?.actifs || []).map(o => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => setOperateur(o.key)}
                      className={`rounded-xl border px-4 py-2 text-sm transition ${
                        operateur === o.key
                          ? "border-[#C05638] bg-[#C05638]/10 font-medium text-[#C05638]"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      {o.nom}
                    </button>
                  ))}
                  {(operateurs?.annonces || []).map(o => (
                    <span
                      key={o.key}
                      title={o.annonce}
                      className="cursor-not-allowed rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-400"
                    >
                      {o.nom}
                      <span className="ml-2 text-xs">bientôt</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Montant */}
              <div>
                <label htmlFor="gift-amount" className="mb-2 block text-sm font-medium text-stone-700">Montant</label>
                <div className="flex flex-wrap gap-2">
                  {(operateurs?.montantsSuggeres || [5000, 10000, 25000, 50000]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMontant(m)}
                      className={`rounded-xl border px-4 py-2 text-sm transition ${
                        Number(montant) === m
                          ? "border-stone-900 bg-stone-900 font-medium text-white"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      {fcfa(m)}
                    </button>
                  ))}
                </div>
                <input
                  id="gift-amount"
                  type="number"
                  inputMode="numeric"
                  min={operateurs?.minimum || 1000}
                  max={operateurs?.maximum || 2000000}
                  step={500}
                  value={montant}
                  onChange={e => setMontant(e.target.value === "" ? "" : Number(e.target.value))}
                  className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-[#C05638] focus:ring-2 focus:ring-[#C05638]/15"
                  placeholder="Autre montant"
                />
              </div>

              {/* Nom et message */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="gift-name" className="mb-2 block text-sm font-medium text-stone-700">Votre nom</label>
                  <input
                    id="gift-name"
                    type="text"
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    maxLength={60}
                    required
                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-[#C05638] focus:ring-2 focus:ring-[#C05638]/15"
                    placeholder="Comment les mariés vous appellent"
                  />
                </div>
                <div>
                  <label htmlFor="gift-ref" className="mb-2 block text-sm font-medium text-stone-700">
                    Référence du transfert <span className="font-normal text-stone-400">(facultatif)</span>
                  </label>
                  <input
                    id="gift-ref"
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    maxLength={60}
                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-[#C05638] focus:ring-2 focus:ring-[#C05638]/15"
                    placeholder="Reçue après votre envoi"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="gift-message" className="mb-2 block text-sm font-medium text-stone-700">
                  Message aux mariés <span className="font-normal text-stone-400">(facultatif)</span>
                </label>
                <textarea
                  id="gift-message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={300}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-[#C05638] focus:ring-2 focus:ring-[#C05638]/15"
                  placeholder="Un mot pour eux"
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={publicVisible}
                  onChange={e => setPublicVisible(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-stone-300 text-[#C05638] focus:ring-[#C05638]/30"
                />
                <span>Afficher mon nom dans le fil des gestes sur cette page.</span>
              </label>

              {erreur && (
                <p className="rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-800">{erreur}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="submit"
                  disabled={etat === "envoi" || !branche || !nom.trim() || !montant}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#C05638] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#a8482f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="size-4" strokeWidth={1.8} />
                  {etat === "envoi" ? "Envoi en cours" : "Offrir ce cadeau"}
                </button>
                <p className="flex items-center gap-2 text-xs text-stone-500">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-700" strokeWidth={1.7} />
                  Aucune donnée bancaire n'est enregistrée sur ce site.
                </p>
              </div>

              <p className="flex items-start gap-2 rounded-xl bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-600">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-stone-400" strokeWidth={1.7} />
                <span>
                  Le paiement se fait dans l'application de l'opérateur. Les mariés confirment chaque geste à réception :
                  le compteur n'affiche que les cadeaux reçus.
                </span>
              </p>
            </form>
          )}
        </>
      )}
    </section>
  );
}
