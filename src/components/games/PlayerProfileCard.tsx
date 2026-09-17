"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Award,
  Flame,
  Volume2,
  VolumeX,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { isSoundEnabled, setSoundEnabled } from "@/lib/game-audio";

interface Props {
  p1Name?: string;
  p2Name?: string;
  p1Photo?: string;
  p2Photo?: string;
  stats?: {
    totalGames: number;
    p1Wins: number;
    p2Wins: number;
    aiWins: number;
    draws: number;
    statsByGame?: Record<string, { played: number; p1Wins: number; p2Wins: number; bestScore1: number; bestScore2: number }>;
  };
}

export function PlayerProfileCard({
  p1Name = "David",
  p2Name = "Ruth",
  p1Photo,
  p2Photo,
  stats,
}: Props) {
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const total = stats?.totalGames || 0;
  const p1Wins = stats?.p1Wins || 0;
  const p2Wins = stats?.p2Wins || 0;

  const winRateP1 = total > 0 ? Math.round((p1Wins / total) * 100) : 50;
  const winRateP2 = total > 0 ? Math.round((p2Wins / total) * 100) : 50;

  return (
    <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-6">
      {/* Top Banner with sound toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#C05638] block">
            Espace Compétition Saine & Complicité
          </span>
          <h3 className="font-serif font-bold text-stone-900 text-lg sm:text-xl">
            Profils des Joueurs • {p1Name} & {p2Name}
          </h3>
        </div>

        <button
          onClick={toggleSound}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
            soundOn
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-stone-100 text-stone-600 border-stone-200"
          }`}
          title="Activer ou désactiver les effets sonores des jeux"
        >
          {soundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
          <span>{soundOn ? "Sons Activés" : "Sons Coupés"}</span>
        </button>
      </div>

      {/* Two Player Profiles Side-by-Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Partner 1 (David) */}
        <div className="p-5 rounded-3xl glass-card-warm border border-[#EAE2D5] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#C05638] shadow-xs shrink-0">
              <img
                src={p1Photo || "https://images.pexels.com/photos/34887758/pexels-photo-34887758.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400"}
                alt={p1Name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-base">{p1Name}</h4>
              <span className="text-[11px] text-[#C05638] font-semibold">Terracotta • Sud</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">Victoires</span>
              <strong className="text-stone-900 font-serif text-lg">{p1Wins}</strong>
            </div>
            <div className="p-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">Taux</span>
              <strong className="text-[#C05638] font-serif text-lg">{winRateP1}%</strong>
            </div>
            <div className="p-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">Parties</span>
              <strong className="text-stone-900 font-serif text-lg">{total}</strong>
            </div>
          </div>
        </div>

        {/* Partner 2 (Ruth) */}
        <div className="p-5 rounded-3xl glass-card-warm border border-[#EAE2D5] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-xs shrink-0">
              <img
                src={p2Photo || "https://images.pexels.com/photos/37828098/pexels-photo-37828098.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400"}
                alt={p2Name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-base">{p2Name}</h4>
              <span className="text-[11px] text-[#B37D28] font-semibold">Or • Nord</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">Victoires</span>
              <strong className="text-stone-900 font-serif text-lg">{p2Wins}</strong>
            </div>
            <div className="p-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">Taux</span>
              <strong className="text-[#B37D28] font-serif text-lg">{winRateP2}%</strong>
            </div>
            <div className="p-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">Parties</span>
              <strong className="text-stone-900 font-serif text-lg">{total}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Per Game Statistics Breakdown */}
      {stats?.statsByGame && (
        <div className="pt-2">
          <span className="text-xs font-bold text-stone-800 block mb-2.5">
            Statistiques Détaillées par Jeu :
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {[
              { id: "ludo", name: "Ludo Nuptial", color: "#C05638" },
              { id: "awale", name: "Awalé Ivoirien", color: "#7A4E2D" },
              { id: "dames", name: "Jeu de Dames", color: "#D4AF37" },
              { id: "mots", name: "Défi des Mots", color: "#145A32" },
            ].map((g) => {
              const gStats = stats.statsByGame?.[g.id] || { played: 0, p1Wins: 0, p2Wins: 0 };
              return (
                <div key={g.id} className="p-3 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1">
                  <span className="font-bold text-stone-900 block truncate">{g.name}</span>
                  <div className="text-[11px] text-stone-500">
                    Jouées : <strong>{gStats.played}</strong>
                  </div>
                  <div className="text-[10px] text-stone-600 flex justify-between">
                    <span>{p1Name} : {gStats.p1Wins}</span>
                    <span>{p2Name} : {gStats.p2Wins}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
