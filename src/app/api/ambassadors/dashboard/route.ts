import { sql } from "drizzle-orm";
import { db } from "@/db";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>;
function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }
function pick(r: Row,...keys: string[]) { for (const k of keys) if (k in r && r[k]!= null) return r[k]; return 0; }

export async function GET(req: Request) {
  const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase();
  if (!code) return Response.json({ success: false, message: "Code manquant" }, { status: 400 });
  try {
    // SELECT * pour ne plus planter si une colonne manque
    const list = rowsOf(await db.execute(sql`SELECT * FROM ambassadors WHERE code_unique = ${code} LIMIT 1`));
    const amb = list[0];
    if (!amb) return Response.json({ success: false, message: "Code introuvable." }, { status: 404 });

    // is_active peut s'appeler is_active ou active
    const isActive = (amb.is_active as boolean)?? (amb.active as boolean)?? true;
    if (isActive === false) return Response.json({ success: false, message: "Compte désactivé" }, { status: 403 });

    // on lit avec fallback sur tous les noms possibles
    const balance = Number(pick(amb, "balance", "solde") || 0);
    const clicks = Number(pick(amb, "total_clicks", "total_clics", "clicks", "clics") || 0);
    const clients = Number(pick(amb, "total_clients", "clients") || 0);
    const paid = Number(pick(amb, "total_paid", "total_paye") || 0);
    const name = String(amb.name || "Ambassadeur");
    const slug = String((amb.referral_slug as string) || (amb.slug as string) || "");
    const city = String((amb.city as string) || (amb.ville as string) || "");

    let payouts: Row[] = [];
    try { payouts = rowsOf(await db.execute(sql`SELECT * FROM ambassador_payouts WHERE ambassador_id = ${Number(amb.id)} ORDER BY created_at DESC LIMIT 20`)); } catch { payouts = []; }

    let clientsList: Row[] = [];
    try { clientsList = rowsOf(await db.execute(sql`SELECT * FROM payments WHERE ambassador_id = ${Number(amb.id)} ORDER BY created_at DESC LIMIT 30`)); } catch { clientsList = []; }

    return Response.json({
      success: true,
      ambassador: { name, slug, city, balance, totalClicks: clicks, totalClients: clients, totalPaid: paid },
      payouts, clients: clientsList
    });
  } catch (e) {
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}