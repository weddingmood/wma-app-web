import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { calendarEvents, tasks } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  // Fetch registered calendar events
  const directEvents = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.coupleId, session.coupleId))
    .orderBy(asc(calendarEvents.eventDate));

  // Also fetch couple tasks that have a dueDate to guarantee integration
  const coupleTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.coupleId, session.coupleId));

  const taskEvents = coupleTasks
    .filter((t) => t.dueDate && t.dueDate.trim().length >= 8)
    .map((t) => ({
      id: 100000 + t.id,
      coupleId: t.coupleId,
      title: `[Tâche] ${t.title}`,
      description: t.description || `Responsable : ${t.assignee === "both" ? "Nous deux" : t.assignee}`,
      eventDate: t.dueDate!,
      startTime: "09:00",
      endTime: "10:00",
      location: "Préparatifs",
      category: "tache",
      reminderMinutes: 60,
      linkedTaskId: t.id,
      isTaskLinked: true,
      isCompleted: t.status === "completed",
      createdBy: t.createdBy,
      createdAt: t.createdAt,
    }));

  const allEvents = [...directEvents, ...taskEvents].sort((a, b) =>
    a.eventDate.localeCompare(b.eventDate)
  );

  return Response.json({ success: true, events: allEvents });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, eventDate, startTime, endTime, location, category, reminderMinutes } = body;

  if (!title || !eventDate) {
    return Response.json({ success: false, message: "Titre et date obligatoires" }, { status: 400 });
  }

  const [newEvent] = await db
    .insert(calendarEvents)
    .values({
      coupleId: session.coupleId,
      title,
      description: description || "",
      eventDate,
      startTime: startTime || "",
      endTime: endTime || "",
      location: location || "",
      category: category || "rendez_vous",
      reminderMinutes: Number(reminderMinutes) || 60,
      createdBy: session.activePartner,
    })
    .returning();

  return Response.json({ success: true, event: newEvent });
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

  const numericId = Number(id);
  if (numericId >= 100000) {
    // Linked task event - delete not directly allowed on calendar route
    return Response.json({ success: true, message: "Événement lié à une tâche" });
  }

  await db
    .delete(calendarEvents)
    .where(and(eq(calendarEvents.id, numericId), eq(calendarEvents.coupleId, session.coupleId)));

  return Response.json({ success: true, message: "Événement supprimé" });
}

