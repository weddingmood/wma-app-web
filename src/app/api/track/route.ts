import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureVisitsTable } from "@/lib/visits";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|vercel/i;

export async function POST(req: Request) {
  try {
    if (BOT.test(req.headers.get("user-agent") || "")) return Response.json({ success: true });
    const body = (await req.json().catch(() => ({}))) as { path?: unknown; sid?: unknown; ref?: unknown };
    const path = String(body.path || "/").slice(0, 200);
    if (path.startsWith("/wma-admin-2026-secure") || path.startsWith("/api")) return Response.json({ success: true });
    const sid = String(body.sid || "").slice(0, 60);
    if (!sid) return Response.json({ success: true });
    const country = (req.headers.get("x-vercel-ip-country") || "").slice(0, 4).toUpperCase();
    const region = (req.headers.get("x-vercel-ip-country-region") || "").slice(0, 20);
    let city = req.headers.get("x-vercel-ip-city") || "";
    try { city = decodeURIComponent(city); } catch {}
    const ref = String(body.ref || "").slice(0, 200);
    await ensureVisitsTable();
    await db.execute(sql`insert into site_visits (session_id, path, country, region, city, referrer) values (${sid}, ${path}, ${country || null}, ${region || null}, ${city.slice(0, 80) || null}, ${ref || null})`);
    return Response.json({ success: true });
  } catch (e) {
    console.error("track:", e);
    return Response.json({ success: true });
  }
}