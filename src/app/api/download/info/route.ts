import { stat } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const version = process.env.NEXT_PUBLIC_APK_VERSION || "1.0.0";
  const packageName = process.env.NEXT_PUBLIC_ANDROID_PACKAGE || "ci.weddingmood.app";
  const fileName = `wedding-mood-v${version}.apk`;
  let sizeBytes: number | null = null;
  let available = false;
  try {
    const info = await stat(path.join(process.cwd(), "public", "downloads", fileName));
    sizeBytes = info.size;
    available = true;
  } catch {
    available = false;
  }
  return Response.json({
    success: true,
    app: "Wedding Mood",
    version,
    versionCode: 1,
    packageName,
    fileName,
    downloadUrl: "/api/download/apk",
    sizeBytes,
    minAndroid: "Android 9 (API 28+)",
    method: "TWA Bubblewrap + PWA",
  });
}

