import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { gameHistory } from "@/db/schema";
import { desc, count, sql } from "drizzle-orm";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Accès administrateur requis" }, { status: 403 });
  }

  // Fetch all game history records
  const allHistory = await db
    .select()
    .from(gameHistory)
    .orderBy(desc(gameHistory.completedAt))
    .limit(100);

  // Statistics per game type
  const totalMatches = allHistory.length;
  const ludoMatches = allHistory.filter((h) => h.gameType === "ludo").length;
  const awaleMatches = allHistory.filter((h) => h.gameType === "awale").length;
  const damesMatches = allHistory.filter((h) => h.gameType === "dames").length;
  const motsMatches = allHistory.filter((h) => h.gameType === "mots").length;

  return Response.json({
    success: true,
    totalMatches,
    breakdown: {
      ludo: ludoMatches,
      awale: awaleMatches,
      dames: damesMatches,
      mots: motsMatches,
    },
    recentGames: allHistory,
  });
}

