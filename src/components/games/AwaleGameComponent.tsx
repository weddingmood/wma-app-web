"use client";

import React, { useState, useEffect } from "react";
import {
  AwaleGameState,
  AwalePlayer,
  AwaleAiLevel,
  createInitialAwaleState,
  getLegalMoves,
  executeAwaleMove,
  computeBestAwaleAiMove,
  getAwalePedagogicalHint,
  AwaleHint,
  isPlayerPit,
  countSeedsOnSide,
} from "@/lib/awale-engine";
import {
  playMoveSound,
  playCaptureSound,
  playVictorySound,
} from "@/lib/game-audio";
import {
  RotateCcw,
  Trophy,
  Users,
  Bot,
  Sparkles,
  HelpCircle,
  X,
  BookOpen,
  History,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  ArrowRight,
  Eye,
} from "lucide-react";

interface Props {
  p1Name?: string;
  p2Name?: string;
  coupleId?: number;
  onMatchFinish?: (winner: string, score1: number, score2: number, mode: string) => void;
}

export function AwaleGameComponent({
  p1Name = "Époux",
  p2Name = "Épouse",
  coupleId,
  onMatchFinish,
}: Props) {
  const [gameMode, setGameMode] = useState<"couple" | "ai" | "local2p">("couple");
  const [aiLevel, setAiLevel] = useState<AwaleAiLevel>("moyen");
  const [pedagogicalMode, setPedagogicalMode] = useState(false);
  const [gameState, setGameState] = useState<AwaleGameState>(() =>
    createInitialAwaleState("couple", "moyen", false)
  );

  // Replay inspection index (-1 = active live game)
  const [replayMoveIndex, setReplayMoveIndex] = useState<number>(-1);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Hover trajectory simulation (PlayAwale feature)
  const [hoveredPit, setHoveredPit] = useState<number | null>(null);

  // Local persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`wm_awale_playawale_${coupleId || "local"}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.pits) setGameState(parsed);
      }
    } catch {
      // ignore
    }
  }, [coupleId]);

  const saveLocalState = (st: AwaleGameState) => {
    try {
      localStorage.setItem(`wm_awale_playawale_${coupleId || "local"}`, JSON.stringify(st));
    } catch {
      // ignore
    }
  };

  const isP1Turn = gameState.turn === "partner1";
  const legalMoves = getLegalMoves(gameState.pits, gameState.turn);
  const hint: AwaleHint | null = pedagogicalMode ? getAwalePedagogicalHint(gameState) : null;

  // Sowing trajectory preview computation
  const getSowingPreview = (pitIdx: number) => {
    const seeds = gameState.pits[pitIdx];
    if (seeds === 0) return { pitsReceiving: [], finalPit: -1, willCapture: false };

    const pitsReceiving: number[] = [];
    let curr = pitIdx;
    for (let s = 0; s < seeds; s++) {
      curr = (curr + 1) % 12;
      if (curr === pitIdx) curr = (curr + 1) % 12; // skip origin
      pitsReceiving.push(curr);
    }

    const opp = isP1Turn ? "partner2" : "partner1";
    const willLandOnOpp = isPlayerPit(opp, curr);
    const finalSeedCount = gameState.pits[curr] + 1;
    const willCapture = willLandOnOpp && (finalSeedCount === 2 || finalSeedCount === 3);

    return {
      pitsReceiving,
      finalPit: curr,
      willCapture,
    };
  };

  const previewTrajectory = hoveredPit !== null && legalMoves.includes(hoveredPit)
    ? getSowingPreview(hoveredPit)
    : null;

  // Handle Pit Click (Sowing seeds)
  const handlePitClick = (pitIndex: number) => {
    if (gameState.status === "finished" || replayMoveIndex !== -1) return;
    if (gameState.gameMode === "ai" && gameState.turn === "partner2") return;
    if (!legalMoves.includes(pitIndex)) return;

    const res = executeAwaleMove(gameState, pitIndex);
    if (!res) return;

    if (res.captured > 0) {
      playCaptureSound();
    } else {
      playMoveSound();
    }

    if (res.nextState.winner) {
      playVictorySound();
      if (onMatchFinish) {
        const winnerKey = res.nextState.winner === "partner1" ? "partner1" : "partner2";
        onMatchFinish(winnerKey, res.nextState.score1, res.nextState.score2, gameMode);
      }
    }

    setGameState(res.nextState);
    saveLocalState(res.nextState);
    setHoveredPit(null);
  };

  // AI Turn handling
  useEffect(() => {
    if (
      gameState.gameMode === "ai" &&
      gameState.turn === "partner2" &&
      gameState.status === "ongoing" &&
      replayMoveIndex === -1 &&
      !isAiThinking
    ) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const bestPit = computeBestAwaleAiMove(gameState, aiLevel);
        if (bestPit !== -1) {
          const res = executeAwaleMove(gameState, bestPit);
          if (res) {
            if (res.captured > 0) playCaptureSound();
            else playMoveSound();

            if (res.nextState.winner) {
              playVictorySound();
              if (onMatchFinish) {
                const winnerKey = res.nextState.winner === "partner1" ? "partner1" : "ai";
                onMatchFinish(winnerKey, res.nextState.score1, res.nextState.score2, "ai");
              }
            }

            setGameState(res.nextState);
            saveLocalState(res.nextState);
          }
        }
        setIsAiThinking(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.status, gameState.gameMode, aiLevel, replayMoveIndex]);

  // Restart
  const handleReset = (newMode = gameMode, newLevel = aiLevel) => {
    setGameMode(newMode);
    setAiLevel(newLevel);
    setReplayMoveIndex(-1);
    const fresh = createInitialAwaleState(newMode, newLevel, pedagogicalMode);
    setGameState(fresh);
    saveLocalState(fresh);
    setHoveredPit(null);
  };

  // Stepping through replay
  const displayedPits =
    replayMoveIndex === -1
      ? gameState.pits
      : gameState.history[replayMoveIndex]?.pitsAfter || gameState.pits;

  const displayedScores =
    replayMoveIndex === -1
      ? { p1: gameState.score1, p2: gameState.score2 }
      : gameState.history[replayMoveIndex]?.scoresAfter || { p1: gameState.score1, p2: gameState.score2 };

  // Render Realistic 3D Seed Beads inside the wooden pit (PlayAwale style)
  const renderSeedBeads = (count: number) => {
    if (count === 0) return null;

    const beadClass = "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-gradient-to-br from-[#8C6D37] via-[#5C3A21] to-[#3D2514] shadow-md border border-[#D4AF37]/40";

    if (count === 1) {
      return (
        <div className="flex items-center justify-center">
          <span className={beadClass}></span>
        </div>
      );
    }
    if (count === 2) {
      return (
        <div className="flex items-center justify-center gap-1">
          <span className={beadClass}></span>
          <span className={beadClass}></span>
        </div>
      );
    }
    if (count === 3) {
      return (
        <div className="flex flex-col items-center justify-center gap-0.5">
          <span className={beadClass}></span>
          <div className="flex gap-1">
            <span className={beadClass}></span>
            <span className={beadClass}></span>
          </div>
        </div>
      );
    }
    if (count === 4) {
      return (
        <div className="grid grid-cols-2 gap-1 place-items-center">
          <span className={beadClass}></span>
          <span className={beadClass}></span>
          <span className={beadClass}></span>
          <span className={beadClass}></span>
        </div>
      );
    }
    if (count === 5) {
      return (
        <div className="flex flex-col items-center justify-center gap-0.5">
          <div className="flex gap-1">
            <span className={beadClass}></span>
            <span className={beadClass}></span>
          </div>
          <span className={beadClass}></span>
          <div className="flex gap-1">
            <span className={beadClass}></span>
            <span className={beadClass}></span>
          </div>
        </div>
      );
    }

    // 6 or more seeds -> cluster of 6 beads + badge
    return (
      <div className="relative flex flex-col items-center justify-center">
        <div className="grid grid-cols-3 gap-0.5 place-items-center opacity-85">
          {Array.from({ length: Math.min(6, count) }).map((_, i) => (
            <span key={i} className={beadClass}></span>
          ))}
        </div>
        <span className="absolute -bottom-2 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#1E1109] text-amber-200 border border-[#D4AF37]">
          {count}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Modes */}
      <div className="p-4 sm:p-5 rounded-3xl glass-panel border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-100 text-[#C05638]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
              Awalé Ivoirien (PlayAwale)
            </h3>
            <span className="text-[11px] text-stone-500">
              Règles ivoiriennes officielles : 12 cases, 48 graines, prise de 2 ou 3 en cascade, affamé et pas de grand chelem
            </span>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleReset("couple")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              gameMode === "couple"
                ? "bg-[#C05638] text-white shadow-xs"
                : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1" />
            <span>Couple</span>
          </button>

          <button
            onClick={() => handleReset("ai")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              gameMode === "ai"
                ? "bg-[#C05638] text-white shadow-xs"
                : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <Bot className="w-3.5 h-3.5 inline mr-1" />
            <span>vs IA</span>
          </button>

          {/* AI Level selector when vs AI */}
          {gameMode === "ai" && (
            <select
              value={aiLevel}
              onChange={(e) => handleReset("ai", e.target.value as AwaleAiLevel)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-xs font-semibold cursor-pointer"
            >
              <option value="debutant">Niveau 1 : Débutant</option>
              <option value="facile">Niveau 2 : Facile</option>
              <option value="moyen">Niveau 3 : Moyen</option>
              <option value="difficile">Niveau 4 : Difficile</option>
              <option value="expert">Niveau 5 : Expert</option>
              <option value="maitre">Niveau 6 : Maître</option>
            </select>
          )}

          {/* Pedagogical Hint mode toggle */}
          <button
            onClick={() => setPedagogicalMode(!pedagogicalMode)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
              pedagogicalMode
                ? "bg-amber-100 text-amber-900 border border-amber-300"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
            title="Activer ou désactiver les conseils pédagogiques"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Conseils</span>
          </button>

          <button
            onClick={() => setShowRulesModal(true)}
            className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 cursor-pointer"
            title="Consulter les règles officielles"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleReset()}
            className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 cursor-pointer"
            title="Nouvelle partie"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Players Scores Header */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-3xl border transition-all flex items-center justify-between ${
            gameState.turn === "partner2"
              ? "bg-white border-2 border-[#B37D28] shadow-md ring-2 ring-amber-400/20"
              : "glass-card-warm border-stone-200 opacity-90"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900">
                {gameMode === "ai" ? "Ordinateur (IA)" : p2Name} (Nord)
              </span>
              {gameState.turn === "partner2" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  {isAiThinking ? "Réflexion..." : "À jouer"}
                </span>
              )}
            </div>
            <div className="font-serif font-black text-2xl text-amber-800 mt-1">
              {displayedScores.p2} <span className="text-xs font-normal text-stone-500">/ 25 capturées</span>
            </div>
          </div>
          <Award className="w-7 h-7 text-amber-600" />
        </div>

        <div
          className={`p-4 rounded-3xl border transition-all flex items-center justify-between ${
            gameState.turn === "partner1"
              ? "bg-white border-2 border-[#C05638] shadow-md ring-2 ring-orange-400/20"
              : "glass-card-warm border-stone-200 opacity-90"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900">
                {p1Name} (Sud)
              </span>
              {gameState.turn === "partner1" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#C05638]">
                  À vous de jouer
                </span>
              )}
            </div>
            <div className="font-serif font-black text-2xl text-[#C05638] mt-1">
              {displayedScores.p1} <span className="text-xs font-normal text-stone-500">/ 25 capturées</span>
            </div>
          </div>
          <Award className="w-7 h-7 text-[#C05638]" />
        </div>
      </div>

      {/* Main Authentic Carved Awale Board (PlayAwale layout) */}
      <div className="p-4 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-md space-y-6">
        
        {/* Replay Stepper Bar */}
        {replayMoveIndex !== -1 && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <span>
              Revue du coup <strong>{replayMoveIndex + 1} / {gameState.history.length}</strong>
            </span>
            <button
              onClick={() => setReplayMoveIndex(-1)}
              className="text-xs font-bold text-[#C05638] underline cursor-pointer"
            >
              Revenir au direct
            </button>
          </div>
        )}

        {/* The Wooden Board Body with Side Granaries (Krou) */}
        <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 justify-center">
          
          {/* Left Granary (Player 2 / North Captured Seeds Tray) */}
          <div className="hidden md:flex flex-col items-center justify-center w-24 h-64 rounded-3xl bg-gradient-to-b from-[#4A2D16] to-[#2E1A0C] border-2 border-[#D4AF37]/50 shadow-xl p-2 text-center">
            <span className="text-[9px] font-bold uppercase text-amber-200 tracking-wider mb-2">
              Grenier {gameMode === "ai" ? "IA" : p2Name}
            </span>
            <div className="w-16 h-40 rounded-2xl bg-[#1E1109] border border-[#D4AF37]/30 flex flex-col items-center justify-center p-1 shadow-inner">
              <span className="font-serif font-black text-2xl text-amber-300">
                {displayedScores.p2}
              </span>
              <span className="text-[8px] text-amber-200/70">graines</span>
            </div>
          </div>

          {/* 12-Pit Wooden Board Body */}
          <div className="w-full max-w-2xl p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-[#5C3A21] via-[#7A4E2D] to-[#5C3A21] border-4 border-[#3D2514] shadow-2xl space-y-4">
            
            {/* North Label */}
            <div className="flex items-center justify-between text-[11px] text-amber-200/90 font-bold uppercase tracking-widest px-2">
              <span>{gameMode === "ai" ? "Camp Ordinateur" : `Camp de ${p2Name}`} (Haut)</span>
              <span className="text-amber-300/80 font-mono">Sens de rotation ?</span>
            </div>

            {/* Row 2: North Pits (P2: 11 down to 6, displayed from Left to Right: 12, 11, 10, 9, 8, 7) */}
            <div className="grid grid-cols-6 gap-2 sm:gap-3.5">
              {[11, 10, 9, 8, 7, 6].map((pitIdx, colIdx) => {
                const seedCount = displayedPits[pitIdx];
                const isPlayable = isP1Turn ? false : legalMoves.includes(pitIdx);
                const isHinted = hint?.recommendedPit === pitIdx;
                const isReceiving = previewTrajectory?.pitsReceiving.includes(pitIdx);
                const isFinalLanding = previewTrajectory?.finalPit === pitIdx;
                const isCaptureLanding = isFinalLanding && previewTrajectory?.willCapture;

                return (
                  <button
                    key={pitIdx}
                    disabled={!isPlayable || replayMoveIndex !== -1}
                    onMouseEnter={() => isPlayable && setHoveredPit(pitIdx)}
                    onMouseLeave={() => setHoveredPit(null)}
                    onClick={() => handlePitClick(pitIdx)}
                    className={`h-24 sm:h-32 rounded-3xl border-2 flex flex-col items-center justify-between p-2 relative transition-all shadow-inner select-none ${
                      isPlayable
                        ? "bg-[#3D2514] border-amber-400 hover:scale-105 hover:bg-[#4E301B] cursor-pointer"
                        : "bg-[#2A180C] border-[#1E1109] opacity-95"
                    } ${isHinted ? "ring-4 ring-amber-300 animate-pulse" : ""} ${
                      isCaptureLanding
                        ? "ring-4 ring-emerald-400 bg-emerald-950/60"
                        : isReceiving
                        ? "border-amber-300"
                        : ""
                    }`}
                  >
                    <div className="w-full flex items-center justify-between text-[9px] text-stone-400 font-mono">
                      <span>{pitIdx + 1}</span>
                      {isCaptureLanding && (
                        <span className="text-emerald-400 font-bold text-[8px] animate-bounce">Prise !</span>
                      )}
                    </div>

                    {/* 3D Round Seed Beads Simulation */}
                    <div className="my-auto">{renderSeedBeads(seedCount)}</div>

                    <span className="text-[10px] font-bold text-amber-200">
                      {seedCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Row 1: South Pits (P1: 0 up to 5, displayed Left to Right: 1, 2, 3, 4, 5, 6) */}
            <div className="grid grid-cols-6 gap-2 sm:gap-3.5 pt-2">
              {[0, 1, 2, 3, 4, 5].map((pitIdx) => {
                const seedCount = displayedPits[pitIdx];
                const isPlayable = isP1Turn ? legalMoves.includes(pitIdx) : false;
                const isHinted = hint?.recommendedPit === pitIdx;
                const isReceiving = previewTrajectory?.pitsReceiving.includes(pitIdx);
                const isFinalLanding = previewTrajectory?.finalPit === pitIdx;
                const isCaptureLanding = isFinalLanding && previewTrajectory?.willCapture;

                return (
                  <button
                    key={pitIdx}
                    disabled={!isPlayable || replayMoveIndex !== -1}
                    onMouseEnter={() => isPlayable && setHoveredPit(pitIdx)}
                    onMouseLeave={() => setHoveredPit(null)}
                    onClick={() => handlePitClick(pitIdx)}
                    className={`h-24 sm:h-32 rounded-3xl border-2 flex flex-col items-center justify-between p-2 relative transition-all shadow-inner select-none ${
                      isPlayable
                        ? "bg-[#3D2514] border-amber-400 hover:scale-105 hover:bg-[#4E301B] cursor-pointer"
                        : "bg-[#2A180C] border-[#1E1109] opacity-95"
                    } ${isHinted ? "ring-4 ring-amber-300 animate-pulse" : ""} ${
                      isCaptureLanding
                        ? "ring-4 ring-emerald-400 bg-emerald-950/60"
                        : isReceiving
                        ? "border-amber-300"
                        : ""
                    }`}
                  >
                    <div className="w-full flex items-center justify-between text-[9px] text-stone-400 font-mono">
                      <span>{pitIdx + 1}</span>
                      {isCaptureLanding && (
                        <span className="text-emerald-400 font-bold text-[8px] animate-bounce">Prise !</span>
                      )}
                    </div>

                    {/* 3D Round Seed Beads Simulation */}
                    <div className="my-auto">{renderSeedBeads(seedCount)}</div>

                    <span className="text-[10px] font-bold text-amber-200">
                      {seedCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* South Label */}
            <div className="flex items-center justify-between text-[11px] text-amber-200/90 font-bold uppercase tracking-widest px-2 pt-1">
              <span>Camp de {p1Name} (Bas)</span>
              <span className="text-amber-300/80 font-mono">Cases 1 à 6</span>
            </div>
          </div>

          {/* Right Granary (Player 1 / South Captured Seeds Tray) */}
          <div className="hidden md:flex flex-col items-center justify-center w-24 h-64 rounded-3xl bg-gradient-to-b from-[#4A2D16] to-[#2E1A0C] border-2 border-[#D4AF37]/50 shadow-xl p-2 text-center">
            <span className="text-[9px] font-bold uppercase text-amber-200 tracking-wider mb-2">
              Grenier {p1Name}
            </span>
            <div className="w-16 h-40 rounded-2xl bg-[#1E1109] border border-[#D4AF37]/30 flex flex-col items-center justify-center p-1 shadow-inner">
              <span className="font-serif font-black text-2xl text-amber-300">
                {displayedScores.p1}
              </span>
              <span className="text-[8px] text-amber-200/70">graines</span>
            </div>
          </div>
        </div>

        {/* Pedagogical Hint Callout */}
        {pedagogicalMode && hint && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Conseil Pédagogique (Case {hint.recommendedPit + 1}) :</strong>
              <p className="mt-0.5 text-stone-700">{hint.reason}</p>
            </div>
          </div>
        )}

        <p className="text-xs text-stone-600 text-center font-medium">
          {gameState.lastMessage}
        </p>

        {/* Replay inspection stepper */}
        {gameState.history.length > 0 && (
          <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-stone-500" />
              <span className="font-bold text-stone-800">
                Revue des coups ({gameState.history.length} coups joués)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={replayMoveIndex <= 0}
                onClick={() => setReplayMoveIndex(Math.max(0, (replayMoveIndex === -1 ? gameState.history.length : replayMoveIndex) - 1))}
                className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
                title="Coup précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={replayMoveIndex === -1 || replayMoveIndex >= gameState.history.length - 1}
                onClick={() => setReplayMoveIndex(replayMoveIndex + 1)}
                className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
                title="Coup suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Règles Officielles de l'Awalé Ivoirien (PlayAwale)
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-stone-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                <strong>1. Disposition :</strong> 12 cases contenant 4 graines chacune (48 graines au total).
              </p>
              <p>
                <strong>2. Semaille :</strong> Prenez toutes les graines d'une de vos cases et égrénez-les une par une dans le sens anti-horaire. Si une case contient 12 graines ou plus, la case de départ est sautée (elle reste vide).
              </p>
              <p>
                <strong>3. Prise :</strong> Si la dernière graine tombe dans le camp adverse et porte le contenu de cette case à 2 ou 3 graines, vous les capturez. Les cases précédentes sont également prises si elles contiennent 2 ou 3 graines.
              </p>
              <p>
                <strong>4. Règle de l'affamé :</strong> Si l'adversaire n'a plus de graines, vous devez obligatoirement jouer un coup qui lui en apporte.
              </p>
              <p>
                <strong>5. Pas de grand chelem :</strong> Si une prise devait capturer toutes les graines du camp adverse, la prise est annulée et les graines restent sur le plateau.
              </p>
              <p>
                <strong>6. Victoire :</strong> Le premier joueur qui atteint 25 graines remporte immédiatement la partie !
              </p>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold cursor-pointer"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

