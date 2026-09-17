"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  BookOpen,
  Volume2,
  Play,
  Pause,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export default function DevotionsPage() {
  const { couple, activePartner, partnerName, activeTheme } = useTheme();
  const [devotions, setDevotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchDevotions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/devotions");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDevotions(data.devotions || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevotions();
  }, []);

  const currentDev = devotions.find((d) => d.themeNumber === selectedThemeId) || devotions[0];

  useEffect(() => {
    if (currentDev) {
      setNotes(currentDev.notes || "");
    }
  }, [currentDev]);

  const handleToggleComplete = async () => {
    if (!currentDev) return;
    try {
      await fetch("/api/devotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devotionId: currentDev.id, notes }),
      });
      fetchDevotions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Nous deux & Dieu • Les 7 Piliers Fondateurs</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Préparation Spirituelle & Édification du Couple
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Un parcours biblique structuré pour bâtir un mariage sur le Roc. Chaque thème réunit enseignement pastoral, verset clé, réflexion, questions intimes et prière conjointe.
        </p>

        {/* 7 Themes Horizontal Navigator */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
          {devotions.map((d) => {
            const isSelected = d.themeNumber === selectedThemeId;
            const isDone = d.isFullyCompleted;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedThemeId(d.themeNumber)}
                className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between min-h-[85px] cursor-pointer ${
                  isSelected
                    ? "bg-[#C05638] text-white border-[#C05638] shadow-md"
                    : isDone
                    ? "glass-card-warm border-emerald-200 text-stone-800"
                    : "bg-white/80 hover:bg-white border-stone-200 text-stone-700"
                }`}
                style={isSelected ? { backgroundColor: activeTheme.primary } : {}}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold ${isSelected ? "text-white/80" : "text-stone-400"}`}>
                    Thème {d.themeNumber}
                  </span>
                  {isDone && (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                  )}
                </div>
                <div className="font-serif font-bold text-xs line-clamp-2 mt-1">
                  {d.title.split(":")[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Devotion Stage */}
      {currentDev && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Teaching Content */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-6">
              
              {/* Header */}
              <div className="border-b border-stone-100 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-[#C05638] tracking-wider">
                    Jalon : {currentDev.timelinePhase || "J-90"} • Thème {currentDev.themeNumber} / 7
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    {currentDev.pastorName || "Direction Pastorale"}
                  </span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-stone-900">
                  {currentDev.title}
                </h2>
              </div>

              {/* Scripture Highlight Box */}
              <div className="p-5 rounded-2xl glass-card-warm border-l-4 border-[#C05638] border-y border-r border-stone-200 space-y-2">
                <span className="text-xs uppercase tracking-wider font-bold text-[#C05638]">
                  {currentDev.scriptureRef}
                </span>
                <p className="font-serif text-base sm:text-lg italic text-stone-900 leading-relaxed">
                  « {currentDev.scriptureText} »
                </p>
              </div>

              {/* Teaching Body */}
              <div className="space-y-3">
                <h3 className="font-serif font-bold text-stone-900 text-lg">Enseignement Pastoral</h3>
                <p className="text-stone-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {currentDev.teaching}
                </p>
              </div>

              {/* Reflection & Couple Question */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                  <strong className="block text-amber-900 font-bold">Réflexion Personnelle :</strong>
                  <p className="text-stone-700 leading-relaxed">{currentDev.reflection}</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs space-y-1">
                  <strong className="block text-purple-900 font-bold">Question de Dialogue à Deux :</strong>
                  <p className="text-stone-700 leading-relaxed">{currentDev.coupleQuestion}</p>
                </div>
              </div>

              {/* Prayer Model */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs">
                <strong className="block text-emerald-900 font-bold uppercase tracking-wider">
                  Prière du Couple :
                </strong>
                <p className="font-serif text-sm italic text-stone-800 leading-relaxed">
                  « {currentDev.prayerModel} »
                </p>
              </div>

              {/* Pastor Audio in Light White Glass */}
              <div className="p-4 rounded-2xl glass-card-warm border border-[#EAE2D5] text-stone-900 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 rounded-xl bg-[#C05638] text-white hover:bg-[#A84429] shadow-md transition-all shrink-0 cursor-pointer"
                    style={{ backgroundColor: activeTheme.primary }}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <div>
                    <div className="font-serif font-bold text-sm text-stone-900">Méditation Audio du Pasteur</div>
                    <div className="text-[11px] text-stone-500">Prédication et prière de bénédiction (4 min)</div>
                  </div>
                </div>
                <Volume2 className="w-5 h-5 text-[#C05638] shrink-0" />
              </div>

            </div>
          </div>

          {/* Sidebar: Couple Dual Validation & Personal Notes */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Status Card */}
            <div className="p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-stone-900 text-lg border-b border-stone-100 pb-3">
                Validation Spirituelle à Deux
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/80 border border-stone-200">
                  <span className="font-semibold text-stone-700">{couple?.partner1Name || "David (Lui)"}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      currentDev.partner1Completed ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {currentDev.partner1Completed ? "Médité & Prié" : "En attente"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/80 border border-stone-200">
                  <span className="font-semibold text-stone-700">{couple?.partner2Name || "Ruth (Elle)"}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      currentDev.partner2Completed ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {currentDev.partner2Completed ? "Médité & Prié" : "En attente"}
                  </span>
                </div>
              </div>

              {/* Personal Notes */}
              <div>
                <label className="block text-stone-700 font-bold text-xs mb-1">
                  Nos Notes & Révélations de Prière
                </label>
                <textarea
                  rows={3}
                  placeholder="Ce que Dieu nous a inspiré durant ce temps..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-900 focus:outline-none"
                ></textarea>
              </div>

              <button
                onClick={handleToggleComplete}
                className="w-full py-3 rounded-2xl bg-[#C05638] text-white font-bold text-xs shadow-md hover:bg-[#A84429] transition-all cursor-pointer"
                style={{ backgroundColor: activeTheme.primary }}
              >
                {activePartner === "partner1"
                  ? currentDev.partner1Completed
                    ? "Modifier mon statut (Déjà Médité)"
                    : "Confirmer mon temps de prière (David)"
                  : currentDev.partner2Completed
                  ? "Modifier mon statut (Déjà Médité)"
                  : "Confirmer mon temps de prière (Ruth)"}
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
