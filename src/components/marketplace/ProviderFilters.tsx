/**
 * src/components/marketplace/ProviderFilters.tsx
 * ---------------------------------------------------------------------------
 * Pilier 5 : filtres publics du carnet des prestataires (/marketplace).
 * Pays, ville, métier, recherche libre. Signale les fiches mises en avant.
 *
 * Appelle /api/providers/search (ajout du kit) et laisse votre liste de fiches
 * existante inchangée : ce composant ne fait que piloter les filtres.
 */
"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Search, MapPin, SlidersHorizontal, Star, X, Loader2 } from "lucide-react";

export type FichePublique = {
  id: number;
  slug: string;
  nom: string;
  pays: string;
  ville: string;
  service: string;
  serviceNom: string;
  description: string;
  prixDepart?: number | null;
  photos?: string[];
  whatsapp?: string;
  miseEnAvant: boolean;
  finMiseEnAvant?: string | null;
};

type Props = {
  /** valeur initiale du pays (celui du couple connecté, sinon CI) */
  paysInitial?: string;
  /** appelé à chaque résultat : la page existante affiche ses propres fiches */
  onResultats?: (fiches: FichePublique[], total: number) => void;
  /** rendu optionnel d'une fiche, sinon carte sobre par défaut */
  renderFiche?: (f: FichePublique) => ReactNode;
  className?: string;
};

const PAYS = [
  { code: "CI", nom: "Côte d'Ivoire" },
  { code: "SN", nom: "Sénégal" },
  { code: "ML", nom: "Mali" },
  { code: "CM", nom: "Cameroun" }
];

export default function ProviderFilters({ paysInitial = "CI", onResultats, renderFiche, className = "" }: Props) {
  const [pays, setPays] = useState(paysInitial);
  const [ville, setVille] = useState("");
  const [service, setService] = useState("");
  const [q, setQ] = useState("");
  const [villes, setVilles] = useState<string[]>([]);
  const [metiers, setMetiers] = useState<{ key: string; nom: string; description: string }[]>([]);
  const [fiches, setFiches] = useState<FichePublique[]>([]);
  const [total, setTotal] = useState(0);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");
  const [ouverts, setOuverts] = useState(false);

  const charger = useCallback(async () => {
    setCharge(true);
    setErreur("");
    try {
      const u = new URLSearchParams({ pays, limite: "24" });
      if (ville) u.set("ville", ville);
      if (service) u.set("service", service);
      if (q.trim()) u.set("q", q.trim());
      const r = await fetch(`/api/providers/search?${u.toString()}`);
      const d = await r.json();
      if (d.success) {
        setFiches(d.fiches || []);
        setTotal(Number(d.total || 0));
        setVilles(d.facettes?.villes || []);
        setMetiers(d.facettes?.metiers || []);
        onResultats?.(d.fiches || [], Number(d.total || 0));
      } else {
        setErreur(d.error || "Le carnet est momentanément indisponible.");
      }
    } catch {
      setErreur("Connexion impossible. Le carnet reste consultable hors connexion si vous l'avez déjà ouvert.");
    } finally {
      setCharge(false);
    }
  }, [pays, ville, service, q, onResultats]);

  useEffect(() => { charger(); }, [charger]);

  // la recherche texte est temporisée pour ne pas appeler à chaque frappe
  useEffect(() => {
    const t = setTimeout(() => { if (q) charger(); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const filtresActifs = useMemo(
    () => [ville && { key: "ville", nom: ville }, service && { key: "service", nom: metiers.find(m => m.key === service)?.nom || service }, q.trim() && { key: "q", nom: q.trim() }].filter(Boolean) as { key: string; nom: string }[],
    [ville, service, q, metiers]
  );

  function retirer(key: string) {
    if (key === "ville") setVille("");
    if (key === "service") setService("");
    if (key === "q") setQ("");
  }

  return (
    <div className={className}>
      {/* Barre de filtres */}
      <div className="glass-panel rounded-2xl border border-stone-200/70 p-4 shadow-2xs sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" strokeWidth={1.8} />
            <input
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Rechercher un prestataire, une ville, un métier"
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 outline-none transition focus:border-[#C05638] focus:ring-2 focus:ring-[#C05638]/15"
            />
          </div>

          <select
            value={pays}
            onChange={e => { setPays(e.target.value); setVille(""); }}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 outline-none transition focus:border-[#C05638]"
            aria-label="Pays"
          >
            {PAYS.map(p => <option key={p.code} value={p.code}>{p.nom}</option>)}
          </select>

          <select
            value={ville}
            onChange={e => setVille(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 outline-none transition focus:border-[#C05638]"
            aria-label="Ville"
          >
            <option value="">Toutes les villes</option>
            {villes.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          <button
            type="button"
            onClick={() => setOuverts(o => !o)}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 transition hover:border-stone-300"
            aria-expanded={ouverts}
          >
            <SlidersHorizontal className="size-4" strokeWidth={1.8} />
            Métiers
          </button>
        </div>

        {/* Métiers */}
        {ouverts && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={() => setService("")}
              className={`rounded-xl px-3.5 py-1.5 text-sm transition ${!service ? "bg-stone-900 text-white" : "border border-stone-200 bg-white text-stone-600 hover:border-stone-300"}`}
            >
              Tous
            </button>
            {metiers.map(m => (
              <button
                key={m.key}
                type="button"
                title={m.description}
                onClick={() => setService(m.key)}
                className={`rounded-xl px-3.5 py-1.5 text-sm transition ${service === m.key ? "bg-[#C05638] text-white" : "border border-stone-200 bg-white text-stone-600 hover:border-stone-300"}`}
              >
                {m.nom}
              </button>
            ))}
          </div>
        )}

        {/* Filtres actifs */}
        {filtresActifs.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {filtresActifs.map(f => (
              <span key={f.key} className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
                {f.nom}
                <button type="button" onClick={() => retirer(f.key)} aria-label={`Retirer ${f.nom}`} className="text-stone-400 transition hover:text-stone-700">
                  <X className="size-3" strokeWidth={2} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Résultats */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {charge ? "Recherche en cours" : `${total} prestataire${total > 1 ? "s" : ""} vérifié${total > 1 ? "s" : ""}`}
        </p>
        {charge && <Loader2 className="size-4 animate-spin text-stone-400" />}
      </div>

      {erreur && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-800">{erreur}</p>
      )}

      {!erreur && !charge && fiches.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-stone-200 bg-white/60 p-8 text-center">
          <p className="font-serif text-lg text-stone-800">Aucun prestataire ne correspond à ces critères.</p>
          <p className="mt-2 text-sm text-stone-500">
            Élargissez la recherche, ou proposez votre activité : le carnet s'enrichit chaque semaine.
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fiches.map(f => renderFiche ? (
          <div key={f.id}>{renderFiche(f)}</div>
        ) : (
          <article key={f.id} className="glass-panel relative overflow-hidden rounded-2xl border border-stone-200/70 bg-white/70 p-5 shadow-2xs transition hover:border-[#C05638]/30 hover:bg-white">
            {f.miseEnAvant && (
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#C9A86A]/15 px-2.5 py-1 text-[11px] font-medium text-[#8a6f3c]">
                <Star className="size-3" strokeWidth={2} />
                Mis en avant
              </span>
            )}
            <p className="text-xs uppercase tracking-wide text-stone-400">{f.serviceNom}</p>
            <h3 className="mt-1 font-serif text-xl text-stone-900">{f.nom}</h3>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-stone-600">
              <MapPin className="size-3.5 shrink-0 text-stone-400" strokeWidth={1.8} />
              {f.ville}{f.pays ? `, ${f.pays}` : ""}
            </p>
            {f.description && (
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-600">{f.description}</p>
            )}
            {f.prixDepart ? (
              <p className="mt-3 text-sm text-stone-500">
                À partir de {new Intl.NumberFormat("fr-FR").format(f.prixDepart).replace(/[\u00A0\u202F]/g, " ")} FCFA
              </p>
            ) : null}
            <a
              href={`/marketplace/${f.slug}`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-[#C05638] hover:text-[#C05638]"
            >
              Voir la fiche
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
