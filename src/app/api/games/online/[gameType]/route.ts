import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { couples, gameHistory, gameSessions } from "@/db/schema";
import { getCurrentSession } from "@/lib/auth-helpers";
import { createInitialAwaleState, executeAwaleMove, type AwaleGameState } from "@/lib/awale-engine";
import {
  createInitialCheckersState,
  executeCheckersMove,
  getAllLegalMoves,
  type CheckersGameState,
  type CheckersMove,
} from "@/lib/checkers-engine";
import {
  createInitialWordGameState,
  drawTiles,
  validateAndScoreWordPlacement,
  type PlacedTile,
  type WordGameState,
} from "@/lib/word-engine";
import { refuserSiEssaiExpire } from "@/lib/access-guard";

/**
 * Parties sécurisées Awalé, Dames et Défi des Mots.
 *
 * Le navigateur n'envoie jamais un nouvel état, un score ou un gagnant.
 * Il envoie uniquement la commande minimale du coup ; le serveur verrouille
 * la ligne, vérifie l'identité et le tour, exécute le moteur, puis persiste le
 * résultat calculé.
 */

const CONFIG = {
  awale: {
    dbType: "awale_online",
    create: () => createInitialAwaleState("couple", "moyen", false),
  },
  dames: {
    dbType: "dames_online",
    create: () => createInitialCheckersState("couple", "moyen"),
  },
  mots: {
    dbType: "mots_online",
    create: () => createInitialWordGameState("couple"),
  },
} as const;

type GameType = keyof typeof CONFIG;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type ServerState = AwaleGameState | CheckersGameState | WordGameState;

type RuleFailure = { error: string; status: number };

type RuleSuccess = { state: ServerState };

function getGameType(value: unknown): GameType | null {
  return value === "awale" || value === "dames" || value === "mots" ? value : null;
}

function fail(error: string, status = 400): RuleFailure {
  return { error, status };
}

function isFailure(value: RuleFailure | RuleSuccess): value is RuleFailure {
  return "error" in value;
}

async function playerFromSession() {
  const session = await getCurrentSession();
  if (!session?.coupleId) return null;
  return { coupleId: session.coupleId, partner: session.activePartner };
}

async function coupleNames(coupleId: number) {
  const [couple] = await db.select().from(couples).where(eq(couples.id, coupleId)).limit(1);
  return {
    p1: couple?.partner1Name || "Époux",
    p2: couple?.partner2Name || "Épouse",
  };
}

async function findRow(tx: Tx, coupleId: number, gameType: GameType, lock: boolean) {
  const dbType = CONFIG[gameType].dbType;
  const query = tx
    .select()
    .from(gameSessions)
    .where(and(eq(gameSessions.coupleId, coupleId), eq(gameSessions.gameType, dbType)))
    .orderBy(desc(gameSessions.id))
    .limit(1);
  const [row] = lock ? await query.for("update") : await query;
  return row;
}

async function createRow(tx: Tx, coupleId: number, gameType: GameType) {
  const state: ServerState = CONFIG[gameType].create();
  const now = new Date();
  const [row] = await tx
    .insert(gameSessions)
    .values({
      coupleId,
      gameType: CONFIG[gameType].dbType,
      gameState: state,
      mode: "online",
      aiLevel: "moyen",
      turn: "partner1",
      score1: scoreOf(state, 1),
      score2: scoreOf(state, 2),
      status: state.status,
      winner: winnerOf(state),
      roomCode: `WM-${Math.floor(1000 + Math.random() * 9000)}`,
      lastMoveAt: now,
      updatedAt: now,
    })
    .returning();
  return row;
}

function scoreOf(state: ServerState, player: 1 | 2): number {
  if ("piecesCount" in state) {
    return player === 1 ? 12 - state.piecesCount.partner2 : 12 - state.piecesCount.partner1;
  }
  const scoredState = state as AwaleGameState | WordGameState;
  return player === 1 ? scoredState.score1 : scoredState.score2;
}

function winnerOf(state: ServerState): string | null {
  return state.winner || null;
}

function turnOf(state: ServerState): "partner1" | "partner2" {
  return state.turn;
}

function view(row: typeof gameSessions.$inferSelect, partner: string) {
  return {
    success: true,
    changed: true,
    you: partner,
    version: row.updatedAt.toISOString(),
    status: row.status,
    turn: row.turn,
    winner: row.winner,
    game: row.gameState as ServerState,
  };
}

function validInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

function applyAwale(state: AwaleGameState, partner: string, body: Record<string, unknown>): RuleFailure | RuleSuccess {
  if (state.status === "finished") return fail("La partie est terminée.", 409);
  if (state.turn !== partner) return fail("Ce n'est pas votre tour.", 403);
  if (!validInteger(body.pitIndex, 0, 11)) return fail("Case Awalé invalide.");
  const result = executeAwaleMove(state, body.pitIndex);
  if (!result) return fail("Ce coup Awalé est illégal.", 400);
  return { state: result.nextState };
}

function applyCheckers(
  state: CheckersGameState,
  partner: string,
  body: Record<string, unknown>
): RuleFailure | RuleSuccess {
  if (state.status === "finished") return fail("La partie est terminée.", 409);
  if (state.turn !== partner) return fail("Ce n'est pas votre tour.", 403);
  if (
    !validInteger(body.fromRow, 0, 7) ||
    !validInteger(body.fromCol, 0, 7) ||
    !validInteger(body.toRow, 0, 7) ||
    !validInteger(body.toCol, 0, 7)
  ) {
    return fail("Coordonnées Dames invalides.");
  }

  // Les prises éventuelles sont recalculées côté serveur : le client ne peut
  // pas injecter une pièce capturée, une promotion ou un gagnant.
  const legal = getAllLegalMoves(state.board, partner as "partner1" | "partner2");
  const move = legal.find(
    (candidate) =>
      candidate.fromRow === body.fromRow &&
      candidate.fromCol === body.fromCol &&
      candidate.toRow === body.toRow &&
      candidate.toCol === body.toCol
  );
  if (!move) return fail("Ce coup de Dames est illégal.", 400);

  return { state: executeCheckersMove(state, move) };
}

function applyWords(
  state: WordGameState,
  partner: string,
  body: Record<string, unknown>
): RuleFailure | RuleSuccess {
  if (state.status === "finished") return fail("La partie est terminée.", 409);
  if (state.turn !== partner) return fail("Ce n'est pas votre tour.", 403);
  if (!Array.isArray(body.tiles) || body.tiles.length === 0 || body.tiles.length > 7) {
    return fail("Le tirage doit contenir entre 1 et 7 lettres.");
  }

  const rack = partner === "partner1" ? state.rack1 : state.rack2;
  const used = new Set<string>();
  const placed: PlacedTile[] = [];

  for (const raw of body.tiles) {
    if (!raw || typeof raw !== "object") return fail("Tuile invalide.");
    const tile = raw as Record<string, unknown>;
    const tileId = typeof tile.tileId === "string" ? tile.tileId : "";
    if (!tileId || used.has(tileId)) return fail("Tuile dupliquée ou absente du chevalet.");
    used.add(tileId);

    const serverTile = rack.find((candidate) => candidate.id === tileId);
    if (!serverTile) return fail("Cette tuile n'appartient pas à votre chevalet.", 403);
    if (!validInteger(tile.row, 0, 10) || !validInteger(tile.col, 0, 10)) {
      return fail("Case Défi des Mots invalide.");
    }
    const cell = state.board[tile.row][tile.col];
    if (!cell || cell.isLocked || cell.letter) return fail("Cette case est déjà occupée.");

    placed.push({
      row: tile.row,
      col: tile.col,
      letter: serverTile.letter,
      points: serverTile.points,
      tileId: serverTile.id,
    });
  }

  // Refuse les trous entre deux lettres : l'état du serveur reste la seule
  // autorité sur les cases jouées.
  const sameRow = placed.every((tile) => tile.row === placed[0].row);
  const sameCol = placed.every((tile) => tile.col === placed[0].col);
  if (!sameRow && !sameCol) return fail("Les lettres doivent être alignées.");
  if (sameRow) {
    const row = placed[0].row;
    const cols = placed.map((tile) => tile.col);
    for (let col = Math.min(...cols); col <= Math.max(...cols); col++) {
      if (!state.board[row][col].letter && !placed.some((tile) => tile.row === row && tile.col === col)) {
        return fail("Le mot contient une case vide.");
      }
    }
  } else {
    const col = placed[0].col;
    const rows = placed.map((tile) => tile.row);
    for (let row = Math.min(...rows); row <= Math.max(...rows); row++) {
      if (!state.board[row][col].letter && !placed.some((tile) => tile.row === row && tile.col === col)) {
        return fail("Le mot contient une case vide.");
      }
    }
  }

  const check = validateAndScoreWordPlacement(state.board, placed);
  if (!check.isValid) return fail(check.error || "Placement de mot invalide.");

  const newBoard = state.board.map((row) => row.map((cell) => ({ ...cell })));
  for (const tile of placed) {
    newBoard[tile.row][tile.col].letter = tile.letter;
    newBoard[tile.row][tile.col].points = tile.points;
    newBoard[tile.row][tile.col].isLocked = true;
    newBoard[tile.row][tile.col].player = partner as "partner1" | "partner2";
  }

  const remainingRack = rack.filter((tile) => !used.has(tile.id));
  const drawn = drawTiles(state.bag, placed.length);
  const replenishedRack = [...remainingRack, ...drawn.drawn];
  const score1 = state.score1 + (partner === "partner1" ? check.score : 0);
  const score2 = state.score2 + (partner === "partner2" ? check.score : 0);
  const nextTurn = partner === "partner1" ? "partner2" : "partner1";
  const finished = drawn.remaining.length === 0 || replenishedRack.length === 0;
  const winner = finished
    ? score1 > score2
      ? "partner1"
      : score2 > score1
      ? "partner2"
      : "draw"
    : null;

  const nextState: WordGameState = {
    ...state,
    board: newBoard,
    bag: drawn.remaining,
    rack1: partner === "partner1" ? replenishedRack : state.rack1,
    rack2: partner === "partner2" ? replenishedRack : state.rack2,
    score1,
    score2,
    turn: nextTurn,
    status: finished ? "finished" : "ongoing",
    winner,
    history: [
      ...state.history,
      {
        turnNumber: state.history.length + 1,
        player: partner as "partner1" | "partner2",
        word: check.wordsFormed.join(", "),
        score: check.score,
      },
    ],
    lastMessage: `${partner === "partner1" ? "Époux" : "Épouse"} a posé '${check.wordsFormed.join(", ")}' et marque ${check.score} points !`,
  };

  return { state: nextState };
}

function applyMove(
  gameType: GameType,
  state: ServerState,
  partner: string,
  body: Record<string, unknown>
): RuleFailure | RuleSuccess {
  if (gameType === "awale") return applyAwale(state as AwaleGameState, partner, body);
  if (gameType === "dames") return applyCheckers(state as CheckersGameState, partner, body);
  return applyWords(state as WordGameState, partner, body);
}

function stateAfter(state: ServerState, gameType: GameType) {
  return {
    gameState: state,
    turn: turnOf(state),
    score1: scoreOf(state, 1),
    score2: scoreOf(state, 2),
    status: state.status,
    winner: winnerOf(state),
    gameType: CONFIG[gameType].dbType,
  };
}

export async function GET(req: NextRequest, ctx: { params: any }) {
  const gameType = getGameType((await ctx.params)?.gameType);
  if (!gameType) return Response.json({ success: false, message: "Jeu en ligne inconnu." }, { status: 404 });
  const player = await playerFromSession();
  if (!player) return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");
  const row = await db.transaction(async (tx) => {
    const found = await findRow(tx, player.coupleId, gameType, false);
    return found ?? (await createRow(tx, player.coupleId, gameType));
  });

  if (since && since === row.updatedAt.toISOString()) {
    return Response.json({ success: true, changed: false, you: player.partner, version: since });
  }
  return Response.json(view(row, player.partner));
}

export async function POST(req: NextRequest, ctx: { params: any }) {
  const gameType = getGameType((await ctx.params)?.gameType);
  if (!gameType) return Response.json({ success: false, message: "Jeu en ligne inconnu." }, { status: 404 });
  const player = await playerFromSession();
  if (!player) return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });

  const blocked = await refuserSiEssaiExpire(player.coupleId);
  if (blocked) return blocked;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.action !== "move" && body.action !== "reset") {
    return Response.json({ success: false, message: "Commande inconnue." }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      let row = await findRow(tx, player.coupleId, gameType, true);
      if (!row) row = await createRow(tx, player.coupleId, gameType);
      const previous = row.gameState as ServerState;

      if (body.action === "reset") {
        // Réinitialiser est une commande autorisée, mais l'état recréé reste
        // toujours produit par le moteur serveur et ne peut pas être injecté.
        const next = CONFIG[gameType].create() as ServerState;
        const now = new Date();
        const [updated] = await tx
          .update(gameSessions)
          .set({ ...stateAfter(next, gameType), mode: "online", lastMoveAt: now, updatedAt: now })
          .where(eq(gameSessions.id, row.id))
          .returning();
        return { row: updated };
      }

      const outcome = applyMove(gameType, previous, player.partner, body);
      if (isFailure(outcome)) return outcome;
      const next = outcome.state;
      const now = new Date();
      const [updated] = await tx
        .update(gameSessions)
        .set({ ...stateAfter(next, gameType), mode: "online", lastMoveAt: now, updatedAt: now })
        .where(eq(gameSessions.id, row.id))
        .returning();

      if (previous.status !== "finished" && next.status === "finished") {
        const { p1, p2 } = await coupleNames(player.coupleId);
        await tx.insert(gameHistory).values({
          coupleId: player.coupleId,
          gameType,
          mode: "online",
          player1Name: p1,
          player2Name: p2,
          score1: scoreOf(next, 1),
          score2: scoreOf(next, 2),
          winner: winnerOf(next) || "draw",
          durationSeconds: 0,
          details: { serverValidated: true, turns: "history" in next ? next.history.length : 0 },
        });
      }

      return { row: updated };
    });

    if ("error" in result) {
      return Response.json({ success: false, message: result.error }, { status: result.status });
    }
    return Response.json(view(result.row, player.partner));
  } catch (error) {
    console.error("Erreur jeu en ligne:", error);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
