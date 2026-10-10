import { sql } from "drizzle-orm";
import { db } from "@/db";
import { adminOu401 } from "@/lib/platform";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const rowsOf = (res: unknown): Row[] => (Array.isArray(res) ? (res as Row[]) : ((res as { rows?: Row[] })?.rows ?? []));

const KEYS = ["header_video", "footer_about", "footer_contact", "footer_legal", "footer_social"];

export async function GET() {
  const { reponse } = await adminOu401();
  if (reponse) return reponse;
  try {
    const rows = rowsOf(await db.execute(sql`select id, key, value from site_contents order by key`));
    const contents = rows.map((r) => {
      const v = (r.value && typeof r.value === "object" ? r.value : {}) as Record<string, unknown>;
      return {
        id: r.id,
        key: String(r.key),
        title: String(v.title ?? ""),
        content: String(v.content ?? ""),
        media_url: String(v.media_url ?? ""),
        is_active: v.is_active !== false,
      };
    });
    return Response.json({ success: true, contents });
  } catch (e) {
    console.error("Contenus (lecture):", e);
    return Response.json({ success: false, message: "Erreur serveur : " + (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { reponse } = await adminOu401();
  if (reponse) return reponse;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const key = String(body.key || "");
  if (!KEYS.includes(key)) return Response.json({ success: false, message: "Cl\u00e9 inconnue." }, { status: 400 });

  const value = {
    title: String(body.title ?? "").slice(0, 200),
    content: String(body.content ?? "").slice(0, 20000),
    media_url: String(body.media_url ?? "").slice(0, 1000),
    is_active: body.is_active !== false,
  };
  const json = JSON.stringify(value);

  try {
    const done = rowsOf(await db.execute(sql`update site_contents set value = ${json}::jsonb, updated_at = now() where key = ${key} returning key`));
    if (done.length === 0) await db.execute(sql`insert into site_contents (key, value) values (${key}, ${json}::jsonb)`);
    return Response.json({ success: true });
  } catch (e) {
    console.error("Contenus (enregistrement):", e);
    return Response.json({ success: false, message: "Erreur serveur : " + (e as Error).message }, { status: 500 });
  }
}