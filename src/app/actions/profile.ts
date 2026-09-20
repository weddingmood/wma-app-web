"use server";

import { db } from "@/db";
import { couples } from "@/db/schema";
import { insertCoupleSchema } from "@/db/zod-schemas";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateCoupleProfile(coupleId: number | string, formData: unknown) {
  try {
    const idAsNumber = typeof coupleId === "string" ? parseInt(coupleId, 10) : coupleId;

    if (isNaN(idAsNumber)) {
      return { success: false, error: "ID du couple invalide." };
    }

    // Validation partielle des donn?es envoy?es via Zod
    const partialSchema = insertCoupleSchema.partial();
    const validatedData = partialSchema.parse(formData);

    // Mise ? jour de la table couples dans Supabase via Drizzle
    const updatedCouple = await db
      .update(couples)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(couples.id, idAsNumber))
      .returning();

    // Rafra?chissement du cache Next.js de la page profil
    revalidatePath("/dashboard/profile");

    return { success: true, data: updatedCouple[0] };
  } catch (error: any) {
    console.error("Erreur mise ? jour profil:", error);
    return { success: false, error: error?.message || "Une erreur est survenue." };
  }
}

