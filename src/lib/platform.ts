/**
 * src/lib/platform.ts
 * ---------------------------------------------------------------------------
 * POINT D'ADAPTATION UNIQUE du kit "six piliers".
 *
 * Tout le reste du kit n'importe que ce fichier.
 *
 * ÉTAT : calé sur votre dépôt réel (vérifié le 29 septembre 2026).
 *   - base     : import { db } from "@/db"          (src/db/index.ts)
 *   - sessions : import { getCurrentSession }       (src/lib/auth-helpers.ts)
 *   - schéma   : export * from "@/db/schema/platform"
 *   - COLONNES : calée colonne par colonne sur votre src/db/schema.ts complet
 *                (lu le 29/09/2026). Deux colonnes seulement sont ajoutées par
 *                la migration : couples.country et invitations.cagnotte_goal_amount.
 *                Il n'existe pas de table "cagnottes" chez vous : les réglages
 *                de la cagnotte sont des colonnes de la table invitations.
 *
 * Conventions respectées (celles de votre application actuelle) :
 *   - Route Handlers Next.js (app/api/**\/route.ts), aucun serveur séparé ;
 *   - Drizzle + Supabase (PostgreSQL) ;
 *   - session par cookie : wm_session (couple), wm_admin_session (équipe) ;
 *   - enveloppe de réponse : { success: true, ... } / { success: false, error } ;
 *   - colonnes SQL en snake_case, clés TypeScript en camelCase.
 */

import { NextResponse } from "next/server";

// ─── Accès à la base (calé) ──────────────────────────────────────────────────
// Votre src/db/index.ts exporte `db` (drizzle + postgres-js) et `client`.
import { db } from "@/db";

// ─── Sessions (calé) ─────────────────────────────────────────────────────────
// CALÉ sur votre dépôt : src/lib/auth-helpers.ts exporte getCurrentSession(),
// qui lit les cookies signés wm_session et wm_admin_session et renvoie
// { coupleId, coupleSlug, activePartner, partnerName, isAdmin, adminId }.
import { getCurrentSession } from "@/lib/auth-helpers";
import type { SessionData } from "@/lib/auth-helpers";

// ─── Schéma Drizzle des nouvelles tables ─────────────────────────────────────
export * from "@/db/schema/platform";
import * as platformSchema from "@/db/schema/platform";

export { db, platformSchema };

/* ═══════════════════════════════════════════════════════════════════════════
   Noms de tables et de colonnes de VOTRE schéma existant.
   Le kit n'écrit jamais ces noms en dur ailleurs : tout passe par ici.
   ═══════════════════════════════════════════════════════════════════════════ */
export const COLONNES = {
  /* ── couples : vérifié colonne par colonne sur votre src/db/schema.ts ──────
     id est un `serial` (integer). Il n'y a PAS de colonne is_premium : le
     palier se déduit de status + trial_ends_at (voir accesDe dans plans.ts).
     status accepte aussi "blocked" chez vous, traité comme une lecture seule. */
  couples: {
    table: "couples",
    id: "id",
    slug: "slug",                              // varchar(120), unique
    partner1Name: "partner1_name",
    partner2Name: "partner2_name",
    partner1Email: "partner1_email",
    partner2Email: "partner2_email",
    partner1Role: "partner1_role",
    partner2Role: "partner2_role",
    weddingDate: "wedding_date",               // varchar(50)
    city: "city",                              // défaut "Abidjan"
    venue: "venue",
    church: "church",
    ethnicity: "ethnicity",
    traditions: "traditions",
    ceremonyTypes: "ceremony_types",           // json string[]
    totalBudget: "total_budget",               // integer, défaut 5 000 000
    estimatedGuests: "estimated_guests",       // integer, défaut 250
    status: "status",                          // trial|pending_payment|verification|active|expired|suspended|blocked
    trialEndsAt: "trial_ends_at",              // timestamp (pas varchar)
    accessCode: "access_code",
    sharedPasscode: "shared_passcode",
    planType: "plan_type",                     // défaut "couple"
    planAmount: "plan_amount",                 // integer, défaut 3000
    partner1AccessActive: "partner1_access_active",
    partner2AccessActive: "partner2_access_active",
    country: "country"                         // AJOUTÉE par la migration, défaut 'CI'
  },

  /* ── invitations : la configuration de la cagnotte vit ICI ────────────────
     Il n'existe aucune table "cagnottes" dans votre schéma. Les réglages
     (titre, description, moyen de paiement, lien, bouton, visibilité) sont
     des colonnes de la table invitations. Le kit les lit et les écrit là. */
  invitations: {
    table: "invitations",
    id: "id",
    coupleId: "couple_id",
    slug: "slug",                              // varchar(120), unique
    showCagnotte: "show_cagnotte",             // boolean, défaut true
    cagnotteEnabled: "cagnotte_enabled",       // boolean, défaut true
    cagnotteTitle: "cagnotte_title",
    cagnotteDescription: "cagnotte_description",
    cagnottePaymentMethod: "cagnotte_payment_method",  // wave|orange_money|mtn_money|moov_money|other
    cagnottePaymentUrl: "cagnotte_payment_url",
    cagnotteButtonText: "cagnotte_button_text",
    cagnotteUpdatedAt: "cagnotte_updated_at",
    goalAmount: "cagnotte_goal_amount",        // AJOUTÉE par la migration, défaut 0
    ceremoniesSelected: "ceremonies_selected", // json string[] (dot|civil|church|reception)
    ceremoniesDetails: "ceremonies_details",   // json objet
    publicationStatus: "publication_status",
    isPublished: "is_published"
  },

  /* ── contributions : votre table réelle s'appelle cagnotte_contributions ──
     Pas de colonne status : la validation passe par is_verified (boolean).
     Le kit n'ajoute aucune colonne ici, il se contente de lire et d'écrire
     avec vos noms. La table gift_contributions du kit est donc abandonnée :
     deux tables pour le même argent auraient fait deux vérités. */
  contributions: {
    table: "cagnotte_contributions",
    id: "id",
    coupleId: "couple_id",
    donorName: "donor_name",                   // varchar(150), NOT NULL
    donorPhone: "donor_phone",
    amount: "amount",                          // integer, NOT NULL
    message: "message",
    paymentReference: "payment_reference",
    isVerified: "is_verified",                 // boolean, défaut true
    createdAt: "created_at"
  },

  /* ── providers : sept colonnes que j'avais supposées n'existent pas ───────
     Absentes chez vous : slug, phone, country, service_key, is_featured,
     featured_until, views. Le métier s'appelle `service`, le contact passe
     par `whatsapp`, et la mise en avant est portée par la nouvelle table
     provider_features plutôt que par des colonnes ajoutées à providers.
     country est la seule colonne ajoutée par la migration. */
  providers: {
    table: "providers",
    id: "id",                                  // serial => integer : les FK sont possibles
    businessName: "business_name",             // varchar(200), NOT NULL
    contactName: "contact_name",               // varchar(150), NOT NULL
    service: "service",                        // varchar(60) : traiteur|decorateur|photographe|...
    city: "city",                              // défaut "Abidjan"
    whatsapp: "whatsapp",                      // varchar(50), NOT NULL
    email: "email",
    priceFrom: "price_from",                   // integer, défaut 0
    description: "description",
    photos: "photos",                          // json string[]
    status: "status",                          // pending|approved|rejected|suspended
    adminNotes: "admin_notes",
    reviewedAt: "reviewed_at",
    reviewedBy: "reviewed_by",
    country: "country",                        // AJOUTÉE par la migration, défaut 'CI'
    createdAt: "created_at",
    updatedAt: "updated_at"
  },

  /* ── payments : vos valeurs de statut diffèrent de celles que j'avais prises
     Les vôtres : pending | verified | rejected | need_new_proof.
     La référence s'appelle reference_number, la date payment_date (varchar).
     Absentes chez vous : purpose, provider, provider_phone, transfer_reference,
     provider_id. Le kit n'écrit que des colonnes qui existent. */
  payments: {
    table: "payments",
    id: "id",
    coupleId: "couple_id",
    amount: "amount",                          // integer, défaut 3000
    planType: "plan_type",                     // couple | individual
    payerEmail: "payer_email",
    payerPartner: "payer_partner",             // partner1 | partner2
    paymentDate: "payment_date",               // varchar(50), NOT NULL
    referenceNumber: "reference_number",       // varchar(120), NOT NULL
    proofImageUrl: "proof_image_url",
    status: "status",                          // pending|verified|rejected|need_new_proof
    adminNotes: "admin_notes",
    rejectionReason: "rejection_reason",
    reviewedAt: "reviewed_at",
    reviewedBy: "reviewed_by",
    createdAt: "created_at"
  },

  /* ── guests : le nom est en deux colonnes, le RSVP s'appelle rsvp_status ── */
  guests: {
    table: "guests",
    id: "id",
    coupleId: "couple_id",
    firstName: "first_name",                   // varchar(100), NOT NULL
    lastName: "last_name",
    groupName: "group_name",
    phone: "phone",
    email: "email",
    plusOnesAllowed: "plus_ones_allowed",
    plusOnesConfirmed: "plus_ones_confirmed",
    rsvpStatus: "rsvp_status",                 // pending | confirmed | declined
    tableNumber: "table_number",
    isCheckedIn: "is_checked_in",
    createdAt: "created_at"
  }
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   Enveloppe de réponse : identique à celle de vos écrans existants
   (vos pages testent `if (d.success)`)
   ═══════════════════════════════════════════════════════════════════════════ */
export function ok(data: Record<string, any> = {}, init?: ResponseInit) {
  return NextResponse.json({ success: true, ...data }, init);
}

export function fail(error: string, status = 400, code?: string, extra: Record<string, any> = {}) {
  return NextResponse.json({ success: false, error, ...(code ? { code } : {}), ...extra }, { status });
}

export async function body(req: Request): Promise<any> {
  try { return await req.json(); } catch { return {}; }
}

export function params(req: Request) {
  return new URL(req.url).searchParams;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sessions
   ═══════════════════════════════════════════════════════════════════════════ */
export type Session = SessionData | null;

/**
 * Une seule lecture de cookie pour les deux cas : votre getCurrentSession()
 * renvoie déjà soit une session équipe (isAdmin: true), soit une session
 * couple (coupleId), soit null.
 */
export async function sessionCourante(): Promise<Session> {
  try {
    return (await getCurrentSession()) || null;
  } catch {
    return null;
  }
}

/** Session du couple connecté (cookie wm_session signé). */
export async function sessionCouple(): Promise<Session> {
  const s = await sessionCourante();
  if (!s || s.isAdmin || !s.coupleId) return null;
  return s;
}

/** Session de l'équipe (cookie wm_admin_session signé). */
export async function sessionAdmin(): Promise<Session> {
  const s = await sessionCourante();
  if (!s || s.isAdmin !== true) return null;
  return s;
}

export async function coupleIdOu401() {
  const s = await sessionCourante();
  const id = Number(s?.coupleId || 0);
  if (!s || !id) {
    return { coupleId: 0, session: null as Session, reponse: fail("Connexion requise.", 401, "session_requise") };
  }
  return { coupleId: id, session: s, reponse: null as any };
}

export async function adminOu401() {
  const s = await sessionCourante();
  if (!s || s.isAdmin !== true) {
    return { session: null as Session, reponse: fail("Accès réservé à l'équipe Wedding Mood.", 401, "admin_requis") };
  }
  return { session: s, reponse: null as any };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Requêtes SQL simples (utilisées quand le schéma Drizzle existant
   n'est pas connu du kit : aucune dépendance à vos objets de table)
   ═══════════════════════════════════════════════════════════════════════════ */
import { sql } from "drizzle-orm";

/** Lecture : renvoie un tableau d'objets. */
export async function lire<T = any>(requete: string, valeurs: any[] = []): Promise<T[]> {
  const res: any = await (db as any).execute(sql.raw(sqlEscape(requete, valeurs)));
  return (res?.rows ?? res ?? []) as T[];
}

/** Écriture : renvoie les lignes retournées (RETURNING) ou null. */
export async function ecrire<T = any>(requete: string, valeurs: any[] = []): Promise<T[]> {
  const res: any = await (db as any).execute(sql.raw(sqlEscape(requete, valeurs)));
  return (res?.rows ?? res ?? []) as T[];
}

/**
 * Échappement positionnel : remplace $1, $2... par des littéraux sûrs.
 * Les chaînes sont échappées (quote double), les nombres validés, les dates
 * converties en ISO, les booléens en true/false, null en NULL.
 * Aucun mot de passe, aucune clé n'est jamais concaténé ici.
 */
export function sqlEscape(requete: string, valeurs: any[] = []): string {
  return requete.replace(/\$(\d+)/g, (_m, i) => literal(valeurs[Number(i) - 1]));
}

export function literal(v: any): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (Array.isArray(v) || typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Divers
   ═══════════════════════════════════════════════════════════════════════════ */
/** Nom du champ SQL qualifié, ex. champ(COLONNES.couples, "trialEndsAt") -> couples.trial_ends_at */
export function champ(entite: keyof typeof COLONNES, cle: string, alias?: string): string {
  const e: any = COLONNES[entite];
  const col = e?.[cle] ?? cle;
  const table = alias || e?.table || entite;
  return `${table}.${col}`;
}

/** Lecture tolérante d'un champ : accepte snake_case et camelCase. */
export function lireChamp(ligne: any, ...cles: string[]): any {
  for (const c of cles) if (ligne?.[c] !== undefined && ligne?.[c] !== null) return ligne[c];
  const snake = cles.map(c => c.replace(/[A-Z]/g, m => "_" + m.toLowerCase()));
  for (const c of snake) if (ligne?.[c] !== undefined && ligne?.[c] !== null) return ligne[c];
  return null;
}

export const WHATSAPP_OFFICIEL = process.env.NEXT_PUBLIC_WHATSAPP_OFFICIEL || "22570501356";

export function lienWhatsApp(texte: string, numero?: string) {
  const n = String(numero || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(texte)}`;
}

export function urlPublique(chemin: string, req?: Request) {
  const base = process.env.NEXT_PUBLIC_SITE_URL
    || (req ? new URL(req.url).origin : "");
  return `${base}${chemin}`;
}
