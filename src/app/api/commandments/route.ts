import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { coupleCommandments } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { DEFAULT_COMMANDMENTS } from "@/lib/constants";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  let cmds = await db
    .select()
    .from(coupleCommandments)
    .where(eq(coupleCommandments.coupleId, session.coupleId))
    .orderBy(asc(coupleCommandments.orderIndex));

  // If empty, seed default for couple
  if (cmds.length === 0) {
    for (const d of DEFAULT_COMMANDMENTS) {
      await db.insert(coupleCommandments).values({
        coupleId: session.coupleId,
        orderIndex: d.id,
        text: d.text,
        importanceWhy: d.importanceWhy,
        commitmentText: d.commitmentText,
        partner1Confirmed: true,
        partner2Confirmed: false,
      });
    }
    cmds = await db
      .select()
      .from(coupleCommandments)
      .where(eq(coupleCommandments.coupleId, session.coupleId))
      .orderBy(asc(coupleCommandments.orderIndex));
  }

  const bothConfirmedCount = cmds.filter((c) => c.partner1Confirmed && c.partner2Confirmed).length;
  const progressPercent = Math.round((bothConfirmedCount / 10) * 100);

  return Response.json({
    success: true,
    commandments: cmds,
    stats: {
      total: cmds.length,
      bothConfirmedCount,
      progressPercent,
    },
  });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { action, text, importanceWhy, commitmentText, orderIndex } = body;

  if (action === "reset-default") {
    await db.delete(coupleCommandments).where(eq(coupleCommandments.coupleId, session.coupleId));
    for (const d of DEFAULT_COMMANDMENTS) {
      await db.insert(coupleCommandments).values({
        coupleId: session.coupleId,
        orderIndex: d.id,
        text: d.text,
        importanceWhy: d.importanceWhy,
        commitmentText: d.commitmentText,
        partner1Confirmed: true,
        partner2Confirmed: false,
      });
    }
    return Response.json({ success: true, message: "10 Commandements réinitialisés avec succès." });
  }

  if (!text) {
    return Response.json({ success: false, message: "Texte obligatoire." }, { status: 400 });
  }

  const [newCmd] = await db
    .insert(coupleCommandments)
    .values({
      coupleId: session.coupleId,
      orderIndex: Number(orderIndex) || 11,
      text,
      importanceWhy: importanceWhy || "",
      commitmentText: commitmentText || "",
      partner1Confirmed: session.activePartner === "partner1",
      partner2Confirmed: session.activePartner === "partner2",
    })
    .returning();

  return Response.json({ success: true, commandment: newCmd });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { id, action, text, importanceWhy, commitmentText } = body;

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(coupleCommandments)
    .where(and(eq(coupleCommandments.id, Number(id)), eq(coupleCommandments.coupleId, session.coupleId)))
    .limit(1);

  if (!existing) {
    return Response.json({ success: false, message: "Commandement introuvable" }, { status: 404 });
  }

  if (action === "toggle-confirmation") {
    const isP1 = session.activePartner === "partner1";
    const [updated] = await db
      .update(coupleCommandments)
      .set({
        partner1Confirmed: isP1 ? !existing.partner1Confirmed : existing.partner1Confirmed,
        partner2Confirmed: !isP1 ? !existing.partner2Confirmed : existing.partner2Confirmed,
      })
      .where(eq(coupleCommandments.id, Number(id)))
      .returning();

    return Response.json({ success: true, commandment: updated });
  }

  // Edit commandment content
  const [updated] = await db
    .update(coupleCommandments)
    .set({
      text: text !== undefined ? text : existing.text,
      importanceWhy: importanceWhy !== undefined ? importanceWhy : existing.importanceWhy,
      commitmentText: commitmentText !== undefined ? commitmentText : existing.commitmentText,
    })
    .where(eq(coupleCommandments.id, Number(id)))
    .returning();

  return Response.json({ success: true, commandment: updated });
}

export async function DELETE(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ success: false, message: "ID requis" }, { status: 400 });
  }

  await db.delete(coupleCommandments).where(and(eq(coupleCommandments.id, Number(id)), eq(coupleCommandments.coupleId, session.coupleId)));
  return Response.json({ success: true, message: "Commandement supprimé" });
}

