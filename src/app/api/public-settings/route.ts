import { PUBLIC_KEYS, readSettings } from "@/lib/wma-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ success: true, values: await readSettings(PUBLIC_KEYS) });
}