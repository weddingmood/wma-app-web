import { put } from "@vercel/blob";
import { adminOu401 } from "@/lib/platform";

export const dynamic = "force-dynamic";

const MAX = 4 * 1024 * 1024;
const OK = /^(image\/(jpeg|png|webp|gif)|application\/pdf|video\/(mp4|webm))$/;

const fail = (message: string, status = 400) => Response.json({ success: false, message }, { status });

export async function POST(req: Request) {
  const { reponse } = await adminOu401();
  if (reponse) return reponse;
  try {
    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) return fail("Fichier manquant.");
    if (file.size > MAX) return fail("Fichier trop lourd (4 Mo maximum).", 413);
    if (!OK.test(file.type)) return fail("Format non pris en charge : utilisez JPG, PNG, WEBP, GIF, PDF, MP4 ou WEBM.");
    const folder = String(fd.get("folder") || "divers").replace(/[^a-z0-9_-]/gi, "").slice(0, 30) || "divers";
    const ext = (file.name.split(".").pop() || "bin").replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
    const blob = await put(folder + "/" + Date.now() + "." + ext, file, { access: "public", contentType: file.type, addRandomSuffix: true });
    return Response.json({ success: true, url: blob.url });
  } catch (e) {
    console.error("Envoi de fichier:", e);
    return fail("Envoi impossible : " + (e as Error).message, 500);
  }
}