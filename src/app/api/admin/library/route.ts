import { desc, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/db";
import { libraryBooks } from "@/db/schema";
import { getCurrentSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const CATEGORIES = ["mariage", "communication", "finances", "purete", "priere", "documents"];

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
  const books = await db.select().from(libraryBooks).orderBy(desc(libraryBooks.createdAt));
  return Response.json({ success: true, books });
}

export async function POST(req: Request) {
  const denied = await adminOnly();
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const author = typeof body.author === "string" ? body.author.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category : "";
  const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl : "";
  const coverUrl = typeof body.coverUrl === "string" && body.coverUrl ? body.coverUrl : null;

  if (!title || !author || !description || !fileUrl || !CATEGORIES.includes(category)) {
    return Response.json({ success: false, message: "Champs obligatoires manquants." }, { status: 400 });
  }

  const [book] = await db
    .insert(libraryBooks)
    .values({ title, author, description, category, fileUrl, coverUrl, accessLevel: "all" })
    .returning();
  return Response.json({ success: true, book });
}

export async function DELETE(req: Request) {
  const denied = await adminOnly();
  if (denied) return denied;

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) {
    return Response.json({ success: false, message: "ID invalide." }, { status: 400 });
  }
  const [row] = await db.select().from(libraryBooks).where(eq(libraryBooks.id, id)).limit(1);
  if (!row) return Response.json({ success: false, message: "Introuvable." }, { status: 404 });

  await db.delete(libraryBooks).where(eq(libraryBooks.id, id));
  for (const url of [row.fileUrl, row.coverUrl]) {
    if (url) {
      try {
        await del(url);
      } catch {
        // le fichier reste sur le stockage, la fiche est bien supprimee
      }
    }
  }
  return Response.json({ success: true });
}