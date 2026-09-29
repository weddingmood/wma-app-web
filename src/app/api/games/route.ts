import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { gameSessions, gameHistory, couples } from "@/db/schema";
import { refuserSiEssaiExpire } from "@/lib/access-guard";
import { eq, and, desc } from "drizzle-orm";
import { createInitialAwaleState } from "@/lib/awale-engine";
import { createInitialCheckersState } from "@/lib/checkers-engine";
import { createInitialLudoGame } from "@/lib/ludo-engine";
import { createInitialWordGameState } from "@/lib/word-engine";

const GAME_TYPES = ["ludo", "awale", "dames", "mots"] as const;
type GameType = (typeof GAME_TYPES)[number];

function isGameType(value: unknown): value is GameType {
  return typeof value === "string" && GAME_TYPES.includes(value as GameType);
}

function initialState(gameType: GameType, p1Name: string, p2Name: string, mode = "couple") {
  if (gameType === "awale") return createInitialAwaleState(mode as "couple", "moyen", false);
  if (gameType === "dames") return createInitialCheckersState(mode as "couple", "moyen");
  if (gameType === "mots") return createInitialWordGameState(mode as "couple");
  return createInitialLudoGame(mode as "couple", p1Name, p2Name);
}

export async function GET(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const gameType = searchParams.get("gameType") || "ludo";
  const getHistory = searchParams.get("history");

  const [couple] = await db
    .select()
    .from(couples)
    .where(eq(couples.id, session.coupleId))
    .limit(1);

  const p1Name = couple?.partner1Name || "Époux";
  const p2Name = couple?.partner2Name || "Épouse";

  const historyRecords = await db
    .select()
    .from(gameHistory)
    .where(eq(gameHistory.coupleId, session.coupleId))
    .orderBy(desc(gameHistory.completedAt))
    .limit(50);

  const totalGames = historyRecords.length;
  const p1Wins = historyRecords.filter((h) => h.winner === "partner1").length;
  const p2Wins = historyRecords.filter((h) => h.winner === "partner2").length;
  const aiWins = historyRecords.filter((h) => h.winner === "ai").length;
  const draws = historyRecords.filter((h) => h.winner === "draw").length;

  const statsByGame: Record<string, { played: number; p1Wins: number; p2Wins: number; bestScore1: number; bestScore2: number }> = {
    ludo: { played: 0, p1Wins: 0, p2Wins: 0, bestScore1: 0, bestScore2: 0 },
    awale: { played: 0, p1Wins: 0, p2Wins: 0, bestScore1: 0, bestScore2: 0 },
    dames: { played: 0, p1Wins: 0, p2Wins: 0, bestScore1: 0, bestScore2: 0 },
    mots: { played: 0, p1Wins: 0, p2Wins: 0, bestScore1: 0, bestScore2: 0 },
  };

  historyRecords.forEach((h) => {
    const gKey = h.gameType.toLowerCase();
    if (!statsByGame[gKey]) {
      statsByGame[gKey] = { played: 0, p1Wins: 0, p2Wins: 0, bestScore1: 0, bestScore2: 0 };
    }
    statsByGame[gKey].played++;
    if (h.winner === "partner1") statsByGame[gKey].p1Wins++;
    if (h.winner === "partner2") statsByGame[gKey].p2Wins++;
    statsByGame[gKey].bestScore1 = Math.max(statsByGame[gKey].bestScore1, h.score1 || 0);
    statsByGame[gKey].bestScore2 = Math.max(statsByGame[gKey].bestScore2, h.score2 || 0);
  });

  if (getHistory) {
    return Response.json({
      success: true,
      history: historyRecords,
      stats: {
        totalGames,
        p1Wins,
        p2Wins,
        aiWins,
        draws,
        winRateP1: totalGames > 0 ? Math.round((p1Wins / totalGames) * 100) : 50,
        winRateP2: totalGames > 0 ? Math.round((p2Wins / totalGames) * 100) : 50,
        statsByGame,
      },
    });
  }

  if (!isGameType(gameType)) {
    return Response.json({ success: false, message: "Type de jeu inconnu." }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(gameSessions)
    .where(and(eq(gameSessions.coupleId, session.coupleId), eq(gameSessions.gameType, gameType)))
    .limit(1);

  if (existing) {
    return Response.json({
      success: true,
      session: existing,
      couplePlayers: { p1Name, p2Name },
      history: historyRecords.slice(0, 10),
      stats: { totalGames, p1Wins, p2Wins, statsByGame },
    });
  }

  const state = initialState(gameType, p1Name, p2Name);
  const [newSession] = await db
    .insert(gameSessions)
    .values({
      coupleId: session.coupleId,
      gameType,
      gameState: state,
      mode: "couple",
      aiLevel: "moyen",
      turn: "partner1",
      score1: 0,
      score2: 0,
      status: "ongoing",
      roomCode: `WM-${Math.floor(1000 + Math.random() * 9000)}`,
    })
    .returning();

  return Response.json({
    success: true,
    session: newSession,
    couplePlayers: { p1Name, p2Name },
    history: historyRecords.slice(0, 10),
    stats: { totalGames, p1Wins, p2Wins, statsByGame },
  });
}

/**
 * Compatibilité de route conservée, mais aucune commande client ne peut plus
 * écrire un état, un tour, un score ou un gagnant. Les coups Couple passent
 * par /api/games/online/[gameType], qui verrouille et valide le moteur serveur.
 */
export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }
  const blocked = await refuserSiEssaiExpire(session.coupleId);
  if (blocked) return blocked;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const gameType = body.gameType;

  if (body.action !== "reset" || !isGameType(gameType)) {
    return Response.json(
      {
        success: false,
        message: "Les parties Couple sont pilotées par une commande de jeu validée côté serveur.",
      },
      { status: 400 }
    );
  }

  const [couple] = await db.select().from(couples).where(eq(couples.id, session.coupleId)).limit(1);
  const p1Name = couple?.partner1Name || "Époux";
  const p2Name = couple?.partner2Name || "Épouse";
  const [existing] = await db
    .select()
    .from(gameSessions)
    .where(and(eq(gameSessions.coupleId, session.coupleId), eq(gameSessions.gameType, gameType)))
    .limit(1);

  const state = initialState(gameType, p1Name, p2Name);
  if (!existing) {
    const [created] = await db
      .insert(gameSessions)
      .values({
        coupleId: session.coupleId,
        gameType,
        gameState: state,
        mode: "couple",
        aiLevel: "moyen",
        turn: "partner1",
        score1: 0,
        score2: 0,
        status: "ongoing",
        roomCode: `WM-${Math.floor(1000 + Math.random() * 9000)}`,
      })
      .returning();
    return Response.json({ success: true, session: created });
  }

  const [updated] = await db
    .update(gameSessions)
    .set({
      gameState: state,
      mode: "couple",
      aiLevel: "moyen",
      turn: "partner1",
      score1: 0,
      score2: 0,
      status: "ongoing",
      winner: null,
      lastMoveAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(gameSessions.id, existing.id))
    .returning();
  return Response.json({ success: true, session: updated });
}
