import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { gameSessions, gameHistory, couples } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createInitialAwaleState } from "@/lib/awale-engine";
import { createInitialCheckersState } from "@/lib/checkers-engine";
import { createInitialLudoGame } from "@/lib/ludo-engine";
import { createInitialWordGameState } from "@/lib/word-engine";

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

  const p1Name = couple?.partner1Name || "David";
  const p2Name = couple?.partner2Name || "Ruth";

  // Fetch past match history for the couple
  const historyRecords = await db
    .select()
    .from(gameHistory)
    .where(eq(gameHistory.coupleId, session.coupleId))
    .orderBy(desc(gameHistory.completedAt))
    .limit(50);

  // Compute player statistics
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

  // Get active session for requested game
  const [existing] = await db
    .select()
    .from(gameSessions)
    .where(
      and(
        eq(gameSessions.coupleId, session.coupleId),
        eq(gameSessions.gameType, gameType)
      )
    )
    .limit(1);

  if (existing) {
    return Response.json({
      success: true,
      session: existing,
      couplePlayers: { p1Name, p2Name },
      history: historyRecords.slice(0, 10),
      stats: {
        totalGames,
        p1Wins,
        p2Wins,
        statsByGame,
      },
    });
  }

  // Initialize brand new session with proper game engine
  let initialGameState: Record<string, unknown> = {};

  if (gameType === "awale") {
    initialGameState = createInitialAwaleState("couple", "moyen", false) as unknown as Record<string, unknown>;
  } else if (gameType === "dames") {
    initialGameState = createInitialCheckersState("couple", "moyen") as unknown as Record<string, unknown>;
  } else if (gameType === "ludo") {
    initialGameState = createInitialLudoGame("couple", p1Name, p2Name) as unknown as Record<string, unknown>;
  } else if (gameType === "mots") {
    initialGameState = createInitialWordGameState("couple") as unknown as Record<string, unknown>;
  } else {
    initialGameState = createInitialLudoGame("couple", p1Name, p2Name) as unknown as Record<string, unknown>;
  }

  const [newSession] = await db
    .insert(gameSessions)
    .values({
      coupleId: session.coupleId,
      gameType,
      gameState: initialGameState,
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
    stats: {
      totalGames,
      p1Wins,
      p2Wins,
      statsByGame,
    },
  });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const {
    gameType,
    action,
    stateUpdates,
    newTurn,
    score1,
    score2,
    score1Delta,
    score2Delta,
    winner,
    mode,
    aiLevel,
    durationSeconds,
    matchDetails,
  } = body;

  const [couple] = await db
    .select()
    .from(couples)
    .where(eq(couples.id, session.coupleId))
    .limit(1);

  const p1Name = couple?.partner1Name || "David";
  const p2Name = couple?.partner2Name || "Ruth";

  // Check if match was completed to save into gameHistory
  if (action === "finish_match" || (winner && winner !== null)) {
    await db.insert(gameHistory).values({
      coupleId: session.coupleId,
      gameType: gameType || "ludo",
      mode: mode || "couple",
      player1Name: p1Name,
      player2Name: mode === "ai" ? "Ordinateur" : p2Name,
      score1: score1 !== undefined ? Number(score1) : 0,
      score2: score2 !== undefined ? Number(score2) : 0,
      winner: winner || "draw",
      durationSeconds: Number(durationSeconds) || 120,
      details: matchDetails || null,
    });
  }

  const [existing] = await db
    .select()
    .from(gameSessions)
    .where(
      and(
        eq(gameSessions.coupleId, session.coupleId),
        eq(gameSessions.gameType, gameType)
      )
    )
    .limit(1);

  // Reset action
  if (action === "reset") {
    let freshState: Record<string, unknown> = {};
    if (gameType === "awale") {
      freshState = createInitialAwaleState(mode || "couple", aiLevel || "moyen", false) as unknown as Record<string, unknown>;
    } else if (gameType === "dames") {
      freshState = createInitialCheckersState(mode || "couple", aiLevel || "moyen") as unknown as Record<string, unknown>;
    } else if (gameType === "ludo") {
      freshState = createInitialLudoGame(mode || "couple", p1Name, p2Name) as unknown as Record<string, unknown>;
    } else if (gameType === "mots") {
      freshState = createInitialWordGameState(mode || "couple") as unknown as Record<string, unknown>;
    }

    if (existing) {
      const [updated] = await db
        .update(gameSessions)
        .set({
          gameState: freshState,
          mode: mode || existing.mode,
          aiLevel: aiLevel || existing.aiLevel,
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
  }

  if (!existing) {
    const [created] = await db
      .insert(gameSessions)
      .values({
        coupleId: session.coupleId,
        gameType,
        gameState: stateUpdates || {},
        mode: mode || "couple",
        aiLevel: aiLevel || "moyen",
        turn: newTurn || "partner1",
        score1: score1 !== undefined ? Number(score1) : Number(score1Delta) || 0,
        score2: score2 !== undefined ? Number(score2) : Number(score2Delta) || 0,
        status: winner ? "finished" : "ongoing",
        winner: winner || null,
        roomCode: `WM-${Math.floor(1000 + Math.random() * 9000)}`,
        lastMoveAt: new Date(),
      })
      .returning();

    return Response.json({ success: true, session: created });
  }

  const finalScore1 =
    score1 !== undefined
      ? Number(score1)
      : (existing.score1 || 0) + (Number(score1Delta) || 0);

  const finalScore2 =
    score2 !== undefined
      ? Number(score2)
      : (existing.score2 || 0) + (Number(score2Delta) || 0);

  const mergedState = {
    ...(existing.gameState as object),
    ...(stateUpdates || {}),
  };

  const [updated] = await db
    .update(gameSessions)
    .set({
      gameState: mergedState,
      mode: mode || existing.mode,
      aiLevel: aiLevel || existing.aiLevel,
      turn: newTurn !== undefined ? newTurn : existing.turn,
      score1: finalScore1,
      score2: finalScore2,
      status: winner ? "finished" : existing.status,
      winner: winner !== undefined ? winner : existing.winner,
      lastMoveAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(gameSessions.id, existing.id))
    .returning();

  return Response.json({ success: true, session: updated });
}
