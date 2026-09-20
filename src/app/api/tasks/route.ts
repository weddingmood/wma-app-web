import { getCurrentSession } from "@/lib/auth-helpers";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  let query = db.select().from(tasks).where(eq(tasks.coupleId, session.coupleId));
  const allTasks = await query.orderBy(desc(tasks.createdAt));

  let filtered = allTasks;
  if (category && category !== "all") {
    filtered = filtered.filter((t) => t.category === category);
  }
  if (status && status !== "all") {
    filtered = filtered.filter((t) => t.status === status);
  }

  return Response.json({ success: true, tasks: filtered });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, category, assignee, dueDate, priority, status, budgetEstimated, budgetActual, comments } = body;

  if (!title) {
    return Response.json({ success: false, message: "Le titre de la tâche est obligatoire." }, { status: 400 });
  }

  const [newTask] = await db
    .insert(tasks)
    .values({
      coupleId: session.coupleId,
      title,
      description: description || "",
      category: category || "general",
      assignee: assignee || "both",
      dueDate: dueDate || "",
      priority: priority || "medium",
      status: status || "todo",
      budgetEstimated: Number(budgetEstimated) || 0,
      budgetActual: Number(budgetActual) || 0,
      comments: comments || "",
      createdBy: session.activePartner,
    })
    .returning();

  return Response.json({ success: true, task: newTask });
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  const [updatedTask] = await db
    .update(tasks)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, Number(id)), eq(tasks.coupleId, session.coupleId)))
    .returning();

  return Response.json({ success: true, task: updatedTask });
}

export async function DELETE(req: Request) {
  const session = await getCurrentSession();
  if (!session?.coupleId) {
    return Response.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ success: false, message: "ID manquant" }, { status: 400 });
  }

  await db.delete(tasks).where(and(eq(tasks.id, Number(id)), eq(tasks.coupleId, session.coupleId)));
  return Response.json({ success: true, message: "Tâche supprimée" });
}

