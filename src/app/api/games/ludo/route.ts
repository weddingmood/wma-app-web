import { randomInt } from "crypto";
import { cookies } from "next/headers";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { couples, gameHistory, gameSessions } from "@/db/schema";
import { getCurrentSession } from "@/lib/auth-helpers";
import { createInitialLudoGame, type LudoGameState } from "@/lib/ludo-engine";
import { moveForPlayer, rollForPlayer } from "@/lib/ludo-online";

// Type de partie distinct de "ludo" : les parties locales existantes ne sont pas touchées.
const GAME_TYPE = "ludo_online";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getPlayer() {
  // Pas de partie en ligne sans vraie session (on ignore le couple de démonstration)
  const cookieStore = await cookies();
  if (!cookieStore.get("wm_session")?.value) return null;

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

function toView(
  row: typeof gameSessions.$inferSelect,
  partner: string
) {
  return {
    success: true,
    changed: true,
    you: partner,
    version: row.updatedAt.toISOString(),
    status: row.status,
    turn: row.turn,
    winner: row.winner,
    game: row.gameState as LudoGameState,
  };
}

async function findRow(tx: Tx, coupleId: number, lock: boolean) {
  const base = tx
    .select()
    .from(gameSessions)
    .where(and(eq(gameSessions.coupleId, coupleId), eq(gameSessions.gameType, GAME_TYPE)))
    .orderBy(desc(gameSessions.id))
    .limit(1);
  const [row] = lock ? await base.for("update") : await base;
  return row;
}

async function createRow(tx: Tx, coupleId: number) {
  const { p1, p2 } = await coupleNames(coupleId);
  const state = createInitialLudoGame("couple", p1, p2);
  const now = new Date();
  const [row] = await tx
    .insert(gameSessions)
    .values({
      coupleId,
      gameType: GAME_TYPE,
      gameState: state,
      mode: "online",
      turn: "partner1",
      score1: 0,
      score2: 0,
      status: "ongoing",
      roomCode: "WM-" + randomInt(1000, 10000),
      lastMoveAt: now,
      updatedAt: now,
    })
    .returning();
  return row;
}

// Lecture de la partie (utilisée par le téléphone toutes les 2 secondes)
export async function GET(req: Request) {
  const player = await getPlayer();
  if (!player) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");

  const row = await db.transaction(async (tx) => {
    const found = await findRow(tx, player.coupleId, false);
    return found ?? (await createRow(tx, player.coupleId));
  });

  if (since && since === row.updatedAt.toISOString()) {
    return Response.json({
      success: true,
      changed: false,
      you: player.partner,
      version: since,
    });
  }
  return Response.json(toView(row, player.partner));
}

// Actions : roll (lancer le dé), move (déplacer un pion), new (nouvelle partie)
export async function POST(req: Request) {
  const player = await getPlayer();
  if (!player) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  try {
    const result = await db.transaction(async (tx) => {
      let row = await findRow(tx, player.coupleId, true);
      if (!row) row = await createRow(tx, player.coupleId);

      const state = row.gameState as LudoGameState;
      let next: LudoGameState;

      if (action === "new") {
        if (row.status !== "finished" && body?.force !== true) {
          return { error: "La partie n'est pas terminée.", status: 409 as number };
        }
        const { p1, p2 } = await coupleNames(player.coupleId);
        next = createInitialLudoGame("couple", p1, p2);
      } else if (action === "roll") {
        const outcome = rollForPlayer(state, player.partner, randomInt(1, 7));
        if (!outcome.ok) return { error: outcome.message, status: outcome.status };
        next = outcome.state;
      } else if (action === "move") {
        const outcome = moveForPlayer(state, player.partner, Number(body?.tokenId));
        if (!outcome.ok) return { error: outcome.message, status: outcome.status };
        next = outcome.state;
      } else {
        return { error: "Action inconnue.", status: 400 as number };
      }

      const now = new Date();
      const active = next.players[next.activePlayerIndex];
      const winnerKey = next.winner === "terracotta" ? "partner1" : next.winner ? "partner2" : null;

      const [updated] = await tx
        .update(gameSessions)
        .set({
          gameState: next,
          turn: active?.id ?? "partner1",
          score1: next.players[0]?.tokensAtGoal ?? 0,
          score2: next.players[1]?.tokensAtGoal ?? 0,
          status: next.status,
          winner: winnerKey,
          lastMoveAt: now,
          updatedAt: now,
        })
        .where(eq(gameSessions.id, row.id))
        .returning();

      // Fin de partie : on garde le résultat dans l'historique, comme les autres jeux
      if (row.status !== "finished" && next.status === "finished") {
        await tx.insert(gameHistory).values({
          coupleId: player.coupleId,
          gameType: "ludo",
          mode: "online",
          player1Name: next.players[0]?.name,
          player2Name: next.players[1]?.name,
          score1: next.players[0]?.tokensAtGoal ?? 0,
          score2: next.players[1]?.tokensAtGoal ?? 0,
          winner: winnerKey ?? "draw",
          durationSeconds: 0,
          details: { online: true, turns: next.history.length },
        });
      }

      return { row: updated };
    });

    if ("error" in result) {
      return Response.json({ success: false, message: result.error }, { status: result.status });
    }
    return Response.json(toView(result.row, player.partner));
  } catch (err) {
    console.error("Erreur Ludo en ligne:", err);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
