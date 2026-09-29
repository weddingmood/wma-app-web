/**
 * /api/providers/[id]/contact
 * ---------------------------------------------------------------------------
 * Pilier 5 : mise en relation entre un couple et un prestataire.
 *   POST -> enregistre la demande (provider_leads) et renvoie le lien WhatsApp
 *           pré-rempli, avec le contexte du couple.
 *   GET  -> le couple consulte ses demandes envoyées.
 *
 * Votre helper waveLinkWhatsapp() reste utilisable côté écran : le lien renvoyé
 * ici suit exactement le même format (wa.me/<numero>?text=...).
 */
import { NextRequest } from "next/server";
import { ok, fail, body, params, coupleIdOu401, sessionCouple } from "@/lib/platform";
import { lienContact, fichePublique, getMetier } from "@/lib/vendors";
import { providerParId, insererLead, leadsDunPrestataire, coupleParId } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: any }) {
  const { coupleId, reponse } = await coupleIdOu401();
  if (reponse) return reponse;

  const p: any = await ctx?.params;
  const identifiant = String(p?.id || params(req).get("id") || "");
  const fiche = await providerParId(identifiant);
  if (!fiche) return fail("Prestataire introuvable.", 404, "prestataire_introuvable");
  if (String(fiche.status || "").toLowerCase() !== "approved") {
    return fail("Ce prestataire n'est pas disponible actuellement.", 404, "prestataire_indisponible");
  }

  return ok({ prestataire: fichePublique(fiche), demandes: [] });
}

export async function POST(req: NextRequest, ctx: { params: any }) {
  const p: any = await ctx?.params;
  const identifiant = String(p?.id || params(req).get("id") || "");
  if (!identifiant) return fail("Prestataire introuvable.", 400, "identifiant_manquant");

  const fiche = await providerParId(identifiant);
  if (!fiche) return fail("Prestataire introuvable.", 404, "prestataire_introuvable");
  if (String(fiche.status || "").toLowerCase() !== "approved") {
    return fail("Ce prestataire n'est pas disponible actuellement.", 404, "prestataire_indisponible");
  }

  const payload = await body(req);
  const message = String(payload.message || "").trim();
  if (message.length > 400) return fail("Votre message est trop long (quatre cents caractères maximum).", 400, "message_trop_long");

  // couple connecté : contexte repris automatiquement ; visiteur : champs libres
  const session = await sessionCouple();
  const coupleId = Number(session?.coupleId || 0);
  const couple = coupleId ? await coupleParId(coupleId) : null;

  const nom = couple
    ? [couple.partner1_name, couple.partner2_name].filter(Boolean).join(" et ")
    : String(payload.coupleName || payload.nom || "").trim().slice(0, 80) || null;
  const telephone = couple
    ? String(payload.couplePhone || "").replace(/[^0-9+ ]/g, "").slice(0, 20) || null
    : String(payload.couplePhone || payload.telephone || "").replace(/[^0-9+ ]/g, "").slice(0, 20) || null;
  const date = couple?.wedding_date || payload.weddingDate || null;

  const lien = lienContact(fichePublique(fiche), { nom: nom || undefined, telephone: telephone || undefined, date: date ? new Date(date).toISOString().slice(0, 10) : null, message: message || undefined });

  if (!lien.includes("wa.me/") || lien === "https://wa.me/?text=") {
    return fail("Ce prestataire n'a pas encore communiqué de numéro WhatsApp.", 422, "whatsapp_manquant");
  }

  await insererLead(fiche.id, {
    coupleId: coupleId || null,
    coupleName: nom,
    couplePhone: telephone,
    weddingDate: date ? new Date(date).toISOString().slice(0, 10) : null,
    message: message || null,
    whatsappLink: lien
  });

  const demandes = await leadsDunPrestataire(fiche.id);

  return ok({
    envoye: true,
    prestataire: fichePublique(fiche),
    metier: getMetier(fiche.service)?.nom || "Prestataire",
    lienWhatsApp: lien,
    demandesRecues: demandes.length,
    message: "Votre demande est transmise. Le prestataire vous répond sur WhatsApp."
  }, { status: 201 });
}
