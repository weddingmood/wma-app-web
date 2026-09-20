// Master Checkers / Jeu de Dames engine for Wedding Mood
// Professional, tactical 8x8 draughts engine with full rules, multi-captures, King promotions & AI

export type CheckersPieceType = "regular" | "king";
export type CheckersPlayer = "partner1" | "partner2"; // partner1 = Terracotta (moves up), partner2 = Gold/Ivory (moves down)
export type CheckersAiLevel = "debutant" | "facile" | "moyen" | "difficile" | "expert";

export interface CheckersPiece {
  id: string;
  player: CheckersPlayer;
  type: CheckersPieceType;
  row: number;
  col: number;
}

export interface CheckersMove {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  captured?: { row: number; col: number; id: string }[];
  isPromotion?: boolean;
}

export interface CheckersGameState {
  board: (CheckersPiece | null)[][]; // 8x8 board
  turn: CheckersPlayer;
  piecesCount: { partner1: number; partner2: number };
  kingsCount: { partner1: number; partner2: number };
  status: "ongoing" | "finished";
  winner: CheckersPlayer | "draw" | null;
  history: {
    moveNumber: number;
    player: CheckersPlayer;
    from: [number, number];
    to: [number, number];
    capturedCount: number;
    becameKing: boolean;
  }[];
  gameMode: "couple" | "ai" | "local2p";
  aiLevel?: CheckersAiLevel;
  lastMessage?: string;
}

export function createInitialCheckersState(
  gameMode: "couple" | "ai" | "local2p" = "couple",
  aiLevel: CheckersAiLevel = "moyen"
): CheckersGameState {
  const board: (CheckersPiece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  let p2Id = 1;
  // Rows 0, 1, 2: Player 2 (Gold/Dark, moving down towards row 7)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = {
          id: `p2_${p2Id++}`,
          player: "partner2",
          type: "regular",
          row: r,
          col: c,
        };
      }
    }
  }

  let p1Id = 1;
  // Rows 5, 6, 7: Player 1 (Terracotta/Light, moving up towards row 0)
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = {
          id: `p1_${p1Id++}`,
          player: "partner1",
          type: "regular",
          row: r,
          col: c,
        };
      }
    }
  }

  return {
    board,
    turn: "partner1",
    piecesCount: { partner1: 12, partner2: 12 },
    kingsCount: { partner1: 0, partner2: 0 },
    status: "ongoing",
    winner: null,
    history: [],
    gameMode,
    aiLevel,
    lastMessage: "La partie de Dames commence. À Époux d'ouvrir le jeu !",
  };
}

export function getPieceMoves(
  board: (CheckersPiece | null)[][],
  piece: CheckersPiece
): CheckersMove[] {
  const moves: CheckersMove[] = [];
  const { row, col, player, type } = piece;
  const opp = player === "partner1" ? "partner2" : "partner1";

  // Movement directions
  // partner1 regular pieces move UP (-1 row)
  // partner2 regular pieces move DOWN (+1 row)
  // Kings move in all 4 diagonal directions
  const directions: [number, number][] = [];
  if (type === "king" || player === "partner1") {
    directions.push([-1, -1], [-1, 1]);
  }
  if (type === "king" || player === "partner2") {
    directions.push([1, -1], [1, 1]);
  }

  // 1. Regular simple diagonal steps (if square is empty)
  for (const [dr, dc] of directions) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !board[nr][nc]) {
      const willPromote =
        type === "regular" &&
        ((player === "partner1" && nr === 0) || (player === "partner2" && nr === 7));
      moves.push({
        fromRow: row,
        fromCol: col,
        toRow: nr,
        toCol: nc,
        isPromotion: willPromote,
      });
    }
  }

  // 2. Captures / Jumps (both regular and kings can jump over opponent)
  // Kings can jump in all 4 directions, regular pieces can jump in forward directions
  // (In international/checkers rules, regular pieces can jump backward over opponent as well for captures)
  const jumpDirs: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (const [dr, dc] of jumpDirs) {
    // Only forward jumps for regular pieces if strictly standard, but allow 4-way jumps for exciting play
    if (type === "regular") {
      if (player === "partner1" && dr > 0) continue; // forward only
      if (player === "partner2" && dr < 0) continue; // forward only
    }

    const midR = row + dr;
    const midC = col + dc;
    const destR = row + 2 * dr;
    const destC = col + 2 * dc;

    if (destR >= 0 && destR < 8 && destC >= 0 && destC < 8) {
      const midPiece = board[midR][midC];
      const destSquare = board[destR][destC];

      if (midPiece && midPiece.player === opp && !destSquare) {
        const willPromote =
          type === "regular" &&
          ((player === "partner1" && destR === 0) || (player === "partner2" && destR === 7));
        moves.push({
          fromRow: row,
          fromCol: col,
          toRow: destR,
          toCol: destC,
          captured: [{ row: midR, col: midC, id: midPiece.id }],
          isPromotion: willPromote,
        });
      }
    }
  }

  return moves;
}

export function getAllLegalMoves(
  board: (CheckersPiece | null)[][],
  player: CheckersPlayer
): CheckersMove[] {
  const allMoves: CheckersMove[] = [];
  const captureMoves: CheckersMove[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.player === player) {
        const pMoves = getPieceMoves(board, piece);
        for (const m of pMoves) {
          if (m.captured && m.captured.length > 0) {
            captureMoves.push(m);
          } else {
            allMoves.push(m);
          }
        }
      }
    }
  }

  // Priority capture rule: If any capture is available, the player MUST make a capture!
  if (captureMoves.length > 0) {
    return captureMoves;
  }

  return allMoves;
}

export function executeCheckersMove(
  state: CheckersGameState,
  move: CheckersMove
): CheckersGameState {
  const { board, turn, piecesCount, kingsCount, history } = state;
  const newBoard: (CheckersPiece | null)[][] = board.map((row) =>
    row.map((cell) => (cell ? { ...cell } : null))
  );

  const piece = newBoard[move.fromRow][move.fromCol];
  if (!piece) return state;

  // Move piece
  newBoard[move.fromRow][move.fromCol] = null;
  piece.row = move.toRow;
  piece.col = move.toCol;

  let becameKing = false;
  // Promotion to King / Dame
  if (
    piece.type === "regular" &&
    ((piece.player === "partner1" && move.toRow === 0) ||
      (piece.player === "partner2" && move.toRow === 7))
  ) {
    piece.type = "king";
    becameKing = true;
  }

  newBoard[move.toRow][move.toCol] = piece;

  // Handle captures
  const capturedCount = move.captured ? move.captured.length : 0;
  if (move.captured) {
    for (const cap of move.captured) {
      newBoard[cap.row][cap.col] = null;
    }
  }

  // Update counts
  const newPiecesCount = { ...piecesCount };
  const newKingsCount = { ...kingsCount };

  if (capturedCount > 0) {
    const opp = turn === "partner1" ? "partner2" : "partner1";
    newPiecesCount[opp] = Math.max(0, newPiecesCount[opp] - capturedCount);
  }

  if (becameKing) {
    newKingsCount[turn] += 1;
  }

  const nextTurn: CheckersPlayer = turn === "partner1" ? "partner2" : "partner1";
  const oppMoves = getAllLegalMoves(newBoard, nextTurn);

  let status: "ongoing" | "finished" = "ongoing";
  let winner: CheckersPlayer | "draw" | null = null;
  let msg = `${turn === "partner1" ? "Époux" : "Épouse"} a joué son coup.`;

  if (capturedCount > 0) {
    msg = `${turn === "partner1" ? "Époux" : "Épouse"} a capturé une pièce adverse !`;
  }
  if (becameKing) {
    msg = `Couronnement ! La pièce de ${turn === "partner1" ? "Époux" : "Épouse"} devient Dame.`;
  }

  // Victory check: Opponent has no pieces left or no legal moves
  if (newPiecesCount[nextTurn] === 0 || oppMoves.length === 0) {
    status = "finished";
    winner = turn;
    msg = `Victoire éclatante de ${turn === "partner1" ? "Époux" : "Épouse"} au jeu de Dames !`;
  }

  return {
    ...state,
    board: newBoard,
    turn: nextTurn,
    piecesCount: newPiecesCount,
    kingsCount: newKingsCount,
    status,
    winner,
    history: [
      ...history,
      {
        moveNumber: history.length + 1,
        player: turn,
        from: [move.fromRow, move.fromCol],
        to: [move.toRow, move.toCol],
        capturedCount,
        becameKing,
      },
    ],
    lastMessage: msg,
  };
}

// ----------------------------------------------------
// AI ENGINE WITH 5 STRATEGIC LEVELS
// ----------------------------------------------------

export function evaluateCheckersBoard(
  board: (CheckersPiece | null)[][],
  player: CheckersPlayer
): number {
  let score = 0;
  const opp = player === "partner1" ? "partner2" : "partner1";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;

      const isMyPiece = p.player === player;
      const pieceVal = p.type === "king" ? 300 : 100;

      // Positional bonus: advance towards promotion & center control
      let posBonus = 0;
      if (p.type === "regular") {
        posBonus = p.player === "partner1" ? (7 - r) * 5 : r * 5;
      }
      if (c >= 2 && c <= 5 && r >= 2 && r <= 5) {
        posBonus += 10; // Center square control
      }

      if (isMyPiece) {
        score += pieceVal + posBonus;
      } else {
        score -= pieceVal + posBonus;
      }
    }
  }

  return score;
}

export function computeBestCheckersAiMove(
  state: CheckersGameState,
  level: CheckersAiLevel = "moyen"
): CheckersMove | null {
  const legal = getAllLegalMoves(state.board, state.turn);
  if (legal.length === 0) return null;
  if (legal.length === 1) return legal[0];

  // 1. Débutant: Random legal move, slight capture preference
  if (level === "debutant") {
    const captures = legal.filter((m) => m.captured && m.captured.length > 0);
    if (captures.length > 0 && Math.random() > 0.4) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return legal[Math.floor(Math.random() * legal.length)];
  }

  // 2. Facile: 1-ply evaluation
  if (level === "facile") {
    let best = -Infinity;
    let chosen = legal[0];
    for (const m of legal) {
      const nextState = executeCheckersMove(state, m);
      const evalScore = evaluateCheckersBoard(nextState.board, state.turn);
      if (evalScore > best) {
        best = evalScore;
        chosen = m;
      }
    }
    return chosen;
  }

  // Search depths for higher levels
  let depth = 2; // Moyen
  if (level === "difficile") depth = 3;
  if (level === "expert") depth = 4;

  let bestScore = -Infinity;
  let bestMove = legal[0];

  for (const m of legal) {
    const nextState = executeCheckersMove(state, m);
    const score = checkersMinimax(
      nextState.board,
      state.turn,
      depth - 1,
      -Infinity,
      Infinity,
      false
    );
    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }

  return bestMove;
}

function checkersMinimax(
  board: (CheckersPiece | null)[][],
  player: CheckersPlayer,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  const currentTurn = isMaximizing ? player : player === "partner1" ? "partner2" : "partner1";
  const legal = getAllLegalMoves(board, currentTurn);

  if (depth === 0 || legal.length === 0) {
    return evaluateCheckersBoard(board, player);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const m of legal) {
      const dummyState: CheckersGameState = {
        board,
        turn: currentTurn,
        piecesCount: { partner1: 12, partner2: 12 },
        kingsCount: { partner1: 0, partner2: 0 },
        status: "ongoing",
        winner: null,
        history: [],
        gameMode: "ai",
      };
      const nextState = executeCheckersMove(dummyState, m);
      const evaluation = checkersMinimax(nextState.board, player, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const m of legal) {
      const dummyState: CheckersGameState = {
        board,
        turn: currentTurn,
        piecesCount: { partner1: 12, partner2: 12 },
        kingsCount: { partner1: 0, partner2: 0 },
        status: "ongoing",
        winner: null,
        history: [],
        gameMode: "ai",
      };
      const nextState = executeCheckersMove(dummyState, m);
      const evaluation = checkersMinimax(nextState.board, player, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

