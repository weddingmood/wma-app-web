import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

// Supabase recommande le Transaction Pooler pour les fonctions serverless Vercel.
// DATABASE_URL reste la variable standard, avec SUPABASE_DATABASE_URL comme alias explicite.
const databaseCandidates: string[] = [];

for (const value of [
  process.env.SUPABASE_DATABASE_URL,
  process.env.DATABASE_URL,
]) {
  const trimmed = value?.trim();
  if (!trimmed) continue;

  try {
    const protocol = new URL(trimmed).protocol;

    if (protocol === "postgres:" || protocol === "postgresql:") {
      databaseCandidates.push(trimmed);
    }
  } catch {
    // Ignorer une variable mal formée et essayer l'autre.
  }
}

const databaseUrl = databaseCandidates[0];

if (!databaseUrl) {
  throw new Error("A valid PostgreSQL URL is required");
}

const isSupabaseUrl = databaseUrl.includes("supabase") || databaseUrl.includes("pooler.supabase.com");
const globalForDb = globalThis as typeof globalThis & {
  __weddingMoodSql?: ReturnType<typeof postgres>;
};

export const client =
  globalForDb.__weddingMoodSql ??
  postgres(databaseUrl, {
    // Transaction Pooler Supabase does not support prepared statements.
    prepare: false,
    // Vercel functions should keep a very small client pool per warm instance.
    max: process.env.VERCEL ? 1 : 8,
    idle_timeout: 20,
    connect_timeout: 10,
    // Supabase impose SSL ; PostgreSQL local/Contabo peut rester en connexion interne.
    ssl: isSupabaseUrl ? "require" : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__weddingMoodSql = client;
}

export const db = drizzle(client);

