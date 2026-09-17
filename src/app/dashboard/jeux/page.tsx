"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  Gamepad2,
  Trophy,
  Users,
  Bot,
  Crown,
  Sparkles,
  ArrowRight,
  History,
  ShieldCheck,
  CheckCircle2,
  Dice5,
  BookOpen,
} from "lucide-react";
import { LudoGameComponent } from "@/components/games/LudoGameComponent";
import { AwaleGameComponent } from "@/components/games/AwaleGameComponent";
import { CheckersGameComponent } from "@/components/games/CheckersGameComponent";
import { WordGameComponent } from "@/components/games/WordGameComponent";
import { PlayerProfileCard } from "@/components/games/PlayerProfileCard";

export default function JeuxPage() {
  const { couple, activeTheme, partnerPhoto, otherPartnerPhoto } = useTheme();

  const [activeGame, setActiveGame] = useState<"hub" | "ludo" | "awale" | "dames" | "mots">("hub");
  const [statsData, setStatsData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const p1Name = couple?.partner1Name || "David";
  const p2Name = couple?.partner2Name || "Ruth";

  // Fetch games history and statistics
  const fetchGameStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch("/api/games?history=1");
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.stats) {
          setStatsData(d.stats);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchGameStats();
  }, []);

  // Record completed match to backend
  const handleMatchFinish = async (
    winner: string,
    score1: number,
    score2: number,
    mode: string
  ) => {
    try {
      await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finish_match",
          gameType: activeGame,
          winner,
          score1,
          score2,
          mode,
          durationSeconds: 180,
        }),
      });
      fetchGameStats();
    } catch {
      // offline
    }
  };

  const gameCards = [
    {
      id: "ludo",
      title: "Ludo Nuptial",
      category: "Plateau & Stratégie",
      description: "La course sacrée vers l'autel de mariage : 4 pions, circuit de 52 cases, étoiles sécurisées et lancers de dé animés.",
      badge: "Multijoueur & IA",
      primaryColor: "#C05638",
      icon: Dice5,
      features: ["2 ou 4 Joueurs", "Partie en couple", "Adversaire IA", "Captures & Bonus 6"],
    },
    {
      id: "awale",
      title: "Awalé Traditionnel",
      category: "Héritage Ivoirien",
      description: "Le grand jeu de stratégie africain : semailles anti-horaires de 48 graines, captures en cascade de 2 ou 3 graines et règle de l'affamé.",
      badge: "6 Niveaux d'IA & Analyse",
      primaryColor: "#7A4E2D",
      icon: Trophy,
      features: ["6 Niveaux d'IA", "Conseils Pédagogiques", "Revue de partie", "Règles Oware"],
    },
    {
      id: "dames",
      title: "Jeu de Dames",
      category: "Réflexion & Tactique",
      description: "Plateau de 64 cases, déplacements diagonaux, prises obligatoires par saut et couronnement triomphal en Dame.",
      badge: "5 Niveaux de Tactique",
      primaryColor: "#B37D28",
      icon: Crown,
      features: ["Plateau 8x8", "Prises en cascade", "Couronnement Dame", "Aide visuelle"],
    },
    {
      id: "mots",
      title: "Défi des Mots",
      category: "Lettres & Vocabulaire",
      description: "Grille 11x11 avec cases multiplicatrices (DL, TL, DM, TM), validation par dictionnaire français et chevalet de 7 lettres.",
      badge: "Dictionnaire Officiel & Défi",
      primaryColor: "#145A32",
      icon: BookOpen,
      features: ["Dictionnaire français", "Multiplicateurs", "Défi Quotidien", "Mode Anagrammes"],
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Salle de Jeux */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-bold border border-orange-100 mb-2">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Salle de Jeux & Complicité • Wedding Mood</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Espace Jeux du Couple
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Quatre grands jeux classiques revisités avec élégance : Ludo, Awalé, Dames et Défi des Mots. Jouez à deux sur le même écran, en ligne ou contre l'ordinateur.
            </p>
          </div>

          {/* Quick Hub Navigation Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveGame("hub")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeGame === "hub"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Salle de Jeux
            </button>
            <button
              onClick={() => setActiveGame("ludo")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeGame === "ludo"
                  ? "bg-[#C05638] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Ludo
            </button>
            <button
              onClick={() => setActiveGame("awale")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeGame === "awale"
                  ? "bg-[#C05638] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Awalé
            </button>
            <button
              onClick={() => setActiveGame("dames")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeGame === "dames"
                  ? "bg-[#C05638] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Dames
            </button>
            <button
              onClick={() => setActiveGame("mots")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeGame === "mots"
                  ? "bg-[#C05638] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Mots
            </button>
          </div>
        </div>
      </div>

      {/* 2. Profil Joueur & Head-to-Head Stats Card */}
      <PlayerProfileCard
        p1Name={p1Name}
        p2Name={p2Name}
        p1Photo={partnerPhoto}
        p2Photo={otherPartnerPhoto}
        stats={statsData}
      />

      {/* 3. VUE SALLE DE JEUX / HUB PRINCIPAL */}
      {activeGame === "hub" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-stone-900 text-xl sm:text-2xl">
                Nos 4 Jeux de Table
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Sélectionnez un jeu pour lancer une partie en couple ou contre l'ordinateur.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gameCards.map((g) => {
              const Icon = g.icon;
              return (
                <div
                  key={g.id}
                  className="p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm hover:shadow-md transition-all space-y-5 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="p-3 rounded-2xl w-fit"
                        style={{ backgroundColor: `${g.primaryColor}15`, color: g.primaryColor }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                        {g.badge}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                        {g.category}
                      </span>
                      <h3 className="font-serif font-bold text-stone-900 text-xl mt-0.5">
                        {g.title}
                      </h3>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      {g.description}
                    </p>

                    {/* Features pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {g.features.map((feat, fIdx) => (
                        <span
                          key={fIdx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-600"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveGame(g.id as any)}
                    className="w-full py-3 rounded-2xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-95"
                    style={{ backgroundColor: g.primaryColor }}
                  >
                    <span>Lancer une partie de {g.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. JEU 1: LUDO NUPTIAL */}
      {activeGame === "ludo" && (
        <LudoGameComponent
          p1Name={p1Name}
          p2Name={p2Name}
          coupleId={couple?.id}
          onMatchFinish={handleMatchFinish}
        />
      )}

      {/* 5. JEU 2: AWALÉ IVOIRIEN */}
      {activeGame === "awale" && (
        <AwaleGameComponent
          p1Name={p1Name}
          p2Name={p2Name}
          coupleId={couple?.id}
          onMatchFinish={handleMatchFinish}
        />
      )}

      {/* 6. JEU 3: JEU DE DAMES */}
      {activeGame === "dames" && (
        <CheckersGameComponent
          p1Name={p1Name}
          p2Name={p2Name}
          coupleId={couple?.id}
          onMatchFinish={handleMatchFinish}
        />
      )}

      {/* 7. JEU 4: DÉFI DES MOTS */}
      {activeGame === "mots" && (
        <WordGameComponent
          p1Name={p1Name}
          p2Name={p2Name}
          coupleId={couple?.id}
          onMatchFinish={handleMatchFinish}
        />
      )}
    </div>
  );
}
