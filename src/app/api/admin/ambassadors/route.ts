import { sql } from "drizzle-orm";
import { randomBytes, randomInt, scryptSync } from "crypto";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function rowsOf(res: unknown): Row[] {
  if (Array.isArray(res)) return res as Row[];
  const r = res as { rows?: Row[] };
  return r?.rows ?? [];
}

async function adminOnly() {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Acc\u00e8s administrateur requis" }, { status: 403 });
  }
  return null;
}

const bad = (message: string, status = 400) => Response.json({ success: false, message }, { status });

const METHODS = ["wave", "orange_money", "mtn_money", "moov_money", "airtel_money", "mpesa", "virement"];
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const LIST_COLUMNS = sql`id, name, ambassador_code, code_unique, referral_slug, country_slug, city, bio, photo_url, phone,
  payment_method, payment_number, payout_day, is_featured, is_active, total_clicks, total_clients, balance,
  total_sales, total_commissions, last_sale_at, last_payout_at, last_payout_amount, created_at`;

function fold(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function randomChars(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += ALPHABET[randomInt(0, ALPHABET.length)];
  return s;
}

function newPin(): string {
  return String(randomInt(0, 10000)).padStart(4, "0");
}

function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(pin, salt, 32).toString("hex");
}

async function setSetting(key: string, value: string) {
  try {
    const u = rowsOf(await db.execute(sql`update site_settings set value = ${value} where key = ${key} returning key`));
    if (u.length === 0) await db.execute(sql`insert into site_settings (key, value) values (${key}, ${value})`);
  } catch {
    const u = rowsOf(await db.execute(sql`update site_settings set value = to_jsonb(${value}::text) where key = ${key} returning key`));
    if (u.length === 0) await db.execute(sql`insert into site_settings (key, value) values (${key}, to_jsonb(${value}::text))`);
  }
}

export async function GET() {
  const denied = await adminOnly();
  if (denied) return denied;
  try {
    const ambassadors = rowsOf(await db.execute(sql`select ${LIST_COLUMNS} from ambassadors order by created_at desc limit 500`));
    const settingRows = rowsOf(await db.execute(sql`select key, value from site_settings`));
    const settings: Record<string, string> = { commission_rate: "15", payout_min_balance: "10000", payout_day: "5" };
    for (const r of settingRows) settings[String(r.key)] = String(r.value);
    const countries = rowsOf(await db.execute(sql`select slug, name, flag from countries where is_active = true order by order_index, name`));
    return Response.json({ success: true, ambassadors, settings, countries });
  } catch (error) {
    console.error("Erreur admin ambassadeurs (lecture):", error);
    return bad("Erreur serveur", 500);
  }
}

export async function POST(req: Request) {
  const denied = await adminOnly();
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const name = String(body.name ?? "").trim().slice(0, 100);
  const countrySlug = String(body.countrySlug ?? "").trim().toLowerCase();
  const city = String(body.city ?? "").trim().slice(0, 80);
  const bio = String(body.bio ?? "").trim().slice(0, 500);
  const phone = String(body.phone ?? "").replace(/[^0-9+ ]/g, "").slice(0, 25);
  const photoUrl = String(body.photoUrl ?? "").trim() || null;
  const paymentMethod = METHODS.includes(String(body.paymentMethod)) ? String(body.paymentMethod) : "wave";
  const paymentNumber = String(body.paymentNumber ?? "").replace(/[^0-9+ ]/g, "").slice(0, 25);
  const payoutDay = Number(body.payoutDay);
  const payoutDayValue = Number.isInteger(payoutDay) && payoutDay >= 1 && payoutDay <= 7 ? payoutDay : 5;
  const isFeatured = body.isFeatured === true;

  if (name.length < 2 || !city) return bad("Le nom et la ville sont obligatoires.");

  try {
    const country = rowsOf(await db.execute(sql`select slug from countries where slug = ${countrySlug} and is_active = true limit 1`))[0];
    if (!country) return bad("Pays inconnu ou inactif.");

    const first = name.split(/\s+/)[0];
    const letters = fold(first).replace(/[^A-Za-z]/g, "").toUpperCase() || "AMB";
    const slugBase = fold(first).toLowerCase().replace(/[^a-z0-9]/g, "") || "ambassadeur";
    const cityCode = (fold(city).replace(/[^A-Za-z]/g, "").toUpperCase() + "XXX").slice(0, 3);
    const countRow = rowsOf(await db.execute(sql`select count(*)::int as n from ambassadors where country_slug = ${countrySlug} and city = ${city}`))[0];
    const baseSeq = Number(countRow?.n ?? 0) + 1;

    const pin = newPin();
    const pinHash = hashPin(pin);

    let created: Row | null = null;
    let lastErr = "";
    for (let attempt = 0; attempt < 6 && !created; attempt++) {
      const codeUnique = "WM-" + letters + "-" + randomChars(3);
      const slug = attempt === 0 ? slugBase : slugBase + randomInt(10, 100);
      const ambCode = "AMB-" + countrySlug.toUpperCase() + "-" + cityCode + "-" + String(baseSeq + attempt).padStart(3, "0");
      try {
        const res = await db.execute(sql`
          insert into ambassadors (name, ambassador_code, code_unique, referral_slug, country_slug, city, phone, bio, photo_url,
            payment_method, payment_number, payout_day, pin_hash, is_featured, is_active, total_clicks, total_clients, balance, total_sales, total_commissions)
          values (${name}, ${ambCode}, ${codeUnique}, ${slug}, ${countrySlug}, ${city}, ${phone || null}, ${bio || null}, ${photoUrl},
            ${paymentMethod}, ${paymentNumber || null}, ${payoutDayValue}, ${pinHash}, ${isFeatured}, true, 0, 0, 0, 0, 0)
          returning ${LIST_COLUMNS}
        `);
        created = rowsOf(res)[0] ?? null;
      } catch (e) {
        created = null;
        lastErr = (e as Error).message;
      }
    }
    if (!created) return bad("Cr\u00e9ation impossible : " + (lastErr || "r\u00e9essayez"), 500);
    return Response.json({ success: true, ambassador: created, pin });
  } catch (error) {
    console.error("Erreur admin ambassadeurs (creation):", error);
    return bad("Erreur serveur", 500);
  }
}

export async function PATCH(req: Request) {
  const denied = await adminOnly();
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    if (body.action === "settings") {
      const rate = Number(body.commissionRate);
      const min = Number(body.payoutMinBalance);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100 || !Number.isFinite(min) || min < 0) {
        return bad("Commission entre 0 et 100, seuil positif.");
      }
      await setSetting("commission_rate", String(rate));
      await setSetting("payout_min_balance", String(Math.round(min)));
      return Response.json({ success: true });
    }

    const id = Number(body.id);
    if (!Number.isInteger(id)) return bad("Identifiant invalide.");

    if (body.action === "reset-pin") {
      const pin = newPin();
      await db.execute(sql`update ambassadors set pin_hash = ${hashPin(pin)} where id = ${id}`);
      return Response.json({ success: true, pin });
    }

    const cur = rowsOf(await db.execute(sql`select * from ambassadors where id = ${id} limit 1`))[0];
    if (!cur) return bad("Ambassadeur introuvable.", 404);

    const bio = body.bio !== undefined ? String(body.bio).trim().slice(0, 500) : (cur.bio as string | null);
    const photoUrl = body.photoUrl !== undefined ? (String(body.photoUrl).trim() || null) : (cur.photo_url as string | null);
    const city = body.city !== undefined ? String(body.city).trim().slice(0, 80) : (cur.city as string | null);
    const paymentMethod = body.paymentMethod !== undefined && METHODS.includes(String(body.paymentMethod)) ? String(body.paymentMethod) : (cur.payment_method as string);
    const paymentNumber = body.paymentNumber !== undefined ? String(body.paymentNumber).replace(/[^0-9+ ]/g, "").slice(0, 25) : (cur.payment_number as string | null);
    const dayRaw = Number(body.payoutDay);
    const payoutDay = body.payoutDay !== undefined && Number.isInteger(dayRaw) && dayRaw >= 1 && dayRaw <= 7 ? dayRaw : (cur.payout_day as number);
    const isFeatured = body.isFeatured !== undefined ? body.isFeatured === true : (cur.is_featured as boolean);
    const isActive = body.isActive !== undefined ? body.isActive === true : (cur.is_active as boolean);

    await db.execute(sql`
      update ambassadors set bio = ${bio}, photo_url = ${photoUrl}, city = ${city}, payment_method = ${paymentMethod},
        payment_number = ${paymentNumber}, payout_day = ${payoutDay}, is_featured = ${isFeatured}, is_active = ${isActive}
      where id = ${id}
    `);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur admin ambassadeurs (modification):", error);
    return bad("Erreur serveur : " + (error as Error).message, 500);
  }
}

export async function DELETE(req: Request) {
  const denied = await adminOnly();
  if (denied) return denied;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return bad("Identifiant invalide.");
  try {
    const res = await db.execute(sql`delete from ambassadors where id = ${id} and total_clients = 0 and balance = 0 returning id`);
    if (rowsOf(res).length === 0) {
      return bad("Suppression refus\u00e9e : cet ambassadeur a des clients ou un solde. D\u00e9sactivez-le plut\u00f4t.", 409);
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur admin ambassadeurs (suppression):", error);
    return bad("Erreur serveur", 500);
  }
}