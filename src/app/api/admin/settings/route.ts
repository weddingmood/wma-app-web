import { adminOu401 } from "@/lib/platform";
import { ALL_KEYS, readSettings, writeSettings } from "@/lib/wma-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const { reponse } = await adminOu401();
  if (reponse) return reponse;
  return Response.json({ success: true, values: await readSettings(ALL_KEYS) });
}

export async function PATCH(req: Request) {
  const { reponse } = await adminOu401();
  if (reponse) return reponse;
  const body = (await req.json().catch(() => ({}))) as { values?: Record<string, unknown> };
  const clean: Record<string, string> = {};
  for (const k of ALL_KEYS) {
    const v = body.values?.[k];
    if (typeof v === "string") clean[k] = v.slice(0, 20000);
  }
  if (clean.faq !== undefined) {
    let ok = false;
    try { ok = Array.isArray(JSON.parse(clean.faq)); } catch { ok = false; }
    if (!ok) return Response.json({ success: false, message: "FAQ invalide" }, { status: 400 });
  }
  try {
    await writeSettings(clean);
    return Response.json({ success: true });
  } catch (e) {
    console.error("Enregistrement parametres:", e);
    return Response.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}