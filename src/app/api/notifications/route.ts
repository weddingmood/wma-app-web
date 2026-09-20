import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, or, and } from "drizzle-orm";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const list = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.coupleId, session.coupleId),
        or(
          eq(notifications.recipient, "both"),
          eq(notifications.recipient, session.activePartner)
        )
      )
    )
    .orderBy(desc(notifications.createdAt));

  const unreadCount = list.filter((n) => !n.isRead).length;

  return Response.json({ success: true, notifications: list, unreadCount });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { id, action } = body;

  if (action === "mark-all-read") {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.coupleId, session.coupleId));
    return Response.json({ success: true, message: "Toutes les notifications sont marquées lues." });
  }

  if (id) {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, Number(id)), eq(notifications.coupleId, session.coupleId)))
      .returning();
    return Response.json({ success: true, notification: updated });
  }

  return Response.json({ success: false, message: "Invalide" }, { status: 400 });
}

