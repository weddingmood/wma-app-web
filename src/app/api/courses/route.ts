import { db } from "@/db";
import { courses } from "@/db/schema";
import { asc } from "drizzle-orm";
import { seedDatabaseIfEmpty } from "@/lib/seed";

export async function GET() {
  await seedDatabaseIfEmpty();
  const list = await db.select().from(courses).orderBy(asc(courses.orderIndex));
  return Response.json({ success: true, courses: list });
}
