// Comprehensive, authentic Awalé / Oware game engine for Wedding Mood
// Follows international tournament rules (Fédération Internationale de Jeux de l'Esprit)

export type AwalePlayer = "partner1" | "partner2";
export type AwaleAiLevel = "debutant" | "facile" | "moyen" | "difficile" | "expert" | "maitre";

export interface AwaleMoveRecord {
  moveNumber: number;
  player: AwalePlayer;
  pitIndex: number;
  seedsSown: number;
  captured: number;
  capturedPits: number[];
  pitsBefore: number[];
  pitsAfter: number[];
  scoresBefore: { p1: number; p2: number };
  scoresAfter: { p1: number; p2: number };
  explanation: string;
}

export interface AwaleGameState {
  pits: number[]; // 12 pits: 0-5 = partner1 (South), 6-11 = partner2 (North)
  score1: number;
  score2: number;
  turn: AwalePlayer;
  status: "ongoing" | "finished";
  winner: "partner1" | "partner2" | "draw" | null;
  history: AwaleMoveRecord[];
  aiLevel?: AwaleAiLevel;
  lastMessage?: string;
  gameMode: "couple" | "ai" | "local2p";
  pedagogicalMode: boolean; // Tutorial / Hint helper
}

export const INITIAL_PITS = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];

export function createInitialAwaleState(
  gameMode: "couple" | "ai" | "local2p" = "couple",
  aiLevel: AwaleAiLevel = "moyen",
  pedagogicalMode = false
): AwaleGameState {
  return {
    pits: [...INITIAL_PITS],
    score1: 0,
    score2: 0,
    turn: "partner1",
    status: "ongoing",
    winner: null,
    history: [],
    aiLevel,
    gameMode,
    pedagogicalMode,
    lastMessage: "La partie d'Awalé commence. À vous de jouer !",
  };
}

export function isPlayerPit(player: AwalePlayer, pitIndex: number): boolean {
  if (player === "partner1") return pitIndex >= 0 && pitIndex <= 5;
  return pitIndex >= 6 && pitIndex <= 11;
}

export function countSeedsOnSide(pits: number[], player: AwalePlayer): number {
  const start = player === "partner1" ? 0 : 6;
  let count = 0;
  for (let i = start; i < start + 6; i++) {
    count += pits[i];
  }
  return count;
}

// Simulate sowing and check if opponent will have seeds
export function doesMoveFeedOpponent(pits: number[], player: AwalePlayer, pitIndex: number): boolean {
  const seeds = pits[pitIndex];
  if (seeds === 0) return false;

  const tempPits = [...pits];
  tempPits[pitIndex] = 0;
  let curr = pitIndex;
  for (let s = 0; s < seeds; s++) {
    curr = (curr + 1) % 12;
    if (curr === pitIndex) curr = (curr + 1) % 12;
    tempPits[curr]++;
  }

  const opp = player === "partner1" ? "partner2" : "partner1";
  return countSeedsOnSide(tempPits, opp) > 0;
}

// Get all legal pits for a player according to official Oware rules
export function getLegalMoves(pits: number[], player: AwalePlayer): number[] {
  const start = player === "partner1" ? 0 : 6;
  const opp = player === "partner1" ? "partner2" : "partner1";
  const oppSeeds = countSeedsOnSide(pits, opp);

  const playablePitsWithSeeds: number[] = [];
  for (let i = start; i < start + 6; i++) {
    if (pits[i] > 0) {
      playablePitsWithSeeds.push(i);
    }
  }

  // If opponent has seeds, any non-empty pit on own side is legal
  if (oppSeeds > 0) {
    return playablePitsWithSeeds;
  }

  // STARVATION RULE: Opponent has 0 seeds! Player MUST play a pit that feeds them if any exist
  const feedingMoves = playablePitsWithSeeds.filter((pit) =>
    doesMoveFeedOpponent(pits, player, pit)
  );

  if (feedingMoves.length > 0) {
    return feedingMoves;
  }

  // If impossible to feed opponent, player can play any move, which will trigger game over
  return playablePitsWithSeeds;
}

export interface MoveExecutionResult {
  nextState: AwaleGameState;
  captured: number;
  capturedPits: number[];
  seedsSown: number;
}

export function executeAwaleMove(
  state: AwaleGameState,
  pitIndex: number
): MoveExecutionResult | null {
  const { pits, turn, score1, score2, history } = state;

  if (state.status === "finished") return null;

  const legalMoves = getLegalMoves(pits, turn);
  if (!legalMoves.includes(pitIndex)) return null;

  const seedsToSow = pits[pitIndex];
  if (seedsToSow === 0) return null;

  const newPits = [...pits];
  newPits[pitIndex] = 0;

  // Relay Sowing (Counter-clockwise: 0->1->2...->11->0, skipping origin if >= 12 seeds)
  let curr = pitIndex;
  for (let s = 0; s < seedsToSow; s++) {
    curr = (curr + 1) % 12;
    if (curr === pitIndex) curr = (curr + 1) % 12;
    newPits[curr]++;
  }

  const opp: AwalePlayer = turn === "partner1" ? "partner2" : "partner1";
  let captured = 0;
  const capturedPits: number[] = [];

  // Check capture condition on opponent's territory
  // Captures cascade backwards as long as each pit has 2 or 3 seeds and is in opponent territory
  let checkPit = curr;
  const simulatedCapturePits: number[] = [];
  let simulatedCaptureTotal = 0;

  while (isPlayerPit(opp, checkPit) && (newPits[checkPit] === 2 || newPits[checkPit] === 3)) {
    simulatedCapturePits.push(checkPit);
    simulatedCaptureTotal += newPits[checkPit];
    checkPit = (checkPit - 1 + 12) % 12;
  }

  // GRAND SLAM RULE: If a capture would take ALL opponent's seeds, leaving them with 0,
  // the capture is cancelled according to international rules to keep the game alive!
  const remainingOpponentSeeds = countSeedsOnSide(newPits, opp) - simulatedCaptureTotal;
  const isGrandSlam = simulatedCaptureTotal > 0 && remainingOpponentSeeds === 0;

  if (!isGrandSlam) {
    for (const p of simulatedCapturePits) {
      captured += newPits[p];
      newPits[p] = 0;
      capturedPits.push(p);
    }
  }

  let newScore1 = score1 + (turn === "partner1" ? captured : 0);
  let newScore2 = score2 + (turn === "partner2" ? captured : 0);

  const nextPlayer: AwalePlayer = opp;
  const oppLegal = getLegalMoves(newPits, nextPlayer);

  let status: "ongoing" | "finished" = "ongoing";
  let winner: "partner1" | "partner2" | "draw" | null = null;
  let statusMessage = "";

  // 1. Victory by majority: 25+ seeds captured
  if (newScore1 >= 25) {
    status = "finished";
    winner = "partner1";
    statusMessage = "David a franchi la barre des 25 graines ! Magnifique victoire d'Awalé.";
  } else if (newScore2 >= 25) {
    status = "finished";
    winner = "partner2";
    statusMessage = "Ruth a franchi la barre des 25 graines ! Magnifique victoire d'Awalé.";
  } else if (oppLegal.length === 0) {
    // Next player cannot move (starved and cannot be fed). Current player takes all remaining seeds on board!
    for (let i = 0; i < 12; i++) {
      if (turn === "partner1") newScore1 += newPits[i];
      else newScore2 += newPits[i];
      newPits[i] = 0;
    }
    status = "finished";
    if (newScore1 > newScore2) winner = "partner1";
    else if (newScore2 > newScore1) winner = "partner2";
    else winner = "draw";
    statusMessage = "L'adversaire est affamé et ne peut plus jouer. Les graines restantes sont attribuées.";
  } else {
    // Check if remaining circulating seeds are too few to ever be captured (< 4 seeds circulating)
    const totalRemaining = countSeedsOnSide(newPits, "partner1") + countSeedsOnSide(newPits, "partner2");
    if (totalRemaining <= 3) {
      for (let i = 0; i < 12; i++) {
        if (i < 6) newScore1 += newPits[i];
        else newScore2 += newPits[i];
        newPits[i] = 0;
      }
      status = "finished";
      if (newScore1 > newScore2) winner = "partner1";
      else if (newScore2 > newScore1) winner = "partner2";
      else winner = "draw";
      statusMessage = "Fin de partie, les dernières graines ont été partagées.";
    }
  }

  const moveRecord: AwaleMoveRecord = {
    moveNumber: history.length + 1,
    player: turn,
    pitIndex,
    seedsSown: seedsToSow,
    captured,
    capturedPits,
    pitsBefore: [...pits],
    pitsAfter: [...newPits],
    scoresBefore: { p1: score1, p2: score2 },
    scoresAfter: { p1: newScore1, p2: newScore2 },
    explanation: captured > 0
      ? `${turn === "partner1" ? "David" : "Ruth"} a semé depuis la case ${pitIndex + 1} et capturé ${captured} graines !`
      : `${turn === "partner1" ? "David" : "Ruth"} a semé ${seedsToSow} graines depuis la case ${pitIndex + 1}.`,
  };

  const nextState: AwaleGameState = {
    ...state,
    pits: newPits,
    score1: newScore1,
    score2: newScore2,
    turn: nextPlayer,
    status,
    winner,
    history: [...history, moveRecord],
    lastMessage: statusMessage || moveRecord.explanation,
  };

  return {
    nextState,
    captured,
    capturedPits,
    seedsSown: seedsToSow,
  };
}

// ----------------------------------------------------
// REAL AI ENGINE WITH 6 DISTINCT INTELLIGENCE LEVELS
// ----------------------------------------------------

export function evaluateAwaleBoard(pits: number[], score1: number, score2: number, player: AwalePlayer): number {
  const isP1 = player === "partner1";
  const myScore = isP1 ? score1 : score2;
  const oppScore = isP1 ? score2 : score1;

  let scoreDiff = (myScore - oppScore) * 100;

  // Board evaluation: seeds control
  const mySeeds = countSeedsOnSide(pits, player);
  const opp = isP1 ? "partner2" : "partner1";
  const oppSeeds = countSeedsOnSide(pits, opp);

  // Bonus for having comfortable seeds on own side
  scoreDiff += (mySeeds - oppSeeds) * 4;

  // Penalty for vulnerable pits (pits with 1 or 2 seeds that opponent can turn into 2 or 3)
  const myStart = isP1 ? 0 : 6;
  for (let i = myStart; i < myStart + 6; i++) {
    if (pits[i] === 1 || pits[i] === 2) {
      scoreDiff -= 8;
    }
    // High bonus for storing Krou/accumulated pits (>11 seeds)
    if (pits[i] >= 12) {
      scoreDiff += 15;
    }
  }

  return scoreDiff;
}

function minimax(
  pits: number[],
  score1: number,
  score2: number,
  player: AwalePlayer,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  const opp: AwalePlayer = player === "partner1" ? "partner2" : "partner1";
  const legal = getLegalMoves(pits, isMaximizing ? player : opp);

  if (depth === 0 || legal.length === 0 || score1 >= 25 || score2 >= 25) {
    return evaluateAwaleBoard(pits, score1, score2, player);
  }

  const dummyState: AwaleGameState = {
    pits,
    score1,
    score2,
    turn: isMaximizing ? player : opp,
    status: "ongoing",
    winner: null,
    history: [],
    gameMode: "ai",
    pedagogicalMode: false,
  };

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const pit of legal) {
      const res = executeAwaleMove(dummyState, pit);
      if (!res) continue;
      const evaluation = minimax(
        res.nextState.pits,
        res.nextState.score1,
        res.nextState.score2,
        player,
        depth - 1,
        alpha,
        beta,
        false
      );
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Pruning
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const pit of legal) {
      const res = executeAwaleMove(dummyState, pit);
      if (!res) continue;
      const evaluation = minimax(
        res.nextState.pits,
        res.nextState.score1,
        res.nextState.score2,
        player,
        depth - 1,
        alpha,
        beta,
        true
      );
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Pruning
    }
    return minEval;
  }
}

export function computeBestAwaleAiMove(
  state: AwaleGameState,
  level: AwaleAiLevel = "moyen"
): number {
  const legal = getLegalMoves(state.pits, state.turn);
  if (legal.length === 0) return -1;
  if (legal.length === 1) return legal[0];

  // 1. Débutant (Level 1): Mostly random, small preference for immediate captures
  if (level === "debutant") {
    if (Math.random() > 0.5) {
      // Find any capturing move
      for (const p of legal) {
        const res = executeAwaleMove(state, p);
        if (res && res.captured > 0) return p;
      }
    }
    return legal[Math.floor(Math.random() * legal.length)];
  }

  // 2. Facile (Level 2): Greedy captures
  if (level === "facile") {
    let bestCapture = -1;
    let bestPit = legal[0];
    for (const p of legal) {
      const res = executeAwaleMove(state, p);
      if (res && res.captured > bestCapture) {
        bestCapture = res.captured;
        bestPit = p;
      }
    }
    return bestPit;
  }

  // Search Depth based on level
  let searchDepth = 2; // Moyen
  if (level === "difficile") searchDepth = 4;
  else if (level === "expert") searchDepth = 5;
  else if (level === "maitre") searchDepth = 6;

  let bestScore = -Infinity;
  let bestMove = legal[0];

  for (const pit of legal) {
    const res = executeAwaleMove(state, pit);
    if (!res) continue;

    const evalScore = minimax(
      res.nextState.pits,
      res.nextState.score1,
      res.nextState.score2,
      state.turn,
      searchDepth - 1,
      -Infinity,
      Infinity,
      false
    );

    if (evalScore > bestScore) {
      bestScore = evalScore;
      bestMove = pit;
    }
  }

  return bestMove;
}

// ----------------------------------------------------
// PEDAGOGICAL / TUTORIAL HINTS
// ----------------------------------------------------

export interface AwaleHint {
  recommendedPit: number;
  reason: string;
  capturesCount: number;
  isDefense: boolean;
}

export function getAwalePedagogicalHint(state: AwaleGameState): AwaleHint | null {
  const legal = getLegalMoves(state.pits, state.turn);
  if (legal.length === 0) return null;

  const bestPit = computeBestAwaleAiMove(state, "difficile");
  const res = executeAwaleMove(state, bestPit);

  let reason = "Ce coup équilibre votre réserve et évite d'exposer vos cases.";
  let isDefense = false;
  let captures = 0;

  if (res && res.captured > 0) {
    reason = `Coup offensif : semer depuis cette case permet de capturer immédiatement ${res.captured} graines !`;
    captures = res.captured;
  } else {
    // Check if opponent was starving
    const opp = state.turn === "partner1" ? "partner2" : "partner1";
    if (countSeedsOnSide(state.pits, opp) === 0) {
      reason = "Règle de l'affamé : vous devez nourrir l'adversaire avec ce coup pour poursuivre la partie.";
      isDefense = true;
    } else {
      reason = "Ce coup protège vos graines fragiles et prépare une attaque en cascade au tour suivant.";
    }
  }

  return {
    recommendedPit: bestPit,
    reason,
    capturesCount: captures,
    isDefense,
  };
}
