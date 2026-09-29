/**
 * src/components/invitation/CeremoniesTimeline.tsx
 * ---------------------------------------------------------------------------
 * Pilier 1 : déroulé des cérémonies sur la page publique d'invitation.
 * N'affiche que les étapes activées par le couple, dans son ordre, avec ses
 * propres intitulés (rien n'est imposé par le pays).
 *
 * S'appuie sur le payload de /api/invitations/[slug]/public (champ ceremonies).
 */
"use client";

import { CalendarDays, Clock, MapPin, HeartHandshake, Building2, Church, Sparkles, PartyPopper } from "lucide-react";
import { useMemo } from "react";

export type EtapePublique = {
  key: string;
  label: string;
  ordre: number;
  event_date?: string | null;
  event_time?: string | null;
  location?: string | null;
};

type Props = {
  etapes?: EtapePublique[];
  pays?: { code?: string; nom?: string } | null;
  /** texte affiché quand le couple n'a encore activé aucune étape */
  vide?: string;
};

const ICONES: Record<string, any> = {
  fiancailles: HeartHandshake,
  civil: Building2,
  religieuse: Church,
  traditionnelle: Sparkles,
  reception: PartyPopper
};

function dateLisible(d?: string | null): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function CeremoniesTimeline({ etapes = [], pays, vide }: Props) {
  const triees = useMemo(
    () => [...etapes].sort((a, b) => Number(a.ordre || 0) - Number(b.ordre || 0)),
    [etapes]
  );

  if (triees.length === 0) {
    return (
      <section id="programme" className="glass-panel rounded-2xl border border-stone-200/70 p-6 shadow-2xs sm:p-8">
        <h2 className="font-serif text-2xl text-stone-900">Le programme</h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-stone-600">
          {vide || "Les mariés complètent encore le déroulé de leur journée. Revenez bientôt."}
        </p>
      </section>
    );
  }

  const uneSeule = triees.length === 1;

  return (
    <section id="programme" className="glass-panel rounded-2xl border border-stone-200/70 p-6 shadow-2xs sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-serif text-2xl text-stone-900">
          {uneSeule ? "La cérémonie" : "Le déroulé des cérémonies"}
        </h2>
        {pays?.nom && (
          <p className="text-xs uppercase tracking-wide text-stone-400">{pays.nom}</p>
        )}
      </div>

      <ol className="mt-6 space-y-0">
        {triees.map((e, i) => {
          const Icone = ICONES[e.key] || CalendarDays;
          const dernier = i === triees.length - 1;
          return (
            <li key={`${e.key}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
              {/* filet vertical */}
              {!dernier && (
                <span aria-hidden className="absolute left-[19px] top-10 bottom-0 w-px bg-stone-200" />
              )}

              <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-[#C05638]">
                <Icone className="size-[18px]" strokeWidth={1.6} />
              </span>

              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-serif text-lg text-stone-900">{e.label}</h3>
                  <span className="text-xs uppercase tracking-wide text-stone-400">Étape {i + 1}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-600">
                  {e.event_date && (
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="size-4 shrink-0 text-stone-400" strokeWidth={1.7} />
                      {dateLisible(e.event_date)}
                    </span>
                  )}
                  {e.event_time && (
                    <span className="inline-flex items-center gap-2">
                      <Clock className="size-4 shrink-0 text-stone-400" strokeWidth={1.7} />
                      {e.event_time}
                    </span>
                  )}
                  {e.location && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="size-4 shrink-0 text-stone-400" strokeWidth={1.7} />
                      {e.location}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {triees.some(e => !e.event_date) && (
        <p className="mt-5 rounded-xl bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-500">
          Certaines dates sont encore en cours de confirmation. Cette page est mise à jour par les mariés.
        </p>
      )}
    </section>
  );
}
