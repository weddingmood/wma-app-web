import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

function rowsOf(res: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(res)) return res as Array<Record<string, unknown>>;
  const r = res as { rows?: Array<Record<string, unknown>> };
  return r?.rows ?? [];
}

async function adminOnly() {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    return Response.json({ success: false, message: "Acc\u00e8s administrateur requis" }, { status: 403 });
  }
  return null;
}

const bad = (message: string) => Response.json({ success: false, message }, { status: 400 });

export async function GET() {
  const denied = await adminOnly();
  if (denied) return denied;
  try {
    const res = await db.execute(sql`
      select id, couple_id, couple_name, city, wedding_date, content, rating, status, created_at
      from testimonials
      order by (status = 'pending') desc, created_at desc
      limit 200
    `);
    return Response.json({ success: true, testimonials: rowsOf(res) });
  } catch (error) {
    console.error("Erreur admin temoignages (lecture):", error);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

// Ajout d'un avis recu hors de l'application, avec l'accord du couple
export async function POST(req: Request) {
  const denied = await adminOnly();
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const coupleName = String(body.coupleName ?? "").trim().slice(0, 80);
  const city = String(body.city ?? "").trim().slice(0, 60);
  const weddingDate = String(body.weddingDate ?? "").trim().slice(0, 40);
  const content = String(body.content ?? "").trim();
  const rating = Number(body.rating);
  if (body.consent !== true) return bad("Confirmez que le couple a donn\u00e9 son accord pour la publication.");
  if (!coupleName || content.length < 20 || content.length > 600 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return bad("Nom, note de 1 \u00e0 5 et texte de 20 \u00e0 600 caract\u00e8res obligatoires.");
  }
  try {
    await db.execute(sql`
      insert into testimonials (couple_id, couple_name, city, wedding_date, content, rating, status)
      values (null, ${coupleName}, ${city || null}, ${weddingDate || null}, ${content}, ${rating}, 'approved')
    `);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur admin temoignages (ajout):", error);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const denied = await adminOnly();
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = Number(body.id);
  const action = String(body.action ?? "");
  if (!Number.isInteger(id)) return bad("Identifiant invalide.");

  try {
    if (action === "approve" || action === "reject") {
      const status = action === "approve" ? "approved" : "rejected";
      await db.execute(sql`update testimonials set status = ${status} where id = ${id}`);
      return Response.json({ success: true });
    }
    if (action === "edit") {
      const coupleName = String(body.coupleName ?? "").trim().slice(0, 80);
      const city = String(body.city ?? "").trim().slice(0, 60);
      const content = String(body.content ?? "").trim();
      const rating = Number(body.rating);
      if (!coupleName || content.length < 20 || content.length > 600 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return bad("Nom, note de 1 \u00e0 5 et texte de 20 \u00e0 600 caract\u00e8res obligatoires.");
      }
      await db.execute(sql`
        update testimonials set couple_name = ${coupleName}, city = ${city || null}, content = ${content}, rating = ${rating}
        where id = ${id}
      `);
      return Response.json({ success: true });
    }
    return bad("Action inconnue.");
  } catch (error) {
    console.error("Erreur admin temoignages (modification):", error);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await adminOnly();
  if (denied) return denied;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return bad("Identifiant invalide.");
  try {
    await db.execute(sql`delete from testimonials where id = ${id}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur admin temoignages (suppression):", error);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}