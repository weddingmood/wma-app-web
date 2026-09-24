import { db } from "@/db";
import { providers } from "@/db/schema";
import { PROVIDER_SERVICES, PROVIDER_CITIES } from "@/lib/provider-constants";
import { eq } from "drizzle-orm";

const SERVICE_IDS = PROVIDER_SERVICES.map((s) => s.id);

export async function POST(req: Request) {
  const body = await req.json();
  const {
    businessName,
    contactName,
    service,
    city,
    whatsapp,
    email,
    priceFrom,
    description,
    photos,
  } = body;

  if (!businessName || !contactName || !service || !whatsapp) {
    return Response.json(
      { success: false, message: "Nom de l'entreprise, contact, service et WhatsApp sont obligatoires." },
      { status: 400 }
    );
  }

  if (!SERVICE_IDS.includes(service)) {
    return Response.json({ success: false, message: "Service non reconnu." }, { status: 400 });
  }

  const resolvedCity = city && PROVIDER_CITIES.includes(city) ? city : "Abidjan";
  const cleanPhotos = Array.isArray(photos) ? photos.filter((p) => typeof p === "string").slice(0, 6) : [];

  const [newProvider] = await db
    .insert(providers)
    .values({
      businessName: String(businessName).trim(),
      contactName: String(contactName).trim(),
      service,
      city: resolvedCity,
      whatsapp: String(whatsapp).trim(),
      email: email ? String(email).trim().toLowerCase() : null,
      priceFrom: Number(priceFrom) || 0,
      description: description ? String(description).trim() : "",
      photos: cleanPhotos,
      status: "pending",
    })
    .returning();

  return Response.json({
    success: true,
    message: "Votre inscription a été envoyée. Elle sera visible dans la marketplace après validation par notre équipe.",
    provider: { id: newProvider.id, businessName: newProvider.businessName, status: newProvider.status },
  });
}
export async function GET() {
  // Public : uniquement les fiches deja validees par l'admin.
  const list = await db.select().from(providers).where(eq(providers.status, "approved"));
  return Response.json({ success: true, providers: list });
}