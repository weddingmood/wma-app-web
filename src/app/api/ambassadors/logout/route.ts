import { cookies } from "next/headers";
import { AMB_COOKIE } from "@/lib/ambassador-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  (await cookies()).delete(AMB_COOKIE);
  return Response.json({ success: true });
}