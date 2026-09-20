import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { timelineEvents } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const events = await db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.coupleId, session.coupleId))
    .orderBy(asc(timelineEvents.orderIndex));

  return Response.json({ success: true, timeline: events });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { id, isCompleted } = body;

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  const [updated] = await db
    .update(timelineEvents)
    .set({ isCompleted })
    .where(and(eq(timelineEvents.id, Number(id)), eq(timelineEvents.coupleId, session.coupleId)))
    .returning();

  return Response.json({ success: true, event: updated });
}

