"use client";

import React, { useState, useEffect } from "react";
import {
  CheckersGameState,
  CheckersPiece,
  CheckersMove,
  CheckersAiLevel,
  createInitialCheckersState,
  getAllLegalMoves,
  getPieceMoves,
  executeCheckersMove,
  computeBestCheckersAiMove,
} from "@/lib/checkers-engine";
import {
  playMoveSound,
  playCaptureSound,
  playCrownSound,
  playVictorySound,
} from "@/lib/game-audio";
import {
  RotateCcw,
  Trophy,
  Users,
  Bot,
  Crown,
  HelpCircle,
  X,
  History,
  ShieldCheck,
} from "lucide-react";

interface Props {
  p1Name?: string;
  p2Name?: string;
  coupleId?: number;
  onMatchFinish?: (winner: string, score1: number, score2: number, mode: string) => void;
}

export function CheckersGameComponent({
  p1Name = "Époux",
  p2Name = "Épouse",
  coupleId,
  onMatchFinish,
}: Props) {
  const [gameMode, setGameMode] = useState<"couple" | "ai" | "local2p">("couple");
  const [aiLevel, setAiLevel] = useState<CheckersAiLevel>("moyen");
  const [gameState, setGameState] = useState<CheckersGameState>(() =>
    createInitialCheckersState("couple", "moyen")
  );
  const [selectedPiece, setSelectedPiece] = useState<CheckersPiece | null>(null);
  const [legalMovesForSelected, setLegalMovesForSelected] = useState<CheckersMove[]>([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`wm_checkers_${coupleId || "local"}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.board) setGameState(parsed);
      }
    } catch {
      // ignore
    }
  }, [coupleId]);

  const saveLocalState = (st: CheckersGameState) => {
    try {
      localStorage.setItem(`wm_checkers_${coupleId || "local"}`, JSON.stringify(st));
    } catch {
      // ignore
    }
  };

  const allLegalMoves = getAllLegalMoves(gameState.board, gameState.turn);

  // Click on piece
  const handlePieceClick = (piece: CheckersPiece) => {
    if (gameState.status === "finished") return;
    if (gameState.gameMode === "ai" && gameState.turn === "partner2") return;
    if (piece.player !== gameState.turn) return;

    // Filter piece moves that are part of legal moves (enforces mandatory captures!)
    const validMoves = allLegalMoves.filter(
      (m) => m.fromRow === piece.row && m.fromCol === piece.col
    );

    setSelectedPiece(piece);
    setLegalMovesForSelected(validMoves);
  };

  // Click on square
  const handleSquareClick = (r: number, c: number) => {
    if (!selectedPiece) return;

    const move = legalMovesForSelected.find((m) => m.toRow === r && m.toCol === c);
    if (!move) {
      // Check if clicking another of own pieces
      const otherPiece = gameState.board[r][c];
      if (otherPiece && otherPiece.player === gameState.turn) {
        handlePieceClick(otherPiece);
      } else {
        setSelectedPiece(null);
        setLegalMovesForSelected([]);
      }
      return;
    }

    const nextState = executeCheckersMove(gameState, move);

    if (move.isPromotion) {
      playCrownSound();
    } else if (move.captured && move.captured.length > 0) {
      playCaptureSound();
    } else {
      playMoveSound();
    }

    if (nextState.winner) {
      playVictorySound();
      if (onMatchFinish) {
        const winnerKey = nextState.winner === "partner1" ? "partner1" : "partner2";
        onMatchFinish(winnerKey, nextState.piecesCount.partner1, nextState.piecesCount.partner2, gameMode);
      }
    }

    setGameState(nextState);
    saveLocalState(nextState);
    setSelectedPiece(null);
    setLegalMovesForSelected([]);
  };

  // AI Turn
  useEffect(() => {
    if (
      gameState.gameMode === "ai" &&
      gameState.turn === "partner2" &&
      gameState.status === "ongoing" &&
      !isAiThinking
    ) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiMove = computeBestCheckersAiMove(gameState, aiLevel);
        if (aiMove) {
          const nextState = executeCheckersMove(gameState, aiMove);

          if (aiMove.isPromotion) {
            playCrownSound();
          } else if (aiMove.captured && aiMove.captured.length > 0) {
            playCaptureSound();
          } else {
            playMoveSound();
          }

          if (nextState.winner) {
            playVictorySound();
            if (onMatchFinish) {
              const winnerKey = nextState.winner === "partner1" ? "partner1" : "ai";
              onMatchFinish(winnerKey, nextState.piecesCount.partner1, nextState.piecesCount.partner2, "ai");
            }
          }

          setGameState(nextState);
          saveLocalState(nextState);
        }
        setIsAiThinking(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.status, gameState.gameMode, aiLevel]);

  // Restart
  const handleReset = (newMode = gameMode, newLevel = aiLevel) => {
    setGameMode(newMode);
    setAiLevel(newLevel);
    setSelectedPiece(null);
    setLegalMovesForSelected([]);
    const fresh = createInitialCheckersState(newMode, newLevel);
    setGameState(fresh);
    saveLocalState(fresh);
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
              Jeu de Dames
            </h3>
            <span className="text-[11px] text-stone-500">
              Plateau 8x8, prises diagonales obligatoires et promotion en Dame
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

          {gameMode === "ai" && (
            <select
              value={aiLevel}
              onChange={(e) => handleReset("ai", e.target.value as CheckersAiLevel)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-xs font-semibold cursor-pointer"
            >
              <option value="debutant">Débutant</option>
              <option value="facile">Facile</option>
              <option value="moyen">Moyen</option>
              <option value="difficile">Difficile</option>
              <option value="expert">Expert</option>
            </select>
          )}

          <button
            onClick={() => setShowRulesModal(true)}
            className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 cursor-pointer"
            title="Consulter les règles des Dames"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleReset()}
            className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 cursor-pointer"
            title="Recommencer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Players Header */}
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
                {gameMode === "ai" ? "Ordinateur" : p2Name} (Doré)
              </span>
              {gameState.turn === "partner2" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  {isAiThinking ? "Réflexion..." : "À jouer"}
                </span>
              )}
            </div>
            <div className="text-xs text-stone-600 mt-1">
              Pièces : <strong className="text-stone-900 font-bold">{gameState.piecesCount.partner2}</strong> | Dames : <strong className="text-amber-800 font-bold">{gameState.kingsCount.partner2}</strong>
            </div>
          </div>
          <Crown className="w-7 h-7 text-[#D4AF37]" />
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
                {p1Name} (Terracotta)
              </span>
              {gameState.turn === "partner1" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#C05638]">
                  À vous de jouer
                </span>
              )}
            </div>
            <div className="text-xs text-stone-600 mt-1">
              Pièces : <strong className="text-stone-900 font-bold">{gameState.piecesCount.partner1}</strong> | Dames : <strong className="text-[#C05638] font-bold">{gameState.kingsCount.partner1}</strong>
            </div>
          </div>
          <Crown className="w-7 h-7 text-[#C05638]" />
        </div>
      </div>

      {/* Main 8x8 Board Container */}
      <div className="p-4 sm:p-6 rounded-3xl glass-panel border border-stone-200 shadow-md flex flex-col items-center">
        <div className="relative w-full max-w-[460px] aspect-square rounded-3xl border-4 border-stone-800 shadow-2xl overflow-hidden bg-[#FAF6EE] p-2">
          <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-2xl overflow-hidden border border-stone-300">
            {Array.from({ length: 8 }).map((_, r) =>
              Array.from({ length: 8 }).map((_, c) => {
                const isDark = (r + c) % 2 === 1;
                const piece = gameState.board[r][c];
                const isSelected = selectedPiece?.row === r && selectedPiece?.col === c;
                const isMoveTarget = legalMovesForSelected.some(
                  (m) => m.toRow === r && m.toCol === c
                );

                return (
                  <div
                    key={`${r}_${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className={`relative w-full h-full flex items-center justify-center transition-colors cursor-pointer select-none ${
                      isDark ? "bg-[#3D2514]" : "bg-[#FAF6EE]"
                    } ${isMoveTarget ? "ring-4 ring-amber-400/90 z-20" : ""}`}
                  >
                    {/* Move indicator dot if destination is legal */}
                    {isMoveTarget && (
                      <span className="absolute w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse pointer-events-none z-30"></span>
                    )}

                    {/* Piece Rendering */}
                    {piece && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePieceClick(piece);
                        }}
                        className={`w-[80%] h-[80%] rounded-full border-2 sm:border-3 flex items-center justify-center shadow-lg transition-transform ${
                          piece.player === "partner1"
                            ? "bg-[#C05638] border-[#FCFAF7] text-white"
                            : "bg-[#D4AF37] border-white text-stone-900"
                        } ${isSelected ? "scale-110 ring-4 ring-amber-400 z-30 animate-pulse" : "z-10 hover:scale-105"}`}
                      >
                        {piece.type === "king" && (
                          <Crown className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <p className="text-xs text-stone-600 text-center font-medium mt-4">
          {gameState.lastMessage}
        </p>
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Règles Officielles du Jeu de Dames
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
                <strong>1. Déplacement simple :</strong> Les pions se déplacent d'une case vers l'avant sur les cases sombres.
              </p>
              <p>
                <strong>2. Prise obligatoire :</strong> Si un pion adjacent à un pion adverse peut sauter par-dessus vers une case vide derrière, la prise est obligatoire.
              </p>
              <p>
                <strong>3. Promotion en Dame :</strong> Lorsqu'un pion atteint la dernière rangée opposée, il est couronné Dame.
              </p>
              <p>
                <strong>4. Pouvoirs de la Dame :</strong> La Dame peut avancer et reculer diagonalement pour se déplacer et capturer les pièces adverses.
              </p>
              <p>
                <strong>5. Victoire :</strong> Capturez toutes les pièces adverses ou bloquez complètement l'adversaire.
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

