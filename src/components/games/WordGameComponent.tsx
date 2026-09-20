"use client";

import React, { useState, useEffect } from "react";
import {
  WordGameState,
  BoardCell,
  LetterTile,
  PlacedTile,
  createInitialWordGameState,
  validateAndScoreWordPlacement,
  findComputerWordMove,
  drawTiles,
  LETTER_VALUES,
} from "@/lib/word-engine";
import {
  playTilePlaceSound,
  playWordValidSound,
  playInvalidSound,
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
  Check,
  Send,
  Timer,
  Zap,
  BookOpen,
} from "lucide-react";

interface Props {
  p1Name?: string;
  p2Name?: string;
  coupleId?: number;
  onMatchFinish?: (winner: string, score1: number, score2: number, mode: string) => void;
}

export function WordGameComponent({
  p1Name = "Époux",
  p2Name = "Épouse",
  coupleId,
  onMatchFinish,
}: Props) {
  const [gameMode, setGameMode] = useState<"couple" | "ai" | "daily" | "training">("couple");
  const [gameState, setGameState] = useState<WordGameState>(() =>
    createInitialWordGameState("couple")
  );

  // Placed tiles in current turn before validation
  const [currentTurnPlaced, setCurrentTurnPlaced] = useState<PlacedTile[]>([]);
  const [selectedRackIndex, setSelectedRackIndex] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Anagram Training mode timer
  const [trainingTimer, setTrainingTimer] = useState(60);
  const [trainingActive, setTrainingActive] = useState(false);
  const [trainingWordInput, setTrainingWordInput] = useState("");
  const [trainingScore, setTrainingScore] = useState(0);

  // Persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`wm_word_${coupleId || "local"}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.board) setGameState(parsed);
      }
    } catch {
      // ignore
    }
  }, [coupleId]);

  const saveLocalState = (st: WordGameState) => {
    try {
      localStorage.setItem(`wm_word_${coupleId || "local"}`, JSON.stringify(st));
    } catch {
      // ignore
    }
  };

  const isP1 = gameState.turn === "partner1";
  const activeRack = isP1 ? gameState.rack1 : gameState.rack2;

  // Handle rack tile click
  const handleRackTileClick = (index: number) => {
    setSelectedRackIndex(selectedRackIndex === index ? null : index);
    setValidationError(null);
  };

  // Handle board square click
  const handleSquareClick = (r: number, c: number) => {
    const cell = gameState.board[r][c];

    // 1. If clicking a newly placed tile, retrieve it back to rack!
    const placedIdx = currentTurnPlaced.findIndex((pt) => pt.row === r && pt.col === c);
    if (placedIdx !== -1) {
      const removed = currentTurnPlaced[placedIdx];
      const updated = currentTurnPlaced.filter((_, idx) => idx !== placedIdx);
      setCurrentTurnPlaced(updated);
      playTilePlaceSound();
      return;
    }

    // 2. If tile is selected from rack, place it on empty square!
    if (selectedRackIndex !== null && !cell.letter && !cell.isLocked) {
      const tile = activeRack[selectedRackIndex];
      if (!tile) return;

      const newPlaced: PlacedTile = {
        row: r,
        col: c,
        letter: tile.letter,
        points: tile.points,
        tileId: tile.id,
      };

      setCurrentTurnPlaced([...currentTurnPlaced, newPlaced]);
      setSelectedRackIndex(null);
      setValidationError(null);
      playTilePlaceSound();
    }
  };

  // Submit and validate word
  const handleValidateTurn = () => {
    if (currentTurnPlaced.length === 0) {
      setValidationError("Posez au moins une lettre sur la grille.");
      playInvalidSound();
      return;
    }

    const check = validateAndScoreWordPlacement(gameState.board, currentTurnPlaced);
    if (!check.isValid) {
      setValidationError(check.error || "Mot invalide selon le dictionnaire français.");
      playInvalidSound();
      return;
    }

    // Validation succeeded!
    playWordValidSound();

    // Lock placed tiles on board
    const newBoard = gameState.board.map((row) => row.map((cell) => ({ ...cell })));
    currentTurnPlaced.forEach((pt) => {
      newBoard[pt.row][pt.col].letter = pt.letter;
      newBoard[pt.row][pt.col].points = pt.points;
      newBoard[pt.row][pt.col].isLocked = true;
      newBoard[pt.row][pt.col].player = gameState.turn;
    });

    // Remove used tiles from player rack and draw replacement from bag
    const usedTileIds = new Set(currentTurnPlaced.map((pt) => pt.tileId));
    let currentRack = activeRack.filter((t) => !usedTileIds.has(t.id));

    const drawRes = drawTiles(gameState.bag, currentTurnPlaced.length);
    const replenishedRack = [...currentRack, ...drawRes.drawn];
    const newBag = drawRes.remaining;

    const newScore1 = gameState.score1 + (isP1 ? check.score : 0);
    const newScore2 = gameState.score2 + (!isP1 ? check.score : 0);

    const nextTurn: "partner1" | "partner2" = isP1 ? "partner2" : "partner1";

    const nextState: WordGameState = {
      ...gameState,
      board: newBoard,
      bag: newBag,
      rack1: isP1 ? replenishedRack : gameState.rack1,
      rack2: !isP1 ? replenishedRack : gameState.rack2,
      score1: newScore1,
      score2: newScore2,
      turn: nextTurn,
      history: [
        ...gameState.history,
        {
          turnNumber: gameState.history.length + 1,
          player: gameState.turn,
          word: check.wordsFormed.join(", "),
          score: check.score,
        },
      ],
      lastMessage: `${isP1 ? p1Name : p2Name} a posé '${check.wordsFormed.join(", ")}' et marque ${check.score} points !`,
    };

    setGameState(nextState);
    saveLocalState(nextState);
    setCurrentTurnPlaced([]);
    setSelectedRackIndex(null);
    setValidationError(null);
  };

  // Recall all placed tiles back to rack
  const handleRecallTiles = () => {
    setCurrentTurnPlaced([]);
    setSelectedRackIndex(null);
    setValidationError(null);
  };

  // AI Turn in "vs IA" mode
  useEffect(() => {
    if (
      gameState.gameMode === "ai" &&
      gameState.turn === "partner2" &&
      gameState.status === "ongoing"
    ) {
      const timer = setTimeout(() => {
        const aiMove = findComputerWordMove(gameState.board, gameState.rack2);
        if (aiMove && aiMove.length > 0) {
          const check = validateAndScoreWordPlacement(gameState.board, aiMove);
          if (check.isValid) {
            playWordValidSound();

            const newBoard = gameState.board.map((row) => row.map((cell) => ({ ...cell })));
            aiMove.forEach((pt) => {
              newBoard[pt.row][pt.col].letter = pt.letter;
              newBoard[pt.row][pt.col].points = pt.points;
              newBoard[pt.row][pt.col].isLocked = true;
              newBoard[pt.row][pt.col].player = "partner2";
            });

            const usedIds = new Set(aiMove.map((pt) => pt.tileId));
            const remainingRack = gameState.rack2.filter((t) => !usedIds.has(t.id));
            const drawRes = drawTiles(gameState.bag, aiMove.length);

            const nextState: WordGameState = {
              ...gameState,
              board: newBoard,
              bag: drawRes.remaining,
              rack2: [...remainingRack, ...drawRes.drawn],
              score2: gameState.score2 + check.score,
              turn: "partner1",
              history: [
                ...gameState.history,
                {
                  turnNumber: gameState.history.length + 1,
                  player: "partner2",
                  word: check.wordsFormed.join(", "),
                  score: check.score,
                },
              ],
              lastMessage: `L'ordinateur a posé '${check.wordsFormed.join(", ")}' (+${check.score} pts).`,
            };
            setGameState(nextState);
            saveLocalState(nextState);
          }
        } else {
          // AI passes turn
          setGameState((prev) => ({
            ...prev,
            turn: "partner1",
            lastMessage: "L'ordinateur n'a pas trouvé de combinaison et passe son tour.",
          }));
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.gameMode]);

  // Restart
  const handleReset = (newMode = gameMode) => {
    setGameMode(newMode);
    setCurrentTurnPlaced([]);
    setSelectedRackIndex(null);
    setValidationError(null);
    const fresh = createInitialWordGameState(newMode);
    setGameState(fresh);
    saveLocalState(fresh);
  };

  const getCellLabel = (mult: string) => {
    switch (mult) {
      case "center":
        return "?";
      case "tm":
        return "TM";
      case "dm":
        return "DM";
      case "tl":
        return "TL";
      case "dl":
        return "DL";
      default:
        return "";
    }
  };

  const getCellBg = (mult: string) => {
    switch (mult) {
      case "center":
        return "bg-amber-100 text-[#B37D28] font-bold";
      case "tm":
        return "bg-red-100 text-red-700 font-bold";
      case "dm":
        return "bg-orange-100 text-[#C05638] font-bold";
      case "tl":
        return "bg-blue-100 text-blue-700 font-bold";
      case "dl":
        return "bg-teal-100 text-teal-800 font-bold";
      default:
        return "bg-white/80 text-stone-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Game Bar & Mode Switcher */}
      <div className="p-4 sm:p-5 rounded-3xl glass-panel border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-100 text-[#C05638]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
              Défi des Mots
            </h3>
            <span className="text-[11px] text-stone-500">
              Grille 11x11, multiplicateurs Scrabble, dictionnaire français complet et tirage de 7 lettres
            </span>
          </div>
        </div>

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

          <button
            onClick={() => setShowRulesModal(true)}
            className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 cursor-pointer"
            title="Consulter les règles des Mots"
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

      {/* Scores Header */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-3xl border transition-all flex items-center justify-between ${
            gameState.turn === "partner2"
              ? "bg-white border-2 border-[#D4AF37] shadow-md ring-2 ring-amber-400/20"
              : "glass-card-warm border-stone-200 opacity-90"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900">
                {gameMode === "ai" ? "Ordinateur" : p2Name}
              </span>
              {gameState.turn === "partner2" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  À son tour
                </span>
              )}
            </div>
            <div className="font-serif font-black text-2xl text-amber-800 mt-1">
              {gameState.score2} <span className="text-xs font-normal text-stone-500">points</span>
            </div>
          </div>
          <Sparkles className="w-6 h-6 text-[#D4AF37]" />
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
                {p1Name}
              </span>
              {gameState.turn === "partner1" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#C05638]">
                  À votre tour
                </span>
              )}
            </div>
            <div className="font-serif font-black text-2xl text-[#C05638] mt-1">
              {gameState.score1} <span className="text-xs font-normal text-stone-500">points</span>
            </div>
          </div>
          <Sparkles className="w-6 h-6 text-[#C05638]" />
        </div>
      </div>

      {/* Main 11x11 Scrabble Board & Rack */}
      <div className="p-4 sm:p-6 rounded-3xl glass-panel border border-stone-200 shadow-md flex flex-col items-center space-y-4">
        {/* 11x11 Grid Board */}
        <div className="relative w-full max-w-[460px] aspect-square rounded-3xl border-4 border-stone-800 shadow-2xl overflow-hidden bg-[#FAF6EE] p-1.5">
          <div
            className="w-full h-full grid gap-0.5 bg-stone-300 rounded-2xl overflow-hidden p-0.5"
            style={{
              gridTemplateColumns: "repeat(11, minmax(0, 1fr))",
              gridTemplateRows: "repeat(11, minmax(0, 1fr))",
            }}
          >
            {gameState.board.map((row, r) =>
              row.map((cell, c) => {
                const placed = currentTurnPlaced.find((pt) => pt.row === r && pt.col === c);
                const hasLetter = cell.letter || placed?.letter;
                const letterChar = cell.letter || placed?.letter;
                const points = cell.points || placed?.points;
                const isTemp = !!placed;

                return (
                  <div
                    key={`${r}_${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className={`relative w-full h-full flex flex-col items-center justify-center rounded-sm transition-all cursor-pointer select-none ${
                      hasLetter
                        ? isTemp
                          ? "bg-amber-100 border border-amber-400 shadow-xs ring-2 ring-amber-400 z-20 animate-pulse"
                          : "bg-white border border-stone-200 shadow-xs"
                        : getCellBg(cell.multiplier)
                    }`}
                  >
                    {hasLetter ? (
                      <>
                        <span className="font-bold text-xs sm:text-sm text-stone-900 leading-none">
                          {letterChar}
                        </span>
                        <span className="text-[7px] text-stone-500 font-mono leading-none mt-0.5">
                          {points}
                        </span>
                      </>
                    ) : (
                      <span className="text-[8px] sm:text-[9px] font-mono leading-none">
                        {getCellLabel(cell.multiplier)}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-2.5 px-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium animate-in fade-in">
            {validationError}
          </div>
        )}

        {/* Player Rack with 7 Tiles */}
        <div className="w-full max-w-md p-4 rounded-3xl bg-[#FAF6EE] border-2 border-[#D4AF37]/50 shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-bold">
              Chevalet de {isP1 ? p1Name : p2Name} ({activeRack.length} lettres) :
            </span>
            <span className="text-[11px] text-stone-500">
              Sac : <strong>{gameState.bag.length}</strong> restantes
            </span>
          </div>

          <div className="flex justify-center gap-2">
            {activeRack.map((tile, idx) => {
              const isSelected = selectedRackIndex === idx;
              const isUsedThisTurn = currentTurnPlaced.some((pt) => pt.tileId === tile.id);

              if (isUsedThisTurn) return null;

              return (
                <button
                  key={tile.id}
                  onClick={() => handleRackTileClick(idx)}
                  className={`w-10 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? "bg-amber-200 border-[#C05638] -translate-y-2 ring-4 ring-amber-300"
                      : "bg-white border-stone-300 hover:-translate-y-1 hover:border-amber-400"
                  }`}
                >
                  <span className="font-bold text-base text-stone-900 leading-none">
                    {tile.letter}
                  </span>
                  <span className="text-[8px] text-stone-500 font-mono mt-0.5">
                    {tile.points}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200">
            <button
              onClick={handleRecallTiles}
              disabled={currentTurnPlaced.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              Rappeler les lettres
            </button>

            <button
              onClick={handleValidateTurn}
              disabled={currentTurnPlaced.length === 0}
              className="px-5 py-2 rounded-xl bg-[#C05638] hover:bg-[#A84429] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Valider le mot</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-stone-600 text-center font-medium">
          {gameState.lastMessage}
        </p>
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Règles du Défi des Mots
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
                <strong>1. Connexion des mots :</strong> Tout nouveau mot posé sur la grille doit être connecté horizontalement ou verticalement à une lettre déjà présente.
              </p>
              <p>
                <strong>2. Dictionnaire français :</strong> Tous les mots formés sont validés instantanément selon le dictionnaire de référence français.
              </p>
              <p>
                <strong>3. Cases multiplicatrices :</strong>
                <br />• <strong>DL :</strong> Lettre compte double
                <br />• <strong>TL :</strong> Lettre compte triple
                <br />• <strong>DM :</strong> Mot compte double
                <br />• <strong>TM :</strong> Mot compte triple
              </p>
              <p>
                <strong>4. Bonus 7 lettres :</strong> Poser les 7 lettres de votre chevalet en un seul coup accorde un bonus de <strong>30 points</strong>.
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

