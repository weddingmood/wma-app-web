import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { decisions, notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const decs = await db
    .select()
    .from(decisions)
    .where(eq(decisions.coupleId, session.coupleId))
    .orderBy(desc(decisions.createdAt));

  return Response.json({ success: true, decisions: decs });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, amount, proposalDetails, initialComment } = body;

  if (!title) {
    return Response.json({ success: false, message: "Titre requis" }, { status: 400 });
  }

  const isP1 = session.activePartner === "partner1";

  const [newDec] = await db
    .insert(decisions)
    .values({
      coupleId: session.coupleId,
      title,
      description: description || "",
      amount: Number(amount) || 0,
      proposalDetails: proposalDetails || "",
      status: "pending",
      partner1Decision: isP1 ? "approved" : "pending",
      partner2Decision: !isP1 ? "approved" : "pending",
      partner1Comment: isP1 ? initialComment || "" : null,
      partner2Comment: !isP1 ? initialComment || "" : null,
      createdBy: session.activePartner,
    })
    .returning();

  // Notify other partner
  await db.insert(notifications).values({
    coupleId: session.coupleId,
    recipient: isP1 ? "partner2" : "partner1",
    title: "Nouvelle décision de couple à trancher",
    message: `${session.partnerName} a ouvert la décision "${title}".`,
    type: "decision",
    linkUrl: "/dashboard/decisions",
  });

  return Response.json({ success: true, decision: newDec });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { id, partnerDecision, comment } = body;

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(decisions)
    .where(and(eq(decisions.id, Number(id)), eq(decisions.coupleId, session.coupleId)))
    .limit(1);

  if (!existing) {
    return Response.json({ success: false, message: "Décision introuvable" }, { status: 404 });
  }

  const isP1 = session.activePartner === "partner1";
  const p1Dec = isP1 ? partnerDecision : existing.partner1Decision;
  const p2Dec = !isP1 ? partnerDecision : existing.partner2Decision;
  const p1Com = isP1 ? comment : existing.partner1Comment;
  const p2Com = !isP1 ? comment : existing.partner2Comment;

  let overallStatus = existing.status;
  if (p1Dec === "approved" && p2Dec === "approved") {
    overallStatus = "approved";
  } else if (p1Dec === "rejected" || p2Dec === "rejected") {
    overallStatus = "rejected";
  } else {
    overallStatus = "pending";
  }

  const [updated] = await db
    .update(decisions)
    .set({
      partner1Decision: p1Dec,
      partner2Decision: p2Dec,
      partner1Comment: p1Com,
      partner2Comment: p2Com,
      status: overallStatus,
      decidedAt: overallStatus === "approved" ? new Date() : null,
    })
    .where(eq(decisions.id, Number(id)))
    .returning();

  return Response.json({ success: true, decision: updated });
}

