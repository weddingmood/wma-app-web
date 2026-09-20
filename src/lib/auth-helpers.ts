import { cookies } from "next/headers";
import { db } from "@/db";
import { couples, admins } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

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

  if (adminToken) {
    try {
      const decoded = JSON.parse(Buffer.from(adminToken, "base64").toString("utf8"));
      const [admin] = await db.select().from(admins).where(eq(admins.id, decoded.adminId)).limit(1);
      if (admin) {
        return {
          isAdmin: true,
          adminId: admin.id,
          activePartner: "partner1",
          partnerName: admin.name,
        };
      }
    } catch {
      // ignore token parse error
    }
  }

  if (sessionToken) {
    try {
      const decoded = JSON.parse(Buffer.from(sessionToken, "base64").toString("utf8"));
      const [couple] = await db.select().from(couples).where(eq(couples.id, decoded.coupleId)).limit(1);
      if (couple) {
        const activePartner = decoded.activePartner === "partner2" ? "partner2" : "partner1";
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

  // Fallback: If no session cookie is present, get the default demo couple (Époux & Épouse)
  // so the application is immediately interactive and persistent out of the box
  const [defaultCouple] = await db.select().from(couples).limit(1);
  if (defaultCouple) {
    return {
      coupleId: defaultCouple.id,
      coupleSlug: defaultCouple.slug,
      activePartner: "partner1",
      partnerName: defaultCouple.partner1Name,
      isAdmin: false,
    };
  }

  return null;
}

