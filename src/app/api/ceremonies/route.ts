/**
 * /api/ceremonies
 * ---------------------------------------------------------------------------
 * Pilier 1 : cérémonies configurables par pays.
 *   GET  -> état du couple : étapes proposées par son pays + ce qu'il a activé
 *   PUT  -> enregistre les choix (activation, intitulés personnels, ordre,
 *           date, heure, lieu)
 * Aucune route existante n'est modifiée : ce fichier est un ajout.
 */
import { NextRequest } from "next/server";
import { ok, fail, body, coupleIdOu401 } from "@/lib/platform";
import { ceremoniesDuPays, normaliserEtat, getPays } from "@/lib/pays";
import { coupleParId, ceremoniesDuCouple, enregistrerCeremonie } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const { coupleId, reponse } = await coupleIdOu401();
  if (reponse) return reponse;

  const couple = await coupleParId(coupleId);
  if (!couple) return fail("Espace introuvable.", 404, "espace_introuvable");

  const pays = getPays(couple.country);
  const enregistrees = await ceremoniesDuCouple(coupleId);

  return ok({
    pays: { code: pays.code, nom: pays.nom, villes: pays.villes },
    proposees: ceremoniesDuPays(pays.code),
    etat: normaliserEtat(pays.code, enregistrees),
    detail: enregistrees,
    actives: normaliserEtat(pays.code, enregistrees).filter(c => c.defaut)
  });
}

export async function PUT(req: NextRequest) {
  const { coupleId, reponse } = await coupleIdOu401();
  if (reponse) return reponse;

  const couple = await coupleParId(coupleId);
  if (!couple) return fail("Espace introuvable.", 404, "espace_introuvable");

  const payload = await body(req);
  const pays = payload.pays ? String(payload.pays).toUpperCase() : couple.country;
  const connus = getClesValides(pays);

  const entrant = Array.isArray(payload.ceremonies) ? payload.ceremonies
    : Array.isArray(payload.etapes) ? payload.etapes : [];

  if (entrant.length === 0) return fail("Aucune étape transmise.", 400, "aucune_etape");
  if (entrant.length > 12) return fail("Douze étapes maximum.", 400, "trop_detapes");

  const etat = normaliserEtat(pays, entrant).map((c, i) => ({ ...c, ordre: i + 1 }));

  const invalide = etat.find(c => !connus.has(c.key) && String(c.label || "").trim().length < 3);
  if (invalide) return fail("Chaque étape doit porter un intitulé d'au moins trois caractères.", 400, "intitule_trop_court");

  const tropLong = etat.find(c => String(c.label || "").length > 60);
  if (tropLong) return fail("Un intitulé dépasse soixante caractères.", 400, "intitule_trop_long");

  // le pays peut être changé tant qu'aucune étape n'est datée (aucune donnée perdue)
  if (pays !== couple.country) {
    const dates = await ceremoniesDuCouple(coupleId);
    const dejaDatees = dates.some(d => d.event_date);
    if (dejaDatees) return fail("Le pays ne peut plus être modifié : des étapes sont déjà datées. Corrigez-les d'abord.", 409, "pays_verrouille");
  }

  for (const c of etat) {
    await enregistrerCeremonie(coupleId, {
      key: c.key, label: c.label, is_enabled: c.defaut, position: c.ordre,
      event_date: (c as any).event_date || null, event_time: (c as any).event_time || null,
      location: (c as any).location || null, note: (c as any).note || null
    });
  }

  const apres = await ceremoniesDuCouple(coupleId);
  return ok({
    enregistre: true,
    pays,
    etat: normaliserEtat(pays, apres),
    actives: normaliserEtat(pays, apres).filter(c => c.defaut)
  });
}

function getClesValides(pays: string): Set<string> {
  return new Set(ceremoniesDuPays(pays).map(c => c.key));
}
