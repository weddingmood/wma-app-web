/**
 * /api/providers/search
 * ---------------------------------------------------------------------------
 * Pilier 5 : recherche publique dans le carnet des prestataires.
 * Filtres pays, ville, métier, texte libre. Les fiches mises en avant passent
 * en tête (mise en avant payante, gérée par l'équipe).
 *
 * Votre route /api/providers existante reste intacte : celle-ci est un ajout
 * pensé pour le public, sans session.
 */
import { NextRequest } from "next/server";
import { ok, params } from "@/lib/platform";
import { trier, fichePublique, METIERS, villesParPays } from "@/lib/vendors";
import { providersPublics } from "@/lib/queries";
import { premiumContentAccess } from "@/lib/plan-access";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = params(req);
  const pays = String(p.get("pays") || p.get("country") || "").toUpperCase();
  const ville = String(p.get("ville") || p.get("city") || "").trim();
  const service = String(p.get("service") || p.get("metier") || "").toLowerCase();
  const q = String(p.get("q") || p.get("recherche") || "").trim();
  const limite = Math.min(60, Math.max(1, Number(p.get("limite") || p.get("limit") || 24)));

  const toutesBrutes = await providersPublics();
  const acces = await premiumContentAccess();
  const toutes = acces.allowed
    ? toutesBrutes
    : toutesBrutes.filter((f: any) => String(f?.service || f?.metier || "").toLowerCase() !== "traiteur");
  const filtrees = trier(toutes, { pays, ville, service, q });
  const page = filtrees.slice(0, limite);

  /* Pas de compteur de vues : votre table providers n'a pas de colonne views,
     et écrire en base à chaque consultation publique n'est pas souhaitable. */

  return ok({
    total: filtrees.length,
    affichees: page.length,
    fiches: page.map(f => fichePublique(f, { origine: "recherche" })),
    facettes: {
      pays: ["CI", "SN", "ML", "CM"],
      villes: villesParPays(pays || "CI"),
      metiers: METIERS.map(m => ({ key: m.key, nom: m.nom, description: m.description })),
      misesEnAvant: filtrees.filter(f => fichePublique(f).miseEnAvant).length
    },
    filtresAppliques: { pays, ville, service, q }
  });
}
