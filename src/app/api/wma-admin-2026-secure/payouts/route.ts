import { sql } from "drizzle-orm";
import { db } from "@/db";
export const dynamic = "force-dynamic";
type Row = Record<string, unknown>;
function rowsOf(res: unknown): Row[] { if (Array.isArray(res)) return res as Row[]; const r = res as { rows?: Row[] }; return r?.rows?? []; }

export async function GET() {
  try {
    const thresholdRow = rowsOf(await db.execute(sql`select value from site_settings where key = 'payout_threshold' limit 1`))[0];
    const threshold = thresholdRow? Number(thresholdRow.value) : 5000;
    const ambassadors = rowsOf(await db.execute(sql`
      select id, name, referral_slug, city, phone, balance, total_clients, photo_url
      from ambassadors where balance >= ${threshold} and is_active = true
      order by balance desc
    `));
    const history = rowsOf(await db.execute(sql`
      select p.*, a.name as ambassador_name from ambassador_payouts p
      left join ambassadors a on a.id = p.ambassador_id
      order by p.created_at desc limit 100
    `));
    const all = rowsOf(await db.execute(sql`select id, name, balance, phone from ambassadors where balance > 0 order by balance desc limit 200`));
    return Response.json({ success: true, threshold, toPay: ambassadors, history, all });
  } catch (e) {
    return Response.json({ success: false, message: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { ambassadorId, amount, proofUrl, notes } = await req.json();
    if (!ambassadorId ||!amount) return Response.json({ success: false, message: "Données manquantes" }, { status: 400 });

    await db.execute(sql`
      insert into ambassador_payouts (ambassador_id, amount, proof_url, notes)
      values (${Number(ambassadorId)}, ${Number(amount)}, ${proofUrl || null}, ${notes || null})
    `);
    await db.execute(sql`
      update ambassadors set balance = balance - ${Number(amount)}, total_paid = COALESCE(total_paid,0) + ${Number(amount)}
      where id = ${Number(ambassadorId)}
    `);
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false, message: (e as Error).message }, { status: 500 });
  }
}