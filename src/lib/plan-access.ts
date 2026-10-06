import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { couples } from "@/db/schema";
import { getCurrentSession } from "@/lib/auth-helpers";

// Complement Standard -> Premium (lien Wave existant)
export const PREMIUM_UPGRADE_URL = "https://pay.wave.com/m/M_W9fOyOGfFiNN/c/ci/?amount=2000";

// Formules sans acces aux traiteurs ni aux livres.
// "couple" (ancienne formule) et "individual" gardent l'acces actuel.
const RESTRICTED_PLANS = ["standard_couple"];

export async function coupleHasPremiumContent(coupleId: number): Promise<boolean> {
  const [row] = await db
    .select({ planType: couples.planType })
    .from(couples)
    .where(eq(couples.id, coupleId))
    .limit(1);
  const plan = row?.planType ?? "couple";
  return !RESTRICTED_PLANS.includes(plan);
}

// Pour les routes publiques : visiteur non connecte ou couple Standard = pas d'acces
export async function premiumContentAccess(): Promise<{ allowed: boolean; signedIn: boolean }> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wm_session")?.value) return { allowed: false, signedIn: false };
  const session = await getCurrentSession();
  if (!session?.coupleId) return { allowed: false, signedIn: false };
  return { allowed: await coupleHasPremiumContent(session.coupleId), signedIn: true };
}