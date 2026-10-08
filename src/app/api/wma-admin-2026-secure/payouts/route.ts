import { sql } from "drizzle-orm";
import { db } from "@/db";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>;
function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }

export async function GET() {
  try {
    const thresholdRow = rowsOf(await db.execute(sql`select value from site_settings where key = 'payout_threshold' limit 1`))[0];
    const threshold = thresholdRow? Number(thresholdRow.value) : 5000;
    // on affiche tout, meme < seuil, pour que tu voies Raph
    const ambassadors = rowsOf(await db.execute(sql`select id, name, referral_slug, city, balance, total_clients, total_paid, whatsapp_number, phone from ambassadors where COALESCE(balance,0) >= ${threshold} and is_active = true order by balance desc`));
    const all = rowsOf(await db.execute(sql`select id, name, referral_slug, balance, total_clients, whatsapp_number, phone, city from ambassadors where COALESCE(balance,0) > 0 order by balance desc limit 200`));
    let history: Row[] = [];
    try { history = rowsOf(await db.execute(sql`select p.*, a.name as ambassador_name from ambassador_payouts p left join ambassadors a on a.id = p.ambassador_id order by p.created_at desc limit 100`)); } catch { history = []; }
    return Response.json({ success: true, threshold, toPay: ambassadors, history, all });
  } catch (e) {
    return Response.json({ success: false, message: (e as Error).message }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const { ambassadorId, amount, proofUrl, notes } = await req.json();
    if (!ambassadorId ||!amount) return Response.json({ success: false, message: "Donnees manquantes" }, { status: 400 });
    // creation auto de la table si elle manque
    await db.execute(sql`CREATE TABLE IF NOT EXISTS ambassador_payouts (id SERIAL PRIMARY KEY, ambassador_id INTEGER REFERENCES ambassadors(id), amount INTEGER NOT NULL, proof_url TEXT, notes TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    await db.execute(sql`INSERT INTO ambassador_payouts (ambassador_id, amount, proof_url, notes) VALUES (${Number(ambassadorId)}, ${Number(amount)}, ${proofUrl || null}, ${notes || null})`);
    await db.execute(sql`UPDATE ambassadors SET balance = COALESCE(balance,0) - ${Number(amount)}, total_paid = COALESCE(total_paid,0) + ${Number(amount)} WHERE id = ${Number(ambassadorId)}`);
    return Response.json({ success: true });
  } catch (e) { return Response.json({ success: false, message: (e as Error).message }, { status: 500 }); }
}