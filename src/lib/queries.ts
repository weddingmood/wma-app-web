/**
 * src/lib/queries.ts
 * ---------------------------------------------------------------------------
 * Requêtes réutilisables du kit "six piliers".
 *
 * Elles sont écrites en SQL positionnel ($1, $2) avec les noms de colonnes
 * lus dans COLONNES (src/lib/platform.ts) : si votre schéma nomme un champ
 * autrement, vous ne corrigez qu'un seul fichier.
 *
 * ÉTAT DU CALAGE (29 septembre 2026) :
 *   CALÉ  couples          : lu dans votre src/db/schema.ts
 *   CALÉ cagnottes (invitations) / contributions / providers / payments / guests :
 *           vos tables existent (routes /api/cagnotte, /api/providers,
 *           /api/payments, /api/guests) mais leurs colonnes ne m'ont pas
 *           encore été transmises. Les noms utilisés ici sont des hypothèses
 *           raisonnables : ne lancez PAS ces endpoints avant validation.
 *
 * Pourquoi pas Drizzle directement ? Le kit ne connaît pas vos objets de
 * table (couples, providers, cagnottes...). Passer par le SQL positionnel lui
 * permet de fonctionner sans toucher à votre schéma. Si vous préférez Drizzle,
 * remplacez le corps de ces fonctions par vos propres requêtes : les Route
 * Handlers n'utilisent que ces fonctions.
 */

import { COLONNES, lire, ecrire } from "./platform";
import { accesDe } from "./plans";

const C = COLONNES.couples;
const P = COLONNES.providers;

/* ── Couple ─────────────────────────────────────────────────────────────── */

export async function coupleParSlug(slug: string) {
  if (!slug) return null;
  const lignes = await lire(
    `SELECT id, slug, partner1_name, partner2_name, wedding_date, city, venue,
            church, ethnicity, traditions, total_budget, estimated_guests,
            status, plan_type, plan_amount, trial_ends_at,
            partner1_access_active, partner2_access_active, country
       FROM couples
      WHERE slug = $1
      LIMIT 1`,
    [String(slug).toLowerCase()]
  );
  return lignes[0] || null;
}

export async function coupleParId(id: number) {
  const lignes = await lire(
    `SELECT id, slug, partner1_name, partner2_name, wedding_date, city, venue,
            church, ethnicity, traditions, total_budget, estimated_guests,
            status, plan_type, plan_amount, trial_ends_at,
            partner1_access_active, partner2_access_active, country
       FROM couples
      WHERE id = $1
      LIMIT 1`,
    [Number(id)]
  );
  return lignes[0] || null;
}

/** Couple + accès calculé (palier, essai, lecture seule). */
export async function accesCouple(couple: any) {
  return accesDe(couple);
}

/* ── Cérémonies (pilier 1) ──────────────────────────────────────────────── */

export async function ceremoniesDuCouple(coupleId: number) {
  return lire(
    `SELECT id, couple_id, key, label, is_enabled, position, event_date, event_time, location, note
       FROM ceremonies
      WHERE couple_id = $1
      ORDER BY position, id`,
    [Number(coupleId)]
  );
}

export async function enregistrerCeremonie(coupleId: number, e: any) {
  return ecrire(
    `INSERT INTO ceremonies (couple_id, key, label, is_enabled, position, event_date, event_time, location, note, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
     ON CONFLICT (couple_id, key) DO UPDATE
        SET label = EXCLUDED.label,
            is_enabled = EXCLUDED.is_enabled,
            position = EXCLUDED.position,
            event_date = EXCLUDED.event_date,
            event_time = EXCLUDED.event_time,
            location = EXCLUDED.location,
            note = EXCLUDED.note,
            updated_at = now()
     RETURNING id, key, label, is_enabled, position, event_date, event_time, location, note`,
    [
      Number(coupleId),
      String(e.key),
      String(e.label || e.key),
      Boolean(e.is_enabled ?? e.isEnabled ?? false),
      Number(e.position ?? e.ordre ?? 0),
      e.event_date || e.eventDate || null,
      e.event_time || e.eventTime || null,
      e.location || null,
      e.note || null
    ]
  );
}

/* ── Cagnotte et cadeaux (piliers 2 et 3) ─────────────────────────────────
   CALÉ sur votre schéma réel :
     - les réglages de la cagnotte sont des colonnes de la table `invitations`
       (il n'existe aucune table "cagnottes" chez vous) ;
     - l'argent est dans `cagnotte_contributions`, validé par `is_verified`.
   La table gift_contributions du kit est abandonnée : deux tables pour le
   même argent auraient fait deux vérités contradictoires.

   Différence assumée avec votre flux existant : votre /api/cagnotte insère
   avec is_verified à true par défaut, alors qu'un geste déclaré depuis
   l'invitation publique est inséré à false et attend la confirmation du
   couple. Le compteur public ne compte donc que ce qui est vérifié. */

const CT = COLONNES.contributions;
const I  = COLONNES.invitations;

/**
 * Configuration de la cagnotte d'un couple, lue dans sa ligne `invitations`,
 * complétée par le total réellement collecté. Un seul aller-retour en base.
 */
export async function cagnotteDuCouple(coupleId: number) {
  const lignes = await lire(
    `SELECT i.${I.id}                AS invitation_id,
            i.${I.coupleId}          AS couple_id,
            i.${I.slug}              AS slug,
            i.${I.showCagnotte}      AS show_cagnotte,
            i.${I.cagnotteEnabled}   AS cagnotte_enabled,
            i.${I.cagnotteTitle}     AS titre,
            i.${I.cagnotteDescription} AS description,
            i.${I.cagnottePaymentMethod} AS moyen,
            i.${I.cagnottePaymentUrl}    AS lien,
            i.${I.cagnotteButtonText}    AS bouton,
            COALESCE(i.${I.goalAmount}, 0) AS objectif,
            COALESCE(c.collecte, 0)  AS collecte,
            COALESCE(c.gestes, 0)    AS gestes,
            COALESCE(c.en_attente, 0) AS en_attente
       FROM ${I.table} i
       LEFT JOIN LATERAL (
              SELECT SUM(${CT.amount}) FILTER (WHERE ${CT.isVerified} = true)  AS collecte,
                     COUNT(*)           FILTER (WHERE ${CT.isVerified} = true)  AS gestes,
                     COUNT(*)           FILTER (WHERE ${CT.isVerified} = false) AS en_attente
                FROM ${CT.table}
               WHERE ${CT.coupleId} = i.${I.coupleId}
            ) c ON true
      WHERE i.${I.coupleId} = $1
      ORDER BY i.${I.id} DESC
      LIMIT 1`,
    [Number(coupleId)]
  );
  const l = lignes[0];
  if (!l) return null;
  return {
    id: Number(l.invitation_id),
    coupleId: Number(l.couple_id),
    slug: l.slug,
    /* les deux drapeaux doivent être vrais pour que la collecte soit publique */
    visible: Boolean(l.show_cagnotte) && Boolean(l.cagnotte_enabled),
    showCagnotte: Boolean(l.show_cagnotte),
    cagnotteEnabled: Boolean(l.cagnotte_enabled),
    titre: l.titre,
    description: l.description,
    moyen: l.moyen,
    lien: l.lien,
    bouton: l.bouton,
    objectif: Number(l.objectif || 0),
    collecte: Number(l.collecte || 0),
    gestes: Number(l.gestes || 0),
    enAttente: Number(l.en_attente || 0)
  };
}

/**
 * Ne crée plus rien : la configuration vit sur la ligne `invitations`, que
 * votre flux crée déjà. Conservé pour ne pas casser les appels existants,
 * renvoie simplement la configuration courante (null si aucune invitation).
 */
export async function creerCagnotteSiAbsente(coupleId: number) {
  return cagnotteDuCouple(coupleId);
}

/** Compteur public : seuls les gestes vérifiés sont comptés comme reçus. */
export async function compteurCadeaux(coupleId: number) {
  const lignes = await lire(
    `SELECT COALESCE(SUM(${CT.amount}) FILTER (WHERE ${CT.isVerified} = true), 0) AS collecte,
            COUNT(*) FILTER (WHERE ${CT.isVerified} = true)  AS gestes,
            COUNT(*) FILTER (WHERE ${CT.isVerified} = false) AS en_attente
       FROM ${CT.table}
      WHERE ${CT.coupleId} = $1`,
    [Number(coupleId)]
  );
  const l = lignes[0] || {};
  return {
    collecte: Number(l.collecte || 0),
    gestes: Number(l.gestes || 0),
    enAttente: Number(l.en_attente || 0)
  };
}

/** Un geste déclaré depuis l'invitation publique n'est pas encore vérifié. */
const normaliserCadeau = (l: any) => l && ({
  id: Number(l.id),
  donorName: l.donor_name,
  donorPhone: l.donor_phone,
  message: l.message,
  amount: Number(l.amount || 0),
  reference: l.payment_reference,
  isVerified: Boolean(l.is_verified),
  /* vocabulaire du kit, pour ne pas changer le contrat des écrans */
  statut: l.is_verified ? "confirme" : "declare",
  createdAt: l.created_at
});

export async function cadeauxDuCouple(coupleId: number, limite = 100) {
  const lignes = await lire(
    `SELECT ${CT.id} AS id, ${CT.donorName} AS donor_name, ${CT.donorPhone} AS donor_phone,
            ${CT.message} AS message, ${CT.amount} AS amount,
            ${CT.paymentReference} AS payment_reference, ${CT.isVerified} AS is_verified,
            ${CT.createdAt} AS created_at
       FROM ${CT.table}
      WHERE ${CT.coupleId} = $1
      ORDER BY ${CT.createdAt} DESC
      LIMIT $2`,
    [Number(coupleId), Number(limite)]
  );
  return lignes.map(normaliserCadeau);
}

/**
 * Écrit dans votre table avec vos colonnes. `is_verified` est posé à false :
 * c'est au couple de confirmer le geste depuis son espace.
 */
export async function insererCadeau(coupleId: number, d: any) {
  const lignes = await ecrire(
    `INSERT INTO ${CT.table}
       (${CT.coupleId}, ${CT.donorName}, ${CT.donorPhone}, ${CT.message},
        ${CT.amount}, ${CT.paymentReference}, ${CT.isVerified})
     VALUES ($1, $2, $3, $4, $5, $6, false)
     RETURNING ${CT.id} AS id, ${CT.donorName} AS donor_name, ${CT.donorPhone} AS donor_phone,
               ${CT.message} AS message, ${CT.amount} AS amount,
               ${CT.paymentReference} AS payment_reference, ${CT.isVerified} AS is_verified,
               ${CT.createdAt} AS created_at`,
    [
      Number(coupleId),
      String(d.donorName || d.donor_name || "Un proche").slice(0, 150),
      d.donorPhone || d.donor_phone || null,
      d.message || d.guestMessage || d.guest_message || null,
      Number(d.amount),
      d.reference || d.paymentReference || d.transferReference || d.transfer_reference || null
    ]
  );
  return normaliserCadeau(lignes[0]);
}

/**
 * Confirmation par le couple. Votre schéma n'a pas d'état "refusé" : un geste
 * refusé repasse simplement à is_verified = false et n'est plus compté.
 * Aucun total à tenir à jour : la collecte est recalculée à chaque lecture.
 */
export async function confirmerCadeau(coupleId: number, cadeauId: number, statut: "confirme" | "refuse") {
  const lignes = await ecrire(
    `UPDATE ${CT.table}
        SET ${CT.isVerified} = $3
      WHERE ${CT.id} = $1 AND ${CT.coupleId} = $2
      RETURNING ${CT.id} AS id, ${CT.donorName} AS donor_name, ${CT.amount} AS amount,
                ${CT.isVerified} AS is_verified, ${CT.createdAt} AS created_at`,
    [Number(cadeauId), Number(coupleId), statut === "confirme"]
  );
  return normaliserCadeau(lignes[0]);
}

/**
 * Visibilité publique de la collecte. Les deux drapeaux de votre schéma sont
 * alignés : show_cagnotte (section de l'invitation) et cagnotte_enabled.
 * N'écrit rien si le couple n'a pas encore de ligne `invitations`.
 */
export async function visibiliteCagnotte(coupleId: number, visible: boolean) {
  const lignes = await ecrire(
    `UPDATE ${I.table}
        SET ${I.showCagnotte} = $2,
            ${I.cagnotteEnabled} = $2,
            ${I.cagnotteUpdatedAt} = now()
      WHERE ${I.coupleId} = $1
      RETURNING ${I.id} AS id, ${I.showCagnotte} AS show_cagnotte,
                ${I.cagnotteEnabled} AS cagnotte_enabled`,
    [Number(coupleId), Boolean(visible)]
  );
  const l = lignes[0];
  return l ? { visible: Boolean(l.show_cagnotte) && Boolean(l.cagnotte_enabled) } : null;
}

/** Objectif de la collecte, dans la colonne ajoutée par la migration. */
export async function definirObjectifCagnotte(coupleId: number, objectif: number) {
  const lignes = await ecrire(
    `UPDATE ${I.table}
        SET ${I.goalAmount} = $2, ${I.cagnotteUpdatedAt} = now()
      WHERE ${I.coupleId} = $1
      RETURNING ${I.goalAmount} AS objectif`,
    [Number(coupleId), Math.max(0, Math.round(Number(objectif) || 0))]
  );
  return lignes[0] ? { objectif: Number(lignes[0].objectif || 0) } : null;
}

/* ── Animations (pilier 4) ──────────────────────────────────────────────── */

export async function questionsQuiz(coupleId: number, publiques = true) {
  return lire(
    `SELECT id, question, option_a, option_b, option_c, option_d, good_answer, explanation, position
       FROM couple_quiz_questions
      WHERE couple_id = $1 ${publiques ? "AND is_public = true" : ""}
      ORDER BY position, id`,
    [Number(coupleId)]
  );
}

export async function devinettes(coupleId: number, publiques = true) {
  return lire(
    `SELECT id, riddle, answer, hint, position
       FROM couple_riddles
      WHERE couple_id = $1 ${publiques ? "AND is_public = true" : ""}
      ORDER BY position, id`,
    [Number(coupleId)]
  );
}

export async function enregistrerPartie(coupleId: number, p: { guestName?: string; kind?: string; score?: number; total?: number }) {
  const lignes = await ecrire(
    `INSERT INTO couple_game_plays (couple_id, guest_name, kind, score, total)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, kind, score, total, played_at`,
    [Number(coupleId), p.guestName || null, p.kind === "devinette" ? "devinette" : "quiz", Number(p.score || 0), Number(p.total || 0)]
  );
  return lignes[0] || null;
}

export async function statistiquesJeux(coupleId: number) {
  const lignes = await lire(
    `SELECT COUNT(*) AS parties, COALESCE(SUM(score), 0) AS points
       FROM couple_game_plays WHERE couple_id = $1`,
    [Number(coupleId)]
  );
  return { parties: Number(lignes[0]?.parties || 0), points: Number(lignes[0]?.points || 0) };
}

/* ── Prestataires (pilier 5) ────────────────────────────────────────────── */

/* Sélection commune : vos colonnes réelles, plus la mise en avant lue dans
   provider_features. Le kit n'ajoute aucune colonne is_featured, featured_until
   ni views à votre table providers : ces trois valeurs sont calculées. */
const CHAMPS_PROVIDER = `
       ${P.id} AS id, ${P.businessName} AS business_name, ${P.contactName} AS contact_name,
       ${P.service} AS service, ${P.city} AS city, ${P.country} AS country,
       ${P.whatsapp} AS whatsapp, ${P.email} AS email, ${P.priceFrom} AS price_from,
       ${P.description} AS description, ${P.photos} AS photos, ${P.status} AS status,
       ${P.createdAt} AS created_at, ${P.updatedAt} AS updated_at,
       f.ends_at AS featured_until, (f.id IS NOT NULL) AS is_featured`;

const JOIN_MISE_EN_AVANT = `
  LEFT JOIN LATERAL (
         SELECT id, ends_at
           FROM provider_features
          WHERE provider_id = p.${P.id} AND ends_at > now()
          ORDER BY ends_at DESC
          LIMIT 1
       ) f ON true`;

/** Fiches approuvées, mises en avant en tête. Alimente /api/providers/search. */
export async function providersPublics() {
  return lire(
    `SELECT p.${CHAMPS_PROVIDER}
       FROM ${P.table} p${JOIN_MISE_EN_AVANT}
      WHERE LOWER(COALESCE(p.${P.status}, '')) = 'approved'
      ORDER BY (f.id IS NOT NULL) DESC, f.ends_at DESC NULLS LAST, p.${P.createdAt} DESC`,
    []
  );
}

/**
 * Une fiche par son identifiant numérique. Votre table providers n'a pas de
 * colonne slug : l'ancien nom providerParIdOuSlug est abandonné, les liens
 * publics utilisent l'identifiant.
 */
export async function providerParId(valeur: string | number) {
  const lignes = await lire(
    `SELECT p.${CHAMPS_PROVIDER}
       FROM ${P.table} p${JOIN_MISE_EN_AVANT}
      WHERE p.${P.id}::text = $1
      LIMIT 1`,
    [String(valeur)]
  );
  return lignes[0] || null;
}

export async function insererLead(providerId: number, l: any) {
  const lignes = await ecrire(
    `INSERT INTO provider_leads (provider_id, couple_id, couple_name, couple_phone, wedding_date, message, whatsapp_link)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, provider_id, couple_name, created_at`,
    [
      Number(providerId),
      l.coupleId ? Number(l.coupleId) : null,
      l.coupleName || null,
      l.couplePhone || null,
      l.weddingDate || null,
      l.message || null,
      l.whatsappLink || null
    ]
  );
  return lignes[0] || null;
}

export async function leadsDunPrestataire(providerId: number) {
  return lire(
    `SELECT id, couple_name, couple_phone, wedding_date, message, status, created_at
       FROM provider_leads WHERE provider_id = $1 ORDER BY created_at DESC LIMIT 200`,
    [Number(providerId)]
  );
}

/**
 * Mise en avant payante : une ligne dans provider_features, rien dans votre
 * table providers. Le règlement est relié à votre table payments, dont
 * l'identifiant est un serial (integer), comme provider_id.
 */
export async function activerMiseEnAvant(providerId: number, jours: number, montant: number, paymentId?: number | null) {
  const fin = new Date(Date.now() + jours * 86400000);
  const lignes = await ecrire(
    `INSERT INTO provider_features (provider_id, payment_id, days, amount, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, now(), $5)
     RETURNING id, provider_id, days, amount, starts_at, ends_at`,
    [Number(providerId), paymentId ? Number(paymentId) : null, Number(jours), Number(montant), fin]
  );
  return lignes[0] || null;
}

/**
 * Retire la mise en avant en ramenant sa fin à maintenant. La ligne est
 * conservée : elle reste la trace comptable du règlement.
 */
export async function retirerMiseEnAvant(providerId: number) {
  const lignes = await ecrire(
    `UPDATE provider_features
        SET ends_at = now()
      WHERE provider_id = $1 AND ends_at > now()
      RETURNING id, provider_id, ends_at`,
    [Number(providerId)]
  );
  return lignes[0] || null;
}

/** Nombre de fiches actuellement mises en avant (statistique équipe). */
export async function compterMisesEnAvantActives(): Promise<number> {
  const lignes = await lire(
    `SELECT COUNT(DISTINCT provider_id) AS n FROM provider_features WHERE ends_at > now()`,
    []
  );
  return Number(lignes[0]?.n || 0);
}

/* ── Paliers et paiements (pilier 6) ────────────────────────────────────── */

export async function ouvrirEssai(coupleId: number, fin: Date) {
  /**
   * Écrit dans vos colonnes existantes : couples.trial_ends_at et
   * couples.status. Un espace déjà "active" (Premium payé) n'est jamais
   * rétrogradé en "trial" par l'ouverture d'un essai.
   */
  const lignes = await ecrire(
    `UPDATE couples
        SET trial_ends_at = $2,
            status = CASE WHEN status = 'active' THEN status ELSE 'trial' END,
            updated_at = now()
      WHERE id = $1
      RETURNING id, trial_ends_at, status, plan_type`,
    [Number(coupleId), fin]
  );
  return lignes[0] || null;
}

/**
 * Déclare un paiement à valider par l'équipe : réutilise VOTRE table payments
 * et VOTRE écran /wma-admin-2026-secure (onglet Payments). Aucun flux
 * automatique : l'activation reste humaine.
 *
 * CALÉ sur vos colonnes réelles. Deux d'entre elles sont NOT NULL et doivent
 * donc toujours être fournies : payment_date (varchar) et reference_number.
 * Vos valeurs de statut sont pending, verified, rejected, need_new_proof :
 * le kit n'écrit que "pending", la suite appartient à votre écran d'équipe.
 *
 * Votre table n'a pas de colonne pour l'opérateur (Wave, Orange...). Quand il
 * est déclaré, il est inscrit dans admin_notes, que votre écran affiche déjà :
 * l'équipe voit le contexte sans qu'aucune colonne ne soit ajoutée.
 */
export async function declarerPaiement(coupleId: number, p: {
  amount: number;
  planType?: string;
  payerEmail?: string | null;
  payerPartner?: string | null;
  paymentDate?: string | null;
  referenceNumber?: string | null;
  proofImageUrl?: string | null;
  operator?: string | null;
  note?: string | null;
}) {
  const PAY = COLONNES.payments;
  const reference = String(p.referenceNumber || "").trim().slice(0, 120);
  if (!reference) return null;                    // NOT NULL chez vous : jamais de valeur inventée

  const date = String(p.paymentDate || new Date().toISOString().slice(0, 10)).slice(0, 50);
  const notes = [
    p.operator ? `Opérateur déclaré : ${String(p.operator).slice(0, 40)}` : "",
    p.note ? String(p.note).slice(0, 400) : ""
  ].filter(Boolean).join(" | ") || null;

  const lignes = await ecrire(
    `INSERT INTO ${PAY.table}
       (${PAY.coupleId}, ${PAY.amount}, ${PAY.planType}, ${PAY.payerEmail}, ${PAY.payerPartner},
        ${PAY.paymentDate}, ${PAY.referenceNumber}, ${PAY.proofImageUrl}, ${PAY.status}, ${PAY.adminNotes})
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
     RETURNING ${PAY.id} AS id, ${PAY.amount} AS amount, ${PAY.planType} AS plan_type,
               ${PAY.status} AS status, ${PAY.referenceNumber} AS reference_number,
               ${PAY.paymentDate} AS payment_date`,
    [
      Number(coupleId),
      Number(p.amount),
      String(p.planType || "couple").slice(0, 30),
      p.payerEmail || null,
      String(p.payerPartner || "partner1").slice(0, 20),
      date,
      reference,
      p.proofImageUrl || null,
      notes
    ]
  );
  return lignes[0] || null;
}

/**
 * Statistiques d'invitation pour le tableau de bord du couple.
 * CALÉ sur votre table guests : le nom est en deux colonnes (first_name,
 * last_name) et l'état de réponse s'appelle rsvp_status, avec trois valeurs :
 * pending, confirmed, declined.
 */
export async function statistiquesInvitation(coupleId: number) {
  const G = COLONNES.guests;
  const lignes = await lire(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE LOWER(COALESCE(${G.rsvpStatus}, '')) = 'confirmed') AS oui,
            COUNT(*) FILTER (WHERE LOWER(COALESCE(${G.rsvpStatus}, '')) = 'declined')  AS non,
            COUNT(*) FILTER (WHERE LOWER(COALESCE(${G.rsvpStatus}, '')) NOT IN ('confirmed','declined')) AS en_attente,
            COALESCE(SUM(${G.plusOnesConfirmed}), 0) AS accompagnateurs,
            COALESCE(SUM(${G.plusOnesAllowed}), 0)   AS places_offertes
       FROM ${G.table} WHERE ${G.coupleId} = $1`,
    [Number(coupleId)]
  );
  const l = lignes[0] || {};
  const total = Number(l.total || 0);
  const oui = Number(l.oui || 0);
  const non = Number(l.non || 0);
  return {
    total,
    oui,
    non,
    en_attente: Number(l.en_attente || Math.max(0, total - oui - non)),
    accompagnateurs: Number(l.accompagnateurs || 0),
    places_offertes: Number(l.places_offertes || 0),
    presents: oui + Number(l.accompagnateurs || 0)
  };
}
