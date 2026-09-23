import { cookies } from "next/headers";
import { db } from "@/db";
import { couples, admins } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { verifyToken } from "@/lib/session-token";

export function hashPassword(plainText: string): string {
  return crypto.createHash("sha256").update(plainText).digest("hex");
}

export interface SessionData {
  coupleId?: number;
  coupleSlug?: string;
  activePartner: "partner1" | "partner2";
  partnerName: string;
  isAdmin?: boolean;
  adminId?: number;
}

export async function getCurrentSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("wm_session")?.value;
  const adminToken = cookieStore.get("wm_admin_session")?.value;

  // Les jetons sont signés : un cookie fabriqué ou modifié à la main est refusé.
  const adminDecoded = verifyToken<{ adminId: number }>(adminToken, "admin");
  if (adminDecoded) {
    try {
      const [admin] = await db.select().from(admins).where(eq(admins.id, adminDecoded.adminId)).limit(1);
      if (admin) {
        return {
          isAdmin: true,
          adminId: admin.id,
          activePartner: "partner1",
          partnerName: admin.name,
        };
      }
    } catch {
      // ignore token lookup error
    }
  }

  const coupleDecoded = verifyToken<{ coupleId: number; activePartner?: string }>(sessionToken, "couple");
  if (coupleDecoded) {
    try {
      const [couple] = await db.select().from(couples).where(eq(couples.id, coupleDecoded.coupleId)).limit(1);
      if (couple) {
        const activePartner = coupleDecoded.activePartner === "partner2" ? "partner2" : "partner1";
        const partnerName = activePartner === "partner2" ? couple.partner2Name : couple.partner1Name;
        return {
          coupleId: couple.id,
          coupleSlug: couple.slug,
          activePartner,
          partnerName,
          isAdmin: false,
        };
      }
    } catch {
      // ignore
    }
  }

  // Plus de "couple par défaut" : sans session valide, personne n'est connecté.
  return null;
}
