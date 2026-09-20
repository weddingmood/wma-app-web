import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { tasks, expenses, prayers, messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface SyncItem {
  id?: string | number;
  entity: "task" | "expense" | "prayer" | "message";
  action: "create" | "update" | "delete";
  data: Record<string, unknown>;
  timestamp: number;
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const queue: SyncItem[] = body.queue || [];

  const results = {
    processed: 0,
    errors: 0,
    syncedItems: [] as unknown[],
  };

  for (const item of queue) {
    try {
      if (item.entity === "task" && item.action === "create") {
        const [t] = await db
          .insert(tasks)
          .values({
            coupleId: session.coupleId,
            title: String(item.data.title || "Tâche"),
            description: String(item.data.description || ""),
            category: String(item.data.category || "general"),
            assignee: String(item.data.assignee || "both"),
            status: String(item.data.status || "todo"),
            dueDate: String(item.data.dueDate || ""),
            createdBy: session.activePartner,
          })
          .returning();
        results.syncedItems.push({ entity: "task", localId: item.id, serverId: t.id });
        results.processed++;
      } else if (item.entity === "message" && item.action === "create") {
        const [m] = await db
          .insert(messages)
          .values({
            coupleId: session.coupleId,
            senderId: session.activePartner,
            text: String(item.data.text || ""),
            sentOffline: true,
            localId: String(item.id || ""),
          })
          .returning();
        results.syncedItems.push({ entity: "message", localId: item.id, serverId: m.id });
        results.processed++;
      } else if (item.entity === "prayer" && item.action === "create") {
        const [p] = await db
          .insert(prayers)
          .values({
            coupleId: session.coupleId,
            title: String(item.data.title || "Prière"),
            prayerText: String(item.data.prayerText || ""),
            category: String(item.data.category || "couple"),
            prayerDate: new Date().toISOString().split("T")[0],
            createdBy: session.activePartner,
          })
          .returning();
        results.syncedItems.push({ entity: "prayer", localId: item.id, serverId: p.id });
        results.processed++;
      } else {
        results.processed++;
      }
    } catch (err) {
      console.error("Sync item error:", err);
      results.errors++;
    }
  }

  return Response.json({
    success: true,
    syncStatus: "Synchronisé",
    results,
    syncedAt: new Date().toISOString(),
  });
}

