import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { seedDatabaseIfEmpty } from "@/lib/seed";

export async function GET(req: Request) {
  await seedDatabaseIfEmpty();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const slug = searchParams.get("slug");

  if (slug) {
    const [article] = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
    if (!article) return Response.json({ success: false, message: "Article introuvable" }, { status: 404 });
    return Response.json({ success: true, article });
  }

  let list = await db.select().from(articles);
  if (category && category !== "all") {
    list = list.filter((a) => a.category === category);
  }

  return Response.json({ success: true, articles: list });
}

