"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/components/ThemeContext";
import { Clock, CheckCircle2, Heart } from "lucide-react";

interface TimelineItem {
  id: number;
  phase: string;
  title: string;
  description?: string | null;
  category?: string | null;
  dueDate?: string | null;
  isCompleted?: boolean | null;
  assignedTo?: string | null;
}

const PHASES = ["all", "J-90", "J-60", "J-30", "J-14", "J-7", "J-1", "JOUR_J"];
const UPCOMING_PHASES = ["J-90", "J-60", "J-30", "J-14", "J-7", "J-1"];
const PHASE_DAYS: Record<string, number> = {
  "J-90": 90,
  "J-60": 60,
  "J-30": 30,
  "J-14": 14,
  "J-7": 7,
  "J-1": 1,
  JOUR_J: 0,
};

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function phaseLabel(phase: string) {
  return phase === "JOUR_J" ? "Jour J" : phase;
}

function assigneeLabel(value?: string | null) {
  if (!value || value === "both") return "Nous deux";
  if (value === "him") return "Lui";
  if (value === "her") return "Elle";
  return value;
}

/** Fait apparaître son contenu en douceur quand il entre à l'écran. */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: delay + "ms" }}
      className={
        "transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 " +
        (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
      }
    >
      {children}
    </div>
  );
}

export default function ChronogrammePage() {
  const { couple, activeTheme } = useTheme();
  const [timelineList, setTimelineList] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState("all");
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  const fetchTimeline = async () => {
    try {
      const res = await fetch("/api/timeline");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTimelineList(data.timeline || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  useEffect(() => {
    const target = parseDate(couple?.weddingDate);
    if (!target) {
      setDaysLeft(null);
      return;
    }
    setDaysLeft(Math.ceil((target.getTime() - Date.now()) / 86400000));
  }, [couple?.weddingDate]);

  const handleToggle = async (id: number, currentCompleted: boolean) => {
    const next = !currentCompleted;
    setTimelineList((list) =>
      list.map((i) => (i.id === id ? { ...i, isCompleted: next } : i))
    );
    try {
      const res = await fetch("/api/timeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isCompleted: next }),
      });
      if (!res.ok) throw new Error("Mise à jour refusée");
    } catch (err) {
      console.error(err);
      setTimelineList((list) =>
        list.map((i) => (i.id === id ? { ...i, isCompleted: currentCompleted } : i))
      );
    }
  };

  // Prochaine échéance selon la vraie date du mariage
  const currentPhase = useMemo(() => {
    if (daysLeft === null) return null;
    if (daysLeft <= 0) return "JOUR_J";
    const reached = UPCOMING_PHASES.filter((p) => PHASE_DAYS[p] <= daysLeft);
    return reached.length > 0 ? reached[0] : "JOUR_J";
  }, [daysLeft]);

  const filtered = useMemo(
    () =>
      selectedPhase === "all"
        ? timelineList
        : timelineList.filter((item) => item.phase === selectedPhase),
    [timelineList, selectedPhase]
  );

  const groups = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const item of filtered) {
      const list = map.get(item.phase);
      if (list) list.push(item);
      else map.set(item.phase, [item]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const completedCount = timelineList.filter((i) => i.isCompleted).length;
  const progressPercent =
    timelineList.length > 0
      ? Math.round((completedCount / timelineList.length) * 100)
      : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Bandeau */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100">
          <Clock className="w-3.5 h-3.5" />
          <span>Chronogramme Maître : J-90 → Jour J</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Le Fil Conducteur de Notre Mariage
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Un itinéraire minutieux pas-à-pas intégrant familles, dot coutumière, état
          civil, cours pastoraux, prestataires et sanctification du couple jusqu'à
          l'autel.
        </p>

        {/* Filtres par phase */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {PHASES.map((p) => {
            const isActive = selectedPhase === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedPhase(p)}
                className={
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all " +
                  (isActive
                    ? "bg-[#C05638] text-white shadow-xs font-bold"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200")
                }
                style={isActive ? { backgroundColor: activeTheme.primary } : {}}
              >
                {p === "all" ? "Toutes les Phases" : p === "JOUR_J" ? "Jour J !" : p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progression */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-between gap-4">
        <div>
          <span className="text-xs text-stone-500 font-semibold uppercase">
            Progression du Chronogramme
          </span>
          <div className="text-xl font-serif font-bold text-stone-900 mt-0.5">
            {completedCount} sur {timelineList.length} jalons franchis ({progressPercent} %)
          </div>
        </div>
        <div className="w-28 sm:w-36 shrink-0 bg-stone-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C05638] rounded-full transition-all duration-700"
            style={{ width: progressPercent + "%", backgroundColor: activeTheme.primary }}
          ></div>
        </div>
      </div>

      {/* Timeline animée */}
      {loading ? (
        <p className="text-center text-sm text-stone-400 animate-pulse py-10">
          Chargement de votre chronogramme...
        </p>
      ) : groups.length === 0 ? (
        <p className="text-center text-sm text-stone-500 py-10">
          Aucun jalon pour cette phase pour le moment.
        </p>
      ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-stone-200 rounded-full" />
          <div
            className="absolute left-[19px] top-2 w-0.5 rounded-full transition-all duration-1000"
            style={{ height: progressPercent + "%", backgroundColor: "#D4AF37" }}
          />

          {groups.map(([phase, items]) => {
            const isCurrent = phase === currentPhase;
            return (
              <div key={phase} className="space-y-3 mb-6">
                <Reveal>
                  <div className="relative pl-12 flex items-center gap-2 min-h-[24px]">
                    <span
                      className={
                        "absolute left-[13px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow " +
                        (isCurrent ? "bg-[#D4AF37]" : "bg-stone-300")
                      }
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      {phaseLabel(phase)}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        En cours
                      </span>
                    )}
                  </div>
                </Reveal>

                {items.map((item, idx) => {
                  const isDone = !!item.isCompleted;
                  const isOverdue =
                    !isDone &&
                    daysLeft !== null &&
                    (PHASE_DAYS[item.phase] ?? 0) > daysLeft;
                  const dotClass = isDone
                    ? "bg-emerald-600 text-white"
                    : isOverdue
                    ? "bg-amber-100 text-amber-700 border-amber-300"
                    : isCurrent
                    ? "bg-[#FFF8F0] border-[#D4AF37]"
                    : "bg-stone-100";

                  return (
                    <Reveal key={item.id} delay={Math.min(idx, 5) * 60}>
                      <div className="relative pl-12">
                        <span
                          className={
                            "absolute left-1.5 top-5 z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm " +
                            dotClass
                          }
                        >
                          {isDone && <Heart className="w-3.5 h-3.5" fill="currentColor" />}
                        </span>

                        <div
                          className={
                            "flex items-start gap-3 p-4 sm:p-5 rounded-2xl border transition-all " +
                            (isDone
                              ? "bg-[#FFF8F0] border-emerald-200"
                              : "bg-white border-stone-200 hover:shadow-md hover:border-[#D4AF37]/40")
                          }
                        >
                          <button
                            onClick={() => handleToggle(item.id, isDone)}
                            className={
                              "p-2 rounded-xl transition-colors shrink-0 shadow-2xs " +
                              (isDone
                                ? "bg-emerald-600 text-white"
                                : "bg-stone-100 hover:bg-stone-200 text-stone-400")
                            }
                            title={isDone ? "Marquer non fait" : "Marquer fait"}
                            aria-label={isDone ? "Marquer non fait" : "Marquer fait"}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={
                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold " +
                                    (item.phase === "JOUR_J"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-orange-100 text-[#C05638]")
                                  }
                                >
                                  {item.phase === "JOUR_J" ? "CÉLÉBRATION JOUR J" : item.phase}
                                </span>
                                {item.category && (
                                  <span className="text-xs font-semibold text-stone-500 capitalize">
                                    {item.category.replace(/_/g, " ")}
                                  </span>
                                )}
                                {isOverdue && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                    En retard
                                  </span>
                                )}
                              </div>

                              <span className="text-[11px] text-stone-400">
                                Responsable : <strong>{assigneeLabel(item.assignedTo)}</strong>
                              </span>
                            </div>

                            <h3
                              className={
                                "font-serif font-bold text-base " +
                                (isDone ? "line-through text-stone-400" : "text-stone-900")
                              }
                            >
                              {item.title}
                            </h3>

                            {item.description && (
                              <p className="text-xs text-stone-600 leading-relaxed pt-0.5">
                                {item.description}
                              </p>
                            )}

                            {item.dueDate && (
                              <p className="text-[11px] text-stone-400">
                                Échéance : {item.dueDate}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}