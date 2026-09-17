"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Heart,
  Church,
  Landmark,
  Utensils,
  Camera,
} from "lucide-react";

export default function ChronogrammePage() {
  const { couple, activeTheme } = useTheme();
  const [timelineList, setTimelineList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState("all");

  const fetchTimeline = async () => {
    try {
      setLoading(true);
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

  const handleToggle = async (id: number, currentCompleted: boolean) => {
    try {
      await fetch("/api/timeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isCompleted: !currentCompleted }),
      });
      fetchTimeline();
    } catch (err) {
      console.error(err);
    }
  };

  const phases = ["all", "J-90", "J-60", "J-30", "J-14", "J-7", "J-1", "JOUR_J"];

  const filtered = selectedPhase === "all"
    ? timelineList
    : timelineList.filter((item) => item.phase === selectedPhase);

  const completedCount = timelineList.filter((i) => i.isCompleted).length;
  const progressPercent = timelineList.length > 0 ? Math.round((completedCount / timelineList.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100">
          <Clock className="w-3.5 h-3.5" />
          <span>Chronogramme Maître J-90 à Jour J</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Le Fil Conducteur de Notre Mariage
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Un itinéraire minutieux pas-à-pas intégrant familles, dot coutumière, état civil, cours pastoraux, prestataires et sanctification du couple jusqu'à l'autel.
        </p>

        {/* Phase Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {phases.map((p) => {
            const isActive = selectedPhase === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedPhase(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#C05638] text-white shadow-xs font-bold"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200"
                }`}
                style={isActive ? { backgroundColor: activeTheme.primary } : {}}
              >
                {p === "all" ? "Toutes les Phases" : p === "JOUR_J" ? "Jour J !" : p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress overview */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-xs text-stone-500 font-semibold uppercase">Progression du Chronogramme</span>
          <div className="text-xl font-serif font-bold text-stone-900 mt-0.5">
            {completedCount} sur {timelineList.length} jalons franchis ({progressPercent} %)
          </div>
        </div>
        <div className="w-36 bg-stone-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C05638] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%`, backgroundColor: activeTheme.primary }}
          ></div>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-4 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-stone-200 before:z-0">
        {filtered.map((item, idx) => {
          const isDone = item.isCompleted;
          return (
            <div
              key={item.id}
              className={`relative z-10 flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                isDone
                  ? "bg-[#FCFAF7] border-emerald-200"
                  : "bg-white border-stone-200 hover:shadow-md hover:border-[#D4AF37]/40"
              }`}
            >
              {/* Checkmark indicator */}
              <button
                onClick={() => handleToggle(item.id, item.isCompleted)}
                className={`p-2 rounded-xl transition-colors shrink-0 shadow-2xs ${
                  isDone
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-400"
                }`}
                title={isDone ? "Marquer non fait" : "Marquer fait"}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.phase === "JOUR_J"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-orange-100 text-[#C05638]"
                      }`}
                    >
                      {item.phase === "JOUR_J" ? "CÉLÉBRATION JOUR J" : item.phase}
                    </span>
                    <span className="text-xs font-semibold text-stone-500 capitalize">
                      {item.category}
                    </span>
                  </div>

                  <span className="text-[11px] text-stone-400">
                    Responsable : <strong>{item.assignedTo === "both" ? "Nous deux" : item.assignedTo}</strong>
                  </span>
                </div>

                <h3
                  className={`font-serif font-bold text-base ${
                    isDone ? "line-through text-stone-400" : "text-stone-900"
                  }`}
                >
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-xs text-stone-600 leading-relaxed pt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
