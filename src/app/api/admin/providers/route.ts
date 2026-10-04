import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { providers } from "@/db/schema";
import { getCurrentSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const STATUS_BY_ACTION: Record<string, string> = {
  approve: "approved",
  approved: "approved",
  restore: "approved",
  reject: "rejected",
  rejected: "rejected",
  suspend: "suspended",
  suspended: "suspended",
  pending: "pending",
};

async function adminOnly() {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Acc\u00e8s administrateur requis" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const denied = await adminOnly();
  if (denied) return denied;
  const list = await db.select().from(providers).orderBy(desc(providers.createdAt));
  return Response.json({ success: true, providers: list });
}

async function changeStatus(req: Request) {
  const denied = await adminOnly();
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = Number(body.id ?? body.providerId);
  const status = STATUS_BY_ACTION[String(body.action ?? body.status ?? "")];

  if (!Number.isInteger(id) || !status) {
    return Response.json({ success: false, message: "Requ\u00eate invalide." }, { status: 400 });
  }

  const now = new Date();
  const changes: { status: string; reviewedAt: Date; updatedAt: Date; adminNotes?: string } = {
    status,
    reviewedAt: now,
    updatedAt: now,
  };
  if (typeof body.adminNotes === "string") changes.adminNotes = body.adminNotes;

  const [updated] = await db.update(providers).set(changes).where(eq(providers.id, id)).returning();
  if (!updated) {
    return Response.json({ success: false, message: "Prestataire introuvable." }, { status: 404 });
  }
  return Response.json({ success: true, provider: updated });
}

export const POST = changeStatus;
export const PATCH = changeStatus;
export const PUT = changeStatus;