"use server";

import { db } from "@/db";
import { messages } from "@/db/schema";
import { insertMessageSchema } from "@/db/zod-schemas";
import { revalidatePath } from "next/cache";

export async function sendMessage(formData: { coupleId: number; senderId: string; content: string }) {
  try {
    // Validation des donn?es avec le sch?ma Zod g?n?r?
    const validatedData = insertMessageSchema.parse({
      coupleId: formData.coupleId,
      senderId: formData.senderId,
      content: formData.content,
    });

    // Insertion du message en base via Drizzle
    const [newMessage] = await db
      .insert(messages)
      .values(validatedData)
      .returning();

    // Revalidation du chemin de messagerie
    revalidatePath("/dashboard/messages");

    return { success: true, data: newMessage };
  } catch (error: any) {
    console.error("Erreur lors de l'envoi du message:", error);
    return { success: false, error: error?.message || "Impossible d'envoyer le message." };
  }
}

