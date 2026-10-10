import { sql } from "drizzle-orm";
import { db } from "@/db";
import { adminOu401 } from "@/lib/platform";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const rowsOf = (res: unknown): Row[] => (Array.isArray(res) ? (res as Row[]) : ((res as { rows?: Row[] })?.rows ?? []));
const bad = (message: string, status = 400) => Response.json({ success: false, message }, { status });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let ready = false;
let extended = false;
async function ensure() {
  if (ready) return;
  try {
    await db.execute(sql`alter table partenaires add column if not exists type text not null default 'logo'`);
    await db.execute(sql`alter table partenaires add column if not exists video_url text`);
    extended = true;
  } catch {
    extended = false;
  }
  ready = true;
}

export async function GET() {
  const { reponse } = await adminOu401();
  if (reponse) return reponse;
  try {
    await ensure();
    const rows = rowsOf(await db.execute(sql`select * from partenaires order by order_index asc, created_at asc`));
    return Response.json({ success: true, partenaires: rows });
  } catch (e) {
    return bad("Erreur serveur : " + (e as Error).message, 500);
  }
}

export async function POST(req: Request) {
  const { reponse } = await adminOu401();
  if (reponse) return reponse;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const name = String(b.name ?? "").trim().slice(0, 120);
  if (name.length < 2) return bad("Le nom du partenaire est obligatoire.");
  const type = ["logo", "document", "video"].includes(String(b.type)) ? String(b.type) : "logo";
  const logo = String(b.logo_url ?? "").trim().slice(0, 1000) || null;
  const video = String(b.video_url ?? "").trim().slice(0, 500) || null;
  if (type !== "video" && !logo) return bad("Ajoutez d'abord le fichier (logo ou document).");
  if (type === "video" && !video) return bad("Collez le lien YouTube.");
  const website = String(b.website ?? b.website_url ?? "").trim().slice(0, 300) || null;
  if (website && !/^https?:\/\//i.test(website)) return bad("Le site web doit commencer par http:// ou https://");
  const orderRaw = Number(b.order_index);
  const order = Number.isFinite(orderRaw) ? Math.max(0, Math.floor(orderRaw)) : 0;
  const active = b.is_active !== false;

  try {
    await ensure();
    if (extended) {
      await db.execute(sql`insert into partenaires (name, logo_url, website, order_index, is_active, type, video_url) values (${name}, ${logo}, ${website}, ${order}, ${active}, ${type}, ${video})`);
    } else {
      await db.execute(sql`insert into partenaires (name, logo_url, website, order_index, is_active) values (${name}, ${logo}, ${website}, ${order}, ${active})`);
    }
    return Response.json({ success: true });
  } catch (e) {
    console.error("Partenaires (ajout):", e);
    return bad("Erreur serveur : " + (e as Error).message, 500);
  }
}

export async function PATCH(req: Request) {
  const { reponse } = await adminOu401();
  if (reponse) return reponse;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(b.id ?? "");
  if (!UUID.test(id)) return bad("Identifiant invalide.");
  try {
    if (b.is_active !== undefined) {
      await db.execute(sql`update partenaires set is_active = ${b.is_active === true} where id = ${id}::uuid`);
    }
    if (b.order_index !== undefined) {
      const o = Number(b.order_index);
      const order = Number.isFinite(o) ? Math.max(0, Math.floor(o)) : 0;
      await db.execute(sql`update partenaires set order_index = ${order} where id = ${id}::uuid`);
    }
    return Response.json({ success: true });
  } catch (e) {
    console.error("Partenaires (modification):", e);
    return bad("Erreur serveur : " + (e as Error).message, 500);
  }
}

export async function DELETE(req: Request) {
  const { reponse } = await adminOu401();
  if (reponse) return reponse;
  const id = String(new URL(req.url).searchParams.get("id") ?? "");
  if (!UUID.test(id)) return bad("Identifiant invalide.");
  try {
    await db.execute(sql`delete from partenaires where id = ${id}::uuid`);
    return Response.json({ success: true });
  } catch (e) {
    console.error("Partenaires (suppression):", e);
    return bad("Erreur serveur : " + (e as Error).message, 500);
  }
}