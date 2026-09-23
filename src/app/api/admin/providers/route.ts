import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { providers, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

async function logAudit(adminId: number | undefined, providerId: number, action: string, details: string) {
  try {
    await db.insert(auditLogs).values({
      adminId: adminId || null,
      coupleId: null as unknown as number,
      action,
      details,
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
  const q = searchParams.get("q");

  let list = await db.select().from(providers).orderBy(desc(providers.createdAt));

  if (status && status !== "all") {
    list = list.filter((p) => p.status === status);
  }

  if (q) {
    const term = q.toLowerCase();
    list = list.filter(
      (p) =>
        p.businessName.toLowerCase().includes(term) ||
        p.contactName.toLowerCase().includes(term) ||
        p.service.toLowerCase().includes(term) ||
        p.city.toLowerCase().includes(term) ||
        p.whatsapp.toLowerCase().includes(term)
    );
  }

  return Response.json({ success: true, providers: list });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Accès administrateur requis" }, { status: 403 });
  }

  const body = await req.json();
  const { id, action, status, adminNotes } = body;

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  const [existing] = await db.select().from(providers).where(eq(providers.id, Number(id))).limit(1);
  if (!existing) {
    return Response.json({ success: false, message: "Prestataire introuvable" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  // Boutons rapides : approve / reject / suspend, sur le même modèle que les paiements
  if (action === "approve") {
    updates.status = "approved";
  } else if (action === "reject") {
    updates.status = "rejected";
  } else if (action === "suspend") {
    updates.status = "suspended";
  } else if (status) {
    updates.status = status;
  }

  if (adminNotes !== undefined) updates.adminNotes = adminNotes;
  updates.reviewedAt = new Date();
  updates.reviewedBy = session.adminId || null;

  await logAudit(
    session.adminId,
    Number(id),
    "provider_" + (updates.status || "update"),
    "Prestataire \"" + existing.businessName + "\" : statut passé à \"" + (updates.status || existing.status) + "\"."
  );

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
  await logAudit(session.adminId, Number(id), "delete_provider", "Fiche prestataire supprimée par l'administrateur.");
  await db.delete(providers).where(eq(providers.id, Number(id)));

  return Response.json({ success: true, message: "Fiche prestataire supprimée avec succès." });
}