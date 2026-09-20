import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { auditLogs, couples, admins } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Accès administrateur requis" }, { status: 403 });
  }

  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
  const coupleList = await db.select().from(couples);
  const adminList = await db.select().from(admins);
  const coupleMap = new Map(coupleList.map((c) => [c.id, `${c.partner1Name} & ${c.partner2Name}`]));
  const adminMap = new Map(adminList.map((a) => [a.id, a.name]));

  return Response.json({
    success: true,
    logs: logs.map((l) => ({
      ...l,
      coupleName: l.coupleId ? coupleMap.get(l.coupleId) || `Couple #${l.coupleId}` : "—",
      adminName: l.adminId ? adminMap.get(l.adminId) || `Admin #${l.adminId}` : "Système",
    })),
  });
}

