"use client";

import { useEffect, useState } from "react";

type Daily = {
  limit: number;
  answeredToday: number;
  remaining: number;
  done: boolean;
  todayCorrect: number;
  todayTotal: number;
};

export default function QuizDayDone({ category }: { category: string }) {
  const [daily, setDaily] = useState<Daily | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/quizzes?category=" + category, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d && d.daily) setDaily(d.daily as Daily);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  if (loading) {
    return <p className="text-center text-xs text-stone-500 py-10">{"Chargement\u2026"}</p>;
  }

  if (!daily || !daily.done) {
    return (
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm text-center space-y-2">
        <h3 className="font-serif font-bold text-stone-900 text-lg">{"Aucune question disponible pour le moment"}</h3>
        <p className="text-xs text-stone-600">{"Revenez un peu plus tard, de nouvelles questions arrivent bient\u00f4t."}</p>
      </div>
    );
  }

  const percent = daily.todayTotal > 0 ? Math.round((daily.todayCorrect / daily.todayTotal) * 100) : 0;
  const isDiscussion = category === "discussion_couple";

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm text-center space-y-3">
      <h3 className="font-serif font-bold text-stone-900 text-xl">
        {"Bravo, vos " + daily.limit + " questions du jour sont termin\u00e9es !"}
      </h3>
      {isDiscussion ? (
        <p className="text-sm text-stone-700">{"Vous avez partag\u00e9 vos r\u00e9ponses sur " + daily.todayTotal + " questions de couple."}</p>
      ) : (
        <div className="inline-flex items-baseline gap-2 px-5 py-3 rounded-2xl bg-orange-50 border border-orange-100">
          <span className="text-xs font-bold uppercase text-stone-500">{"Score du jour"}</span>
          <strong className="text-2xl text-[#C05638]">{daily.todayCorrect + " / " + daily.todayTotal}</strong>
          <span className="text-xs text-stone-500">{"(" + percent + " %)"}</span>
        </div>
      )}
      <p className="text-sm text-stone-600 leading-relaxed">
        {"Revenez demain pour de nouvelles questions : un petit rendez-vous quotidien pour grandir ensemble."}
      </p>
    </div>
  );
}