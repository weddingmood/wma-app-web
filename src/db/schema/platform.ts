/**
 * src/db/schema/platform.ts
 * ---------------------------------------------------------------------------
 * Schéma Drizzle des NOUVELLES tables uniquement (celles de la migration
 * supabase/migrations/2026_09_28_six_piliers.sql).
 *
 * Aucune table existante n'est redéclarée ici : vous gardez votre propre
 * schéma (src/db/schema.ts).
 *
 * CALÉ sur vos types réels : vos clés primaires sont des `serial` (integer),
 * vos montants des `integer` (FCFA) et vos dates des `varchar(50)`. Les
 * nouvelles tables suivent exactement ces conventions, sinon les clés
 * étrangères vers couples(id) seraient refusées par PostgreSQL (integer et
 * bigint ne sont pas compatibles pour une référence).
 *
 * Si votre projet regroupe son schéma dans un seul fichier (ex.
 * src/db/schema.ts), collez ces déclarations à la suite des vôtres et
 * supprimez ce fichier, puis dans src/lib/platform.ts remplacez
 *   export * from "@/db/schema/platform";
 * par
 *   export * from "@/db/schema";
 */

import { sql } from "drizzle-orm";
import {
  pgTable, serial, text, boolean, integer, varchar, timestamp,
  uniqueIndex, index, check
} from "drizzle-orm/pg-core";

/* ── Pilier 1 : cérémonies configurables par pays ───────────────────────── */
export const ceremonies = pgTable("ceremonies", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  key: text("key").notNull(),                  // fiancailles | civil | religieuse | traditionnelle | reception
  label: text("label").notNull(),              // intitulé choisi par le couple
  isEnabled: boolean("is_enabled").notNull().default(false),
  position: integer("position").notNull().default(0),
  eventDate: varchar("event_date", { length: 50 }),
  eventTime: text("event_time"),
  location: text("location"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, t => ({
  uniqueCoupleCle: uniqueIndex("ceremonies_couple_key_unique").on(t.coupleId, t.key),
  parCouple: index("ceremonies_couple_idx").on(t.coupleId)
}));

/* ── Piliers 2 et 3 : aucune table nouvelle ────────────────────────────────
   L'argent des invités va dans VOTRE cagnotte_contributions et les réglages
   de la cagnotte sont des colonnes de VOTRE table invitations. La table
   gift_contributions prévue au départ est abandonnée : deux tables pour le
   même argent auraient fait deux vérités contradictoires.
   Les noms exacts sont dans COLONNES.contributions et COLONNES.invitations
   (src/lib/platform.ts). */


/* ── Pilier 4 : animations jouables depuis le lien d'invitation ─────────── */
export const coupleQuizQuestions = pgTable("couple_quiz_questions", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  question: text("question").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c"),
  optionD: text("option_d"),
  goodAnswer: text("good_answer").notNull().default("a"),
  explanation: text("explanation"),
  position: integer("position").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, t => ({ parCouple: index("quiz_couple_idx").on(t.coupleId) }));

export const coupleRiddles = pgTable("couple_riddles", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  riddle: text("riddle").notNull(),
  answer: text("answer").notNull(),
  hint: text("hint"),
  position: integer("position").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, t => ({ parCouple: index("riddle_couple_idx").on(t.coupleId) }));

export const coupleGamePlays = pgTable("couple_game_plays", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  guestName: text("guest_name"),
  kind: text("kind").notNull().default("quiz"),
  score: integer("score").notNull().default(0),
  total: integer("total").notNull().default(0),
  playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow()
}, t => ({ parCouple: index("play_couple_idx").on(t.coupleId) }));

/* ── Pilier 5 : marketplace des prestataires ────────────────────────────── */
export const providerLeads = pgTable("provider_leads", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull(),
  coupleId: integer("couple_id"),
  coupleName: text("couple_name"),
  couplePhone: text("couple_phone"),
  weddingDate: varchar("wedding_date", { length: 50 }),
  message: text("message"),
  whatsappLink: text("whatsapp_link"),
  status: text("status").notNull().default("envoye"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, t => ({ parPrestataire: index("lead_provider_idx").on(t.providerId) }));

export const providerFeatures = pgTable("provider_features", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull(),
  paymentId: integer("payment_id"),
  days: integer("days").notNull().default(30),
  amount: integer("amount").notNull().default(10000),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, t => ({ parPrestataire: index("feature_provider_idx").on(t.providerId) }));

/* ── Types dérivés (pratiques dans les Route Handlers) ──────────────────── */
export type Ceremonie = typeof ceremonies.$inferSelect;
/* Il n'y a plus de type Cadeau : les gestes des invités sont des lignes de
   votre table cagnotte_contributions, déclarée dans votre src/db/schema.ts. */
export type QuestionQuiz = typeof coupleQuizQuestions.$inferSelect;
export type Devinette = typeof coupleRiddles.$inferSelect;
export type Partie = typeof coupleGamePlays.$inferSelect;
export type DemandePrestataire = typeof providerLeads.$inferSelect;
export type MiseEnAvant = typeof providerFeatures.$inferSelect;
