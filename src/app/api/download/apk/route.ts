import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const APK_VERSION = process.env.NEXT_PUBLIC_APK_VERSION || "1.0.0";
const APK_FILE = `wedding-mood-v${APK_VERSION}.apk`;

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "downloads", APK_FILE);
    const [file, info] = await Promise.all([readFile(filePath), stat(filePath)]);
    const body = new Uint8Array(file);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Length": String(info.size),
        "Content-Disposition": `attachment; filename="${APK_FILE}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return Response.json(
      { success: false, message: "Fichier APK indisponible pour le moment." },
      { status: 404 }
    );
  }
}
