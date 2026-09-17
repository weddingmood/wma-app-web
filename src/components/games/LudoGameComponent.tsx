"use client";

import React, { useState, useEffect } from "react";
import {
  LudoGameState,
  LudoColor,
  createInitialLudoGame,
  getMovableTokens,
  executeLudoTokenMove,
  pickBestLudoAiToken,
  START_TRACK_POS,
  SAFE_SQUARES,
  HOME_ENTRANCE_POS,
  TRACK_COORDINATES,
  HOME_STRETCH_COORDINATES,
  YARD_SLOTS,
} from "@/lib/ludo-engine";
import {
  playDiceRollSound,
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
  MessageSquare,
  Shield,
  Star,
  ArrowRight,
  Flame,
} from "lucide-react";

interface Props {
  p1Name?: string;
  p2Name?: string;
  coupleId?: number;
  onMatchFinish?: (winner: string, score1: number, score2: number, mode: string) => void;
}

export function LudoGameComponent({
  p1Name = "David",
  p2Name = "Ruth",
  coupleId,
  onMatchFinish,
}: Props) {
  const [gameMode, setGameMode] = useState<"couple" | "ai" | "4p">("couple");
  const [gameState, setGameState] = useState<LudoGameState>(() =>
    createInitialLudoGame("couple", p1Name, p2Name)
  );
  const [isRolling, setIsRolling] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [quickReaction, setQuickReaction] = useState<string | null>(null);

  // Sync state with local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`wm_ludo_king_${coupleId || "local"}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.players) setGameState(parsed);
      }
    } catch {
      // ignore
    }
  }, [coupleId]);

  const saveLocalState = (st: LudoGameState) => {
    try {
      localStorage.setItem(`wm_ludo_king_${coupleId || "local"}`, JSON.stringify(st));
    } catch {
      // ignore
    }
  };

  const activePlayer = gameState.players[gameState.activePlayerIndex];

  // Roll dice action following official Ludo King rules
  const handleRollDice = () => {
    if (!gameState.canRoll || isRolling || gameState.status === "finished") return;

    setIsRolling(true);
    playDiceRollSound();

    let rollCount = 0;
    const interval = setInterval(() => {
      rollCount++;
      if (rollCount >= 7) {
        clearInterval(interval);
        const rolled = Math.floor(Math.random() * 6) + 1;
        setIsRolling(false);

        // Consecutive 6s rule in Ludo King:
        let newConsecutiveSixes = rolled === 6 ? gameState.consecutiveSixes + 1 : 0;

        if (newConsecutiveSixes >= 3) {
          // 3 consecutive 6s forfeits the turn!
          const nextIdx = (gameState.activePlayerIndex + 1) % gameState.players.length;
          const updatedState: LudoGameState = {
            ...gameState,
            diceValue: rolled,
            diceRolled: true,
            consecutiveSixes: 0,
            canRoll: true,
            movableTokenIds: [],
            activePlayerIndex: nextIdx,
            lastMessage: `3 six consécutifs ! Règle Ludo King : ${activePlayer.name} passe son tour. Au tour de ${gameState.players[nextIdx].name}.`,
          };
          setGameState(updatedState);
          saveLocalState(updatedState);
          return;
        }

        const movable = getMovableTokens(activePlayer, rolled);

        if (movable.length === 0) {
          // No tokens can move
          const nextIdx = (gameState.activePlayerIndex + 1) % gameState.players.length;
          const updatedState: LudoGameState = {
            ...gameState,
            diceValue: rolled,
            diceRolled: true,
            consecutiveSixes: newConsecutiveSixes,
            canRoll: true,
            movableTokenIds: [],
            activePlayerIndex: nextIdx,
            lastMessage: `${activePlayer.name} a obtenu un ${rolled}. Aucun pion ne peut bouger. Au tour de ${gameState.players[nextIdx].name}.`,
          };
          setGameState(updatedState);
          saveLocalState(updatedState);
        } else if (movable.length === 1 && !activePlayer.isAi) {
          // Single movable token -> auto-move for fluid play
          const updatedState: LudoGameState = {
            ...gameState,
            diceValue: rolled,
            diceRolled: true,
            consecutiveSixes: newConsecutiveSixes,
            canRoll: false,
            movableTokenIds: movable,
          };
          setGameState(updatedState);
          setTimeout(() => {
            handleMoveToken(movable[0], rolled, updatedState);
          }, 300);
        } else {
          // Multiple choices available: prompt player
          const updatedState: LudoGameState = {
            ...gameState,
            diceValue: rolled,
            diceRolled: true,
            consecutiveSixes: newConsecutiveSixes,
            canRoll: false,
            movableTokenIds: movable,
            lastMessage: `${activePlayer.name} a obtenu un ${rolled} ! Cliquez sur le pion clignotant à déplacer.`,
          };
          setGameState(updatedState);
          saveLocalState(updatedState);
        }
      }
    }, 60);
  };

  // Move token
  const handleMoveToken = (
    tokenId: number,
    forcedDice?: number,
    stateToUse: LudoGameState = gameState
  ) => {
    const dice = forcedDice || stateToUse.diceValue;
    if (!dice) return;

    const result = executeLudoTokenMove(stateToUse, tokenId);

    if (result.capturedToken) {
      playCaptureSound();
    } else {
      playMoveSound();
    }

    if (result.nextState.winner) {
      playVictorySound();
      if (onMatchFinish) {
        const winnerKey = result.nextState.winner === "terracotta" ? "partner1" : "partner2";
        onMatchFinish(winnerKey, 4, result.nextState.players[1].tokensAtGoal, gameMode);
      }
    }

    setGameState(result.nextState);
    saveLocalState(result.nextState);
  };

  // AI Turn Handling
  useEffect(() => {
    if (
      activePlayer.isAi &&
      gameState.status === "ongoing" &&
      !isRolling
    ) {
      if (gameState.canRoll && !gameState.diceRolled) {
        const timer = setTimeout(() => {
          handleRollDice();
        }, 750);
        return () => clearTimeout(timer);
      } else if (gameState.diceRolled && gameState.movableTokenIds.length > 0) {
        const bestToken = pickBestLudoAiToken(gameState, gameState.movableTokenIds);
        const timer = setTimeout(() => {
          handleMoveToken(bestToken, gameState.diceValue || 1, gameState);
        }, 650);
        return () => clearTimeout(timer);
      }
    }
  }, [activePlayer, gameState.canRoll, gameState.diceRolled, isRolling]);

  // Restart / Reset Game
  const handleReset = (newMode: "couple" | "ai" | "4p" = gameMode) => {
    setGameMode(newMode);
    const fresh = createInitialLudoGame(newMode, p1Name, p2Name);
    setGameState(fresh);
    saveLocalState(fresh);
  };

  const sendReaction = (text: string) => {
    setQuickReaction(text);
    setTimeout(() => setQuickReaction(null), 3000);
  };

  const getColorHex = (c: LudoColor) => {
    switch (c) {
      case "terracotta":
        return "#C05638";
      case "gold":
        return "#D4AF37";
      case "emerald":
        return "#145A32";
      case "ivory":
        return "#2563EB";
    }
  };

  // Build mapping of tokens on board coordinates (15x15)
  // key: "row_col" -> array of tokens currently on that square
  const tokensOnSquare = new Map<string, { token: any; player: any }[]>();

  gameState.players.forEach((p) => {
    p.tokens.forEach((t) => {
      let key = "";
      if (t.state === "yard") {
        const [yr, yc] = YARD_SLOTS[t.color][t.id];
        key = `${yr}_${yc}`;
      } else if (t.state === "track") {
        const [tr, tc] = TRACK_COORDINATES[t.trackPos];
        key = `${tr}_${tc}`;
      } else if (t.state === "home_stretch") {
        const [hr, hc] = HOME_STRETCH_COORDINATES[t.color][t.homeStep - 1];
        key = `${hr}_${hc}`;
      } else if (t.state === "goal") {
        // Goal area
        key = `goal_${t.color}`;
      }

      if (key) {
        const list = tokensOnSquare.get(key) || [];
        list.push({ token: t, player: p });
        tokensOnSquare.set(key, list);
      }
    });
  });

  // Render 3D Pip Dice Faces (1 to 6 dots)
  const renderDiceFace = (val: number | null) => {
    if (!val) {
      return <Sparkles className="w-8 h-8 text-[#D4AF37] animate-pulse" />;
    }

    const pipClass = "w-3 h-3 rounded-full bg-stone-900 shadow-inner";
    switch (val) {
      case 1:
        return (
          <div className="flex items-center justify-center w-full h-full">
            <span className={pipClass} style={{ backgroundColor: getColorHex(activePlayer.color) }}></span>
          </div>
        );
      case 2:
        return (
          <div className="flex justify-between w-full h-full p-3.5">
            <span className={pipClass}></span>
            <span className={`${pipClass} self-end`}></span>
          </div>
        );
      case 3:
        return (
          <div className="flex justify-between w-full h-full p-3">
            <span className={pipClass}></span>
            <span className={`${pipClass} self-center`}></span>
            <span className={`${pipClass} self-end`}></span>
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 place-content-between w-full h-full p-3">
            <span className={pipClass}></span>
            <span className={`${pipClass} justify-self-end`}></span>
            <span className={`${pipClass} self-end`}></span>
            <span className={`${pipClass} self-end justify-self-end`}></span>
          </div>
        );
      case 5:
        return (
          <div className="grid grid-cols-3 place-items-center w-full h-full p-2.5">
            <span className={pipClass}></span>
            <span></span>
            <span className={pipClass}></span>
            <span></span>
            <span className={pipClass} style={{ backgroundColor: getColorHex(activePlayer.color) }}></span>
            <span></span>
            <span className={pipClass}></span>
            <span></span>
            <span className={pipClass}></span>
          </div>
        );
      case 6:
      default:
        return (
          <div className="grid grid-cols-2 place-content-between w-full h-full p-2.5">
            <span className={pipClass}></span>
            <span className={`${pipClass} justify-self-end`}></span>
            <span className={`${pipClass} self-center`}></span>
            <span className={`${pipClass} self-center justify-self-end`}></span>
            <span className={`${pipClass} self-end`}></span>
            <span className={`${pipClass} self-end justify-self-end`}></span>
          </div>
        );
    }
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
              Ludo King • Célébration Nuptiale
            </h3>
            <span className="text-[11px] text-stone-500">
              Véritable plateau 15x15 en croix, 52 cases réelles, étoiles sécurisées et sortie sur un 6
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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
          <button
            onClick={() => handleReset("4p")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              gameMode === "4p"
                ? "bg-[#C05638] text-white shadow-xs"
                : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <span>4 Joueurs</span>
          </button>

          <button
            onClick={() => setShowRulesModal(true)}
            className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 cursor-pointer"
            title="Consulter les règles Ludo King"
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

      {/* Players Header & Turn Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {gameState.players.map((p, idx) => {
          const isTurn = idx === gameState.activePlayerIndex;
          const colorHex = getColorHex(p.color);
          return (
            <div
              key={p.color}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                isTurn
                  ? "bg-white border-2 shadow-md ring-2 ring-stone-900/10"
                  : "glass-card-warm border-stone-200 opacity-85"
              }`}
              style={isTurn ? { borderColor: colorHex } : {}}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colorHex }}
                  ></span>
                  <span>{p.name}</span>
                </span>
                {isTurn && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-900 text-white animate-pulse">
                    À vous
                  </span>
                )}
              </div>
              <div className="text-[11px] text-stone-600 flex justify-between items-center mt-1">
                <span>Pions à l'autel :</span>
                <strong className="text-stone-900 font-bold">{p.tokensAtGoal} / 4</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main 15x15 Real Ludo King Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 p-3 sm:p-6 rounded-3xl glass-panel border border-stone-200 shadow-md flex flex-col items-center">
          
          {/* THE REAL 15x15 LUDO BOARD GRID */}
          <div className="relative w-full max-w-[500px] aspect-square rounded-3xl border-4 border-stone-800 shadow-2xl overflow-hidden bg-white select-none p-1">
            <div
              className="w-full h-full grid gap-px bg-stone-300 rounded-2xl overflow-hidden border border-stone-400"
              style={{
                gridTemplateColumns: "repeat(15, minmax(0, 1fr))",
                gridTemplateRows: "repeat(15, minmax(0, 1fr))",
              }}
            >
              {Array.from({ length: 15 }).map((_, r) =>
                Array.from({ length: 15 }).map((_, c) => {
                  const key = `${r}_${c}`;
                  const tokensHere = tokensOnSquare.get(key) || [];

                  // Check if cell is within Yards (Bases)
                  const isRedYard = r < 6 && c < 6;
                  const isGreenYard = r < 6 && c > 8;
                  const isYellowYard = r > 8 && c > 8;
                  const isBlueYard = r > 8 && c < 6;

                  // Check if cell is within Center (3x3 area: rows 6..8, cols 6..8)
                  const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;

                  // Check track index
                  const trackIdx = TRACK_COORDINATES.findIndex(([tr, tc]) => tr === r && tc === c);
                  const isTrackCell = trackIdx !== -1;
                  const isSafeStar = isTrackCell && SAFE_SQUARES.includes(trackIdx);

                  // Check home columns
                  const isRedHome = r === 7 && c >= 1 && c <= 5;
                  const isGreenHome = c === 7 && r >= 1 && r <= 5;
                  const isYellowHome = r === 7 && c >= 9 && c <= 13;
                  const isBlueHome = c === 7 && r >= 9 && r <= 13;

                  // Determine background color
                  let cellBg = "bg-white";
                  if (isRedYard) cellBg = "bg-[#FCF4EE]";
                  else if (isGreenYard) cellBg = "bg-[#EAF5EE]";
                  else if (isYellowYard) cellBg = "bg-[#FFFDF0]";
                  else if (isBlueYard) cellBg = "bg-[#EEF4FC]";
                  else if (isCenter) cellBg = "bg-[#FAF6EE]";
                  else if (isRedHome || (r === 6 && c === 1)) cellBg = "bg-[#C05638]/20";
                  else if (isGreenHome || (r === 1 && c === 8)) cellBg = "bg-[#145A32]/20";
                  else if (isYellowHome || (r === 8 && c === 13)) cellBg = "bg-[#D4AF37]/30";
                  else if (isBlueHome || (r === 13 && c === 6)) cellBg = "bg-blue-100";

                  return (
                    <div
                      key={key}
                      className={`relative w-full h-full flex items-center justify-center ${cellBg}`}
                    >
                      {/* Star icon for safe squares */}
                      {isSafeStar && (
                        <Star className="w-3 h-3 text-[#D4AF37] fill-current opacity-75 pointer-events-none z-0" />
                      )}

                      {/* Center Home Triangle Graphic */}
                      {r === 7 && c === 7 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-0.5">
                          <Sparkles className="w-4 h-4 text-[#C05638] animate-pulse" />
                          <span className="text-[7px] font-serif font-black uppercase text-amber-800 leading-tight">
                            Autel
                          </span>
                        </div>
                      )}

                      {/* Tokens on this square */}
                      {tokensHere.length > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center p-0.5 z-20">
                          {tokensHere.map(({ token, player }) => {
                            const isClickable =
                              gameState.movableTokenIds.includes(token.id) &&
                              player.color === activePlayer.color;

                            return (
                              <button
                                key={`${token.color}_${token.id}`}
                                onClick={() => handleMoveToken(token.id)}
                                disabled={!isClickable}
                                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white shadow-md flex items-center justify-center text-white font-bold text-[9px] transition-transform ${
                                  isClickable
                                    ? "ring-2 sm:ring-4 ring-amber-400 scale-125 animate-bounce z-30 cursor-pointer"
                                    : "z-10"
                                }`}
                                style={{ backgroundColor: getColorHex(token.color) }}
                                title={`${player.name} - Pion ${token.id + 1}`}
                              >
                                {token.id + 1}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Yard Corner Inner Cards */}
            {/* Top-Left Red Yard Base */}
            <div className="absolute top-2 left-2 w-[38%] h-[38%] rounded-2xl bg-white border-2 border-[#C05638]/40 shadow-sm p-3 grid grid-cols-2 gap-2 place-items-center pointer-events-none">
              <span className="absolute top-1 left-2 text-[8px] font-bold text-[#C05638] uppercase">
                {p1Name} (Terracotta)
              </span>
            </div>

            {/* Bottom-Right Yellow Yard Base */}
            <div className="absolute bottom-2 right-2 w-[38%] h-[38%] rounded-2xl bg-white border-2 border-[#D4AF37]/50 shadow-sm p-3 grid grid-cols-2 gap-2 place-items-center pointer-events-none">
              <span className="absolute bottom-1 right-2 text-[8px] font-bold text-amber-800 uppercase">
                {p2Name} (Or)
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-600 text-center font-medium mt-4">
            {gameState.lastMessage}
          </p>
        </div>

        {/* CONTROLS PANE: 3D PIP DICE ROLLER & QUICK CHAT */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Animated 3D Pip Dice Box */}
          <div className="p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm text-center space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block">
              Lancer de Dé (Ludo King)
            </span>

            {/* Realistic 3D Pip Dice */}
            <div className="flex justify-center">
              <button
                onClick={handleRollDice}
                disabled={!gameState.canRoll || isRolling || gameState.status === "finished" || activePlayer.isAi}
                className={`w-24 h-24 rounded-3xl border-2 border-stone-300 shadow-xl flex items-center justify-center transition-all cursor-pointer ${
                  isRolling
                    ? "animate-spin bg-amber-50"
                    : gameState.canRoll && !activePlayer.isAi
                    ? "bg-gradient-to-br from-white to-[#FAF6EE] hover:scale-105 ring-4 ring-amber-300/80"
                    : "bg-white/80 opacity-90"
                }`}
                title="Cliquez pour lancer le dé"
              >
                {renderDiceFace(gameState.diceValue)}
              </button>
            </div>

            <button
              onClick={handleRollDice}
              disabled={!gameState.canRoll || isRolling || gameState.status === "finished" || activePlayer.isAi}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: getColorHex(activePlayer.color) }}
            >
              {isRolling
                ? "Lancement en cours..."
                : gameState.canRoll
                ? `Lancer le Dé (${activePlayer.name})`
                : "Sélectionnez un pion clignotant"}
            </button>

            {gameState.consecutiveSixes > 0 && (
              <div className="text-[11px] text-amber-800 font-bold">
                Six consécutifs : {gameState.consecutiveSixes} / 3 (À 3, tour annulé)
              </div>
            )}
          </div>

          {/* Quick Chat / Reactions */}
          <div className="p-5 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <MessageSquare className="w-4 h-4 text-[#C05638]" />
              <span>Réactions du Couple</span>
            </div>

            {quickReaction && (
              <div className="p-2.5 rounded-xl bg-orange-50 text-[#C05638] text-xs font-serif italic text-center animate-in fade-in">
                « {quickReaction} »
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {[
                "Bien joué !",
                "À toi de briller !",
                "Pas de pitié !",
                "Revanche demandée !",
              ].map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => sendReaction(msg)}
                  className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-left transition-colors cursor-pointer"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Règles Officielles de Ludo King
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
                <strong>1. Sortie de base sur un 6 :</strong> Obtenez un <strong>6</strong> au dé pour faire sortir un pion de votre camp vers votre case de départ.
              </p>
              <p>
                <strong>2. Relance sur un 6 :</strong> Tout 6 obtenu accorde immédiatement un nouveau lancer de dé. Si vous obtenez <strong>3 six consécutifs</strong>, votre tour est automatiquement annulé et passe au joueur suivant.
              </p>
              <p>
                <strong>3. Capture d'un pion :</strong> Si votre pion atterrit sur la même case qu'un pion adverse (hors cases étoiles sécurisées), le pion adverse est renvoyé à sa base et vous gagnez un lancer bonus.
              </p>
              <p>
                <strong>4. Cases étoiles sécurisées :</strong> Les 8 cases marquées d'une étoile protègent les pions contre toute capture.
              </p>
              <p>
                <strong>5. Victoire à l'Autel :</strong> Le premier joueur qui conduit ses 4 pions au centre de l'autel remporte la victoire !
              </p>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold cursor-pointer"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
