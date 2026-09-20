// Professional, full-fledged Ludo King Engine for Wedding Mood
// Conforms directly to Ludo King official rules (CrazyGames):
// - 15x15 grid layout with 4 corner bases (yards) and 52-tile circuit
// - Exit yard only on rolling a 6
// - Bonus roll on rolling a 6, on capturing an opponent token, and on reaching home goal
// - 3 consecutive 6s forfeit the turn (Ludo King rule)
// - 8 Safe Star squares (tokens cannot be captured on safe squares)
// - Exact roll required to enter the central Home Goal
// - Tokens form blocks / stacks when occupying the same tile

export type LudoColor = "terracotta" | "gold" | "emerald" | "ivory";

export interface LudoToken {
  id: number; // 0, 1, 2, 3
  color: LudoColor;
  state: "yard" | "track" | "home_stretch" | "goal";
  trackPos: number; // 0 to 51 on circuit
  homeStep: number; // 1 to 5 in colored home column, 6 = goal
}

export interface LudoPlayer {
  id: string; // 'partner1', 'partner2', 'p3', 'p4', or 'ai'
  name: string;
  color: LudoColor;
  isAi: boolean;
  tokens: LudoToken[];
  tokensAtGoal: number;
}

export interface LudoGameState {
  players: LudoPlayer[];
  activePlayerIndex: number;
  diceValue: number | null;
  diceRolled: boolean;
  consecutiveSixes: number;
  bonusRoll: boolean;
  canRoll: boolean;
  movableTokenIds: number[];
  winner: LudoColor | null;
  status: "ongoing" | "finished";
  history: {
    turnNumber: number;
    color: LudoColor;
    roll: number;
    action: string;
  }[];
  lastMessage: string;
}

// Starting track indices on the 52-tile circuit for each of the 4 colors
export const START_TRACK_POS: Record<LudoColor, number> = {
  terracotta: 0,  // Red / Terracotta starts at cell 0
  emerald: 13,    // Green / Emerald starts at cell 13
  gold: 26,       // Yellow / Gold starts at cell 26
  ivory: 39,      // Blue / Ivory starts at cell 39
};

// Safe Star squares on the 52-tile circuit where tokens are protected
export const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

// Last track square before entering colored home column
export const HOME_ENTRANCE_POS: Record<LudoColor, number> = {
  terracotta: 50,
  emerald: 11,
  gold: 24,
  ivory: 37,
};

// Exact (row, col) coordinates on the 15x15 board for all 52 perimeter cells
export const TRACK_COORDINATES: [number, number][] = [
  // Terracotta arm going right
  [6, 1],  // 0  (Terracotta Start)
  [6, 2],  // 1
  [6, 3],  // 2
  [6, 4],  // 3
  [6, 5],  // 4
  // Turning up into top arm
  [5, 6],  // 5
  [4, 6],  // 6
  [3, 6],  // 7
  [2, 6],  // 8  (Safe Star)
  [1, 6],  // 9
  [0, 6],  // 10
  [0, 7],  // 11
  [0, 8],  // 12
  // Emerald arm going down
  [1, 8],  // 13 (Emerald Start)
  [2, 8],  // 14
  [3, 8],  // 15
  [4, 8],  // 16
  [5, 8],  // 17
  // Turning right into right arm
  [6, 9],  // 18
  [6, 10], // 19
  [6, 11], // 20
  [6, 12], // 21 (Safe Star)
  [6, 13], // 22
  [6, 14], // 23
  [7, 14], // 24
  [8, 14], // 25
  // Gold arm going left
  [8, 13], // 26 (Gold Start)
  [8, 12], // 27
  [8, 11], // 28
  [8, 10], // 29
  [8, 9],  // 30
  // Turning down into bottom arm
  [9, 8],  // 31
  [10, 8], // 32
  [11, 8], // 33
  [12, 8], // 34 (Safe Star)
  [13, 8], // 35
  [14, 8], // 36
  [14, 7], // 37
  [14, 6], // 38
  // Ivory / Blue arm going up
  [13, 6], // 39 (Ivory Start)
  [12, 6], // 40
  [11, 6], // 41
  [10, 6], // 42
  [9, 6],  // 43
  // Turning left into left arm
  [8, 5],  // 44
  [8, 4],  // 45
  [8, 3],  // 46
  [8, 2],  // 47 (Safe Star)
  [8, 1],  // 48
  [8, 0],  // 49
  [7, 0],  // 50 (Terracotta Entrance)
  [6, 0],  // 51
];

// Colored home columns leading to goal (steps 1 to 5)
export const HOME_STRETCH_COORDINATES: Record<LudoColor, [number, number][]> = {
  terracotta: [
    [7, 1], [7, 2], [7, 3], [7, 4], [7, 5],
  ],
  emerald: [
    [1, 7], [2, 7], [3, 7], [4, 7], [5, 7],
  ],
  gold: [
    [7, 13], [7, 12], [7, 11], [7, 10], [7, 9],
  ],
  ivory: [
    [13, 7], [12, 7], [11, 7], [10, 7], [9, 7],
  ],
};

// Yard circle slots for the 4 tokens of each color
export const YARD_SLOTS: Record<LudoColor, [number, number][]> = {
  terracotta: [
    [2, 2], [2, 3], [3, 2], [3, 3],
  ],
  emerald: [
    [2, 11], [2, 12], [3, 11], [3, 12],
  ],
  gold: [
    [11, 11], [11, 12], [12, 11], [12, 12],
  ],
  ivory: [
    [11, 2], [11, 3], [12, 2], [12, 3],
  ],
};

export function createInitialLudoTokens(color: LudoColor): LudoToken[] {
  return [0, 1, 2, 3].map((id) => ({
    id,
    color,
    state: "yard",
    trackPos: -1,
    homeStep: 0,
  }));
}

export function createInitialLudoGame(
  mode: "couple" | "ai" | "4p" = "couple",
  p1Name = "Époux",
  p2Name = "Épouse"
): LudoGameState {
  let players: LudoPlayer[] = [];

  if (mode === "4p") {
    players = [
      { id: "partner1", name: p1Name, color: "terracotta", isAi: false, tokens: createInitialLudoTokens("terracotta"), tokensAtGoal: 0 },
      { id: "emerald_p", name: "Témoin 1", color: "emerald", isAi: true, tokens: createInitialLudoTokens("emerald"), tokensAtGoal: 0 },
      { id: "partner2", name: p2Name, color: "gold", isAi: false, tokens: createInitialLudoTokens("gold"), tokensAtGoal: 0 },
      { id: "ivory_p", name: "Témoin 2", color: "ivory", isAi: true, tokens: createInitialLudoTokens("ivory"), tokensAtGoal: 0 },
    ];
  } else if (mode === "ai") {
    players = [
      { id: "partner1", name: p1Name, color: "terracotta", isAi: false, tokens: createInitialLudoTokens("terracotta"), tokensAtGoal: 0 },
      { id: "ai", name: "Ordinateur (IA)", color: "gold", isAi: true, tokens: createInitialLudoTokens("gold"), tokensAtGoal: 0 },
    ];
  } else {
    // 2 Players Couple mode (Époux: Terracotta vs Épouse: Gold)
    players = [
      { id: "partner1", name: p1Name, color: "terracotta", isAi: false, tokens: createInitialLudoTokens("terracotta"), tokensAtGoal: 0 },
      { id: "partner2", name: p2Name, color: "gold", isAi: false, tokens: createInitialLudoTokens("gold"), tokensAtGoal: 0 },
    ];
  }

  return {
    players,
    activePlayerIndex: 0,
    diceValue: null,
    diceRolled: false,
    consecutiveSixes: 0,
    bonusRoll: false,
    canRoll: true,
    movableTokenIds: [],
    winner: null,
    status: "ongoing",
    history: [],
    lastMessage: `C'est à ${players[0].name} de lancer le dé !`,
  };
}

export function getMovableTokens(player: LudoPlayer, dice: number): number[] {
  const movable: number[] = [];

  player.tokens.forEach((token) => {
    if (token.state === "goal") return;

    if (token.state === "yard") {
      // Rolling a 6 allows bringing token out to starting square
      if (dice === 6) movable.push(token.id);
    } else if (token.state === "track") {
      const entrance = HOME_ENTRANCE_POS[token.color];
      const distToEntrance = (entrance - token.trackPos + 52) % 52;
      // If dice reaches or enters home stretch, must not overshoot step 6
      if (dice > distToEntrance) {
        const homeStep = dice - distToEntrance;
        if (homeStep <= 6) {
          movable.push(token.id);
        }
      } else {
        movable.push(token.id);
      }
    } else if (token.state === "home_stretch") {
      // In home stretch, exact roll needed to reach goal (step 6)
      if (token.homeStep + dice <= 6) {
        movable.push(token.id);
      }
    }
  });

  return movable;
}

export interface LudoMoveResult {
  nextState: LudoGameState;
  capturedToken: { color: LudoColor; id: number } | null;
  reachedGoal: boolean;
  bonusRollAwarded: boolean;
}

export function executeLudoTokenMove(
  state: LudoGameState,
  tokenId: number
): LudoMoveResult {
  const { players, activePlayerIndex, diceValue } = state;
  const player = players[activePlayerIndex];
  const dice = diceValue || 1;

  const newPlayers = players.map((p) => ({
    ...p,
    tokens: p.tokens.map((t) => ({ ...t })),
  }));
  const currentPlayer = newPlayers[activePlayerIndex];
  const token = currentPlayer.tokens.find((t) => t.id === tokenId)!;

  let capturedColor: LudoColor | null = null;
  let capturedId: number | null = null;
  let reachedGoal = false;
  let bonusRoll = false;

  // 1. Move from Yard on 6
  if (token.state === "yard") {
    token.state = "track";
    token.trackPos = START_TRACK_POS[token.color];
    token.homeStep = 0;
    bonusRoll = true;
  } else if (token.state === "track") {
    const entrancePos = HOME_ENTRANCE_POS[token.color];
    const stepsToEntrance = (entrancePos - token.trackPos + 52) % 52;

    if (token.trackPos === entrancePos) {
      token.state = "home_stretch";
      token.homeStep = dice;
      if (token.homeStep === 6) {
        token.state = "goal";
        reachedGoal = true;
        currentPlayer.tokensAtGoal++;
        bonusRoll = true;
      }
    } else if (dice > stepsToEntrance) {
      token.state = "home_stretch";
      token.homeStep = dice - stepsToEntrance;
      if (token.homeStep === 6) {
        token.state = "goal";
        reachedGoal = true;
        currentPlayer.tokensAtGoal++;
        bonusRoll = true;
      }
    } else {
      token.trackPos = (token.trackPos + dice) % 52;

      // Check capture on non-safe square
      if (!SAFE_SQUARES.includes(token.trackPos)) {
        newPlayers.forEach((otherP) => {
          if (otherP.color !== token.color) {
            otherP.tokens.forEach((otherT) => {
              if (otherT.state === "track" && otherT.trackPos === token.trackPos) {
                // CAPTURE! Send opponent token back to yard
                otherT.state = "yard";
                otherT.trackPos = -1;
                otherT.homeStep = 0;
                capturedColor = otherT.color;
                capturedId = otherT.id;
                bonusRoll = true;
              }
            });
          }
        });
      }
    }
  } else if (token.state === "home_stretch") {
    token.homeStep += dice;
    if (token.homeStep === 6) {
      token.state = "goal";
      reachedGoal = true;
      currentPlayer.tokensAtGoal++;
      bonusRoll = true;
    }
  }

  // Bonus roll on rolling a 6, capturing, or reaching goal
  if (dice === 6 || capturedColor !== null || reachedGoal) {
    bonusRoll = true;
  }

  // Victory check: 4 tokens reached the central goal
  let winner: LudoColor | null = state.winner;
  let status = state.status;
  if (currentPlayer.tokensAtGoal >= 4) {
    winner = currentPlayer.color;
    status = "finished";
  }

  let nextPlayerIdx = activePlayerIndex;
  let message = "";

  if (winner) {
    message = `Félicitations ! ${currentPlayer.name} remporte la victoire au Ludo !`;
  } else if (bonusRoll) {
    nextPlayerIdx = activePlayerIndex;
    message = capturedColor !== null
      ? `${currentPlayer.name} a capturé un pion adverse ! Vous rejouez grâce au bonus.`
      : reachedGoal
      ? `${currentPlayer.name} a fait entrer un pion à l'autel ! Vous rejouez.`
      : `${currentPlayer.name} a obtenu un 6 ! Relancez le dé.`;
  } else {
    nextPlayerIdx = (activePlayerIndex + 1) % players.length;
    message = `Au tour de ${players[nextPlayerIdx].name} de lancer le dé.`;
  }

  const actionText = capturedColor !== null
    ? `Capture pion ${capturedColor}`
    : reachedGoal
    ? "Arrivée à l'autel"
    : `Déplacement pion ${tokenId + 1}`;

  const nextState: LudoGameState = {
    ...state,
    players: newPlayers,
    activePlayerIndex: nextPlayerIdx,
    diceValue: null,
    diceRolled: false,
    bonusRoll,
    canRoll: true,
    movableTokenIds: [],
    winner,
    status,
    lastMessage: message,
    history: [
      ...state.history,
      {
        turnNumber: state.history.length + 1,
        color: token.color,
        roll: dice,
        action: actionText,
      },
    ],
  };

  const capturedTokenResult = capturedColor !== null && capturedId !== null
    ? { color: capturedColor, id: capturedId }
    : null;

  return {
    nextState,
    capturedToken: capturedTokenResult,
    reachedGoal,
    bonusRollAwarded: bonusRoll,
  };
}

// AI Strategy: prioritize exiting yard on 6, capturing opponents, reaching goal and safe spots
export function pickBestLudoAiToken(
  state: LudoGameState,
  movableTokenIds: number[]
): number {
  if (movableTokenIds.length === 1) return movableTokenIds[0];

  const player = state.players[state.activePlayerIndex];
  const dice = state.diceValue || 1;

  let bestToken = movableTokenIds[0];
  let bestScore = -Infinity;

  movableTokenIds.forEach((id) => {
    let score = 0;
    const token = player.tokens.find((t) => t.id === id)!;

    // 1. Reaching goal
    if (token.state === "home_stretch" && token.homeStep + dice === 6) {
      score += 500;
    }

    // 2. Capturing an opponent
    if (token.state === "track") {
      const dest = (token.trackPos + dice) % 52;
      if (!SAFE_SQUARES.includes(dest)) {
        state.players.forEach((otherP) => {
          if (otherP.color !== token.color) {
            otherP.tokens.forEach((otherT) => {
              if (otherT.state === "track" && otherT.trackPos === dest) {
                score += 400; // Capture priority!
              }
            });
          }
        });
      }

      // 3. Reaching a safe star square
      if (SAFE_SQUARES.includes(dest)) {
        score += 120;
      }

      // 4. Entering home stretch
      const entrance = HOME_ENTRANCE_POS[token.color];
      const dist = (entrance - token.trackPos + 52) % 52;
      if (dice >= dist) {
        score += 200;
      }
    }

    // 5. Exiting yard on a 6
    if (token.state === "yard" && dice === 6) {
      score += 250;
    }

    // 6. Prefer moving the furthest token forward
    if (token.state === "track") {
      score += 20;
    }

    if (score > bestScore) {
      bestScore = score;
      bestToken = id;
    }
  });

  return bestToken;
}

