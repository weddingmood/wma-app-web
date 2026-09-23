import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { refuserSiEssaiExpire } from "@/lib/access-guard";
import { eq, asc, and } from "drizzle-orm";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const coupleMsgs = await db
    .select()
    .from(messages)
    .where(eq(messages.coupleId, session.coupleId))
    .orderBy(asc(messages.createdAt));

  // Auto mark incoming messages as read
  const otherPartner = session.activePartner === "partner1" ? "partner2" : "partner1";
  await db
    .update(messages)
    .set({ isRead: true })
    .where(and(eq(messages.coupleId, session.coupleId), eq(messages.senderId, otherPartner)));

  return Response.json({ success: true, messages: coupleMsgs });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }
  const blocageEcriture = await refuserSiEssaiExpire(session.coupleId);
  if (blocageEcriture) return blocageEcriture;

  const body = await req.json();
  const { text, attachmentUrl, attachmentType, sentOffline, localId } = body;

  if (!text && !attachmentUrl) {
    return Response.json({ success: false, message: "Message vide." }, { status: 400 });
  }

  const [newMsg] = await db
    .insert(messages)
    .values({
      coupleId: session.coupleId,
      senderId: session.activePartner,
      text: text || "",
      attachmentUrl: attachmentUrl || null,
      attachmentType: attachmentType || null,
      sentOffline: Boolean(sentOffline),
      localId: localId || null,
      isRead: false,
    })
    .returning();

  return Response.json({ success: true, message: newMsg });
}

