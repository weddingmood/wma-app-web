import { sql } from "drizzle-orm";
import { db } from "@/db";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>;
function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }

export async function GET(req: Request) {
  const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase();
  if (!code) return Response.json({ success: false, message: "Code manquant" }, { status: 400 });
  try {
    const amb = rowsOf(await db.execute(sql`SELECT id, name, referral_slug, city, balance, total_clicks, total_clients, total_paid, is_active FROM ambassadors WHERE code_unique = ${code} LIMIT 1`))[0];
    if (!amb) return Response.json({ success: false, message: "Code introuvable" }, { status: 404 });
    if (!amb.is_active) return Response.json({ success: false, message: "Compte désactivé" }, { status: 403 });

    const payouts = rowsOf(await db.execute(sql`SELECT amount, proof_url, notes, created_at FROM ambassador_payouts WHERE ambassador_id = ${Number(amb.id)} ORDER BY created_at DESC LIMIT 20`));
    const clients = rowsOf(await db.execute(sql`SELECT couple_name, amount, commission_amount, status, created_at FROM payments WHERE ambassador_id = ${Number(amb.id)} ORDER BY created_at DESC LIMIT 30`));

    return Response.json({
      success: true,
      ambassador: {
        name: String(amb.name), slug: String(amb.referral_slug || ""), city: String(amb.city || ""),
        balance: Number(amb.balance || 0), totalClicks: Number(amb.total_clicks || 0),
        totalClients: Number(amb.total_clients || 0), totalPaid: Number(amb.total_paid || 0)
      },
      payouts, clients
    });
  } catch (e) {
    return Response.json({ success: false, message: (e as Error).message }, { status: 500 });
  }
}