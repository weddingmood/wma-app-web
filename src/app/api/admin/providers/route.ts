import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { providers, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

async function logAudit(adminId: number | undefined, providerId: number, action: string, details: string) {
  try {
    await db.insert(auditLogs).values({
      adminId: adminId || null,
      coupleId: null,
      action,
      details: `[prestataire #${providerId}] ${details}`,
    });
  } catch {
    // L'audit ne doit jamais bloquer l'action principale
  }
}

export async function GET(req: Request) {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Accès administrateur requis" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let list = await db.select().from(providers).orderBy(desc(providers.createdAt));

  if (status && status !== "all") {
    list = list.filter((p) => p.status === status);
  }

  return Response.json({ success: true, providers: list });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Accès administrateur requis" }, { status: 403 });
  }

  const body = await req.json();
  const { id, action, adminNotes } = body;

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  const [existing] = await db.select().from(providers).where(eq(providers.id, Number(id))).limit(1);
  if (!existing) {
    return Response.json({ success: false, message: "Prestataire introuvable" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (action === "approve") {
    updates.status = "approved";
    updates.reviewedAt = new Date();
    updates.reviewedBy = session.adminId || null;
    await logAudit(session.adminId, Number(id), "approve_provider", `${existing.businessName} validé et visible publiquement.`);
  } else if (action === "reject") {
    updates.status = "rejected";
    updates.reviewedAt = new Date();
    updates.reviewedBy = session.adminId || null;
    await logAudit(session.adminId, Number(id), "reject_provider", `${existing.businessName} refusé.`);
  } else if (action === "suspend") {
    updates.status = "suspended";
    updates.reviewedAt = new Date();
    updates.reviewedBy = session.adminId || null;
    await logAudit(session.adminId, Number(id), "suspend_provider", `${existing.businessName} suspendu.`);
  } else if (action === "reactivate") {
    updates.status = "approved";
    await logAudit(session.adminId, Number(id), "reactivate_provider", `${existing.businessName} réactivé.`);
  } else {
    return Response.json({ success: false, message: "Action non reconnue" }, { status: 400 });
  }

  if (adminNotes !== undefined) updates.adminNotes = adminNotes;

  const [updated] = await db
    .update(providers)
    .set(updates)
    .where(eq(providers.id, Number(id)))
    .returning();

  return Response.json({ success: true, provider: updated });
}

export async function DELETE(req: Request) {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Accès administrateur requis" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  const [existing] = await db.select().from(providers).where(eq(providers.id, Number(id))).limit(1);
  await logAudit(session.adminId, Number(id), "delete_provider", `${existing?.businessName || "Prestataire"} supprimé définitivement.`);
  await db.delete(providers).where(eq(providers.id, Number(id)));
  return Response.json({ success: true, message: "Prestataire supprimé." });
}