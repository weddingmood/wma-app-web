import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function rowsOf(res: unknown): Row[] {
  if (Array.isArray(res)) return res as Row[];
  const r = res as { rows?: Row[] };
  return r?.rows ?? [];
}

async function adminSession() {
  const session = await getCurrentSession();
  return session?.isAdmin ? session : null;
}

const denied = () => Response.json({ success: false, message: "Acc\u00e8s administrateur requis" }, { status: 403 });
const bad = (message: string, status = 400) => Response.json({ success: false, message }, { status });

const STATUSES = ["en_attente", "envoye", "paye", "echoue"];
const dateOk = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function GET(req: Request) {
  const session = await adminSession();
  if (!session) return denied();

  const url = new URL(req.url);
  const includeBelow = url.searchParams.get("includeBelow") === "1";
  const ambassadorId = Number(url.searchParams.get("ambassadorId"));
  const status = url.searchParams.get("status") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const country = (url.searchParams.get("country") || "").toLowerCase();

  try {
    const minRow = rowsOf(await db.execute(sql`select value from site_settings where key = 'payout_min_balance' limit 1`))[0];
    const minParsed = minRow ? Number(minRow.value) : 10000;
    const min = Number.isFinite(minParsed) ? minParsed : 10000;
    const threshold = includeBelow ? 1 : min;

    const due = rowsOf(
      await db.execute(sql`
        select id, name, photo_url, country_slug, city, payment_method, payment_number, payout_day, balance, last_payout_at, last_payout_amount
        from ambassadors where is_active = true and balance >= ${threshold}
        order by balance desc limit 500
      `)
    );

    const conds = [sql`true`];
    if (Number.isInteger(ambassadorId) && ambassadorId > 0) conds.push(sql`p.ambassador_id = ${ambassadorId}`);
    if (STATUSES.includes(status)) conds.push(sql`p.status = ${status}`);
    if (dateOk(from)) conds.push(sql`p.created_at >= ${from}::date`);
    if (dateOk(to)) conds.push(sql`p.created_at < (${to}::date + 1)`);
    if (country) conds.push(sql`a.country_slug = ${country}`);

    const history = rowsOf(
      await db.execute(sql`
        select p.id, p.amount, p.payment_method, p.payment_number, p.status, p.payout_date, p.proof_image, p.notes, p.created_at,
          a.name, a.country_slug
        from payouts p join ambassadors a on a.id = p.ambassador_id
        where ${sql.join(conds, sql` and `)}
        order by p.created_at desc limit 300
      `)
    );

    const ambassadors = rowsOf(await db.execute(sql`select id, name, country_slug from ambassadors order by name limit 500`));
    const week = rowsOf(
      await db.execute(sql`select coalesce(sum(amount), 0) as total, count(*)::int as n from payouts where status = 'paye' and created_at >= date_trunc('week', now())`)
    )[0];

    return Response.json({
      success: true,
      minBalance: min,
      due,
      history,
      ambassadors,
      paidThisWeek: { total: Number(week?.total ?? 0), count: Number(week?.n ?? 0) },
    });
  } catch (error) {
    console.error("Erreur admin paiements ambassadeurs (lecture):", error);
    return bad("Erreur serveur", 500);
  }
}

export async function POST(req: Request) {
  const session = await adminSession();
  if (!session) return denied();

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const ambassadorId = Number(body.ambassadorId);
  const amount = Number(body.amount);
  const notes = String(body.notes ?? "").trim().slice(0, 500);
  const proof = String(body.proofImage ?? "").trim().slice(0, 500) || null;
  if (!Number.isInteger(ambassadorId) || !Number.isInteger(amount) || amount < 1) return bad("Montant ou ambassadeur invalide.");

  try {
    const result = await db.transaction(async (tx) => {
      const cur = rowsOf(
        await tx.execute(sql`select id, name, balance, payment_method, payment_number from ambassadors where id = ${ambassadorId} for update`)
      )[0];
      if (!cur) return { error: "Ambassadeur introuvable.", status: 404 };
      const balance = Number(cur.balance);
      if (amount > balance) return { error: "Le montant d\u00e9passe le solde (" + balance + " F).", status: 409 };

      await tx.execute(sql`
        update ambassadors set balance = balance - ${amount}, last_payout_at = now(), last_payout_amount = ${amount}
        where id = ${ambassadorId}
      `);
      await tx.execute(sql`
        insert into payouts (ambassador_id, amount, payment_method, payment_number, status, payout_date, proof_image, notes)
        values (${ambassadorId}, ${amount}, ${String(cur.payment_method ?? "")}, ${cur.payment_number ? String(cur.payment_number) : null}, 'paye', now(), ${proof}, ${notes || null})
      `);
      await tx.execute(sql`
        insert into audit_logs (admin_id, action, details)
        values (${session.adminId ?? null}, 'ambassador_payout', ${"Paiement de " + amount + " F \u00e0 " + String(cur.name) + " (" + String(cur.payment_method) + ")"})
      `);
      return { ok: true as const };
    });
    if ("error" in result) return bad(result.error ?? "Erreur", result.status ?? 400);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur admin paiements ambassadeurs (paiement):", error);
    return bad("Erreur serveur", 500);
  }
}