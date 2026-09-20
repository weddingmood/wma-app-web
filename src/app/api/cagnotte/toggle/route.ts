import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invitations } from "@/db/schema";
import { getCurrentSession } from "@/lib/auth-helpers";

export async function PATCH(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session?.coupleId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const isVisible = Boolean(body?.isVisible);

    const updated = await db
      .update(invitations)
      .set({ showCagnotte: isVisible })
      .where(eq(invitations.coupleId, session.coupleId))
      .returning({ showCagnotte: invitations.showCagnotte });

    if (updated.length === 0) {
      return NextResponse.json({ error: "Cagnotte introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true, isVisible: updated[0].showCagnotte });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
