#!/usr/bin/env node
/**
 * tools/check-sql.mjs
 * ---------------------------------------------------------------------------
 * Exécute chaque fonction de src/lib/queries.ts contre une base fictive qui
 * capture le SQL produit, puis vérifie ce SQL :
 *
 *   1. aucune interpolation de modèle oubliée (${...}) ;
 *   2. aucun paramètre positionnel ($1, $2...) non substitué ;
 *   3. chaque table nommée existe dans votre schéma ou dans la migration ;
 *   4. chaque colonne qualifiée (alias.colonne) existe vraiment.
 *
 * C'est le contrôle qui aurait détecté, sans base de données et sans build,
 * les colonnes inventées (providers.slug, providers.views, cagnottes.is_visible)
 * et la table inexistante (cagnottes).
 *
 *   node tools/check-sql.mjs
 *
 * Aucune connexion : la base est simulée. Aucune écriture sur votre dépôt.
 * Seule dépendance : TypeScript, déjà présent dans votre dépôt.
 */
import { readFileSync, existsSync, writeFileSync, mkdtempSync, statSync, rmSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

function trouverTypeScript() {
  const candidats = [];
  if (process.env.TS_PATH) candidats.push(process.env.TS_PATH);
  let dir = RACINE;
  for (let i = 0; i < 8; i++) {
    candidats.push(join(dir, "node_modules", "typescript"));
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  for (const c of candidats) { if (existsSync(c)) { try { return require(c); } catch {} } }
  try { return require("typescript"); } catch { return null; }
}
const ts = trouverTypeScript();
if (!ts) { console.error("TypeScript introuvable."); process.exit(2); }

/* ═══════════════════════════════════════════════════════════════════════════
   Schéma de référence : vos tables réelles (src/db/schema.ts) et les tables
   créées par supabase/migrations/2026_09_28_six_piliers.sql.
   ═══════════════════════════════════════════════════════════════════════════ */
const SCHEMA = {
  couples: ["id","slug","partner1_name","partner2_name","partner1_email","partner2_email","partner1_role","partner2_role","partner1_photo","partner2_photo","wedding_date","city","venue","total_budget","estimated_guests","ceremony_types","church","pastor_name","ethnicity","traditions","bible_verse","status","trial_ends_at","password_hash","shared_passcode","access_code","plan_type","plan_amount","partner1_access_active","partner2_access_active","created_at","updated_at","country"],
  invitations: ["id","couple_id","slug","hero_title","love_story","testimony","wedding_date","wedding_time","dot_date","civil_date","church_date","reception_date","venue_name","venue_address","venue_map_url","hero_image_url","has_photo","photo_layout","photo_zoom","photo_position","sub_title","card_template","sans_photo_style","ceremonies_selected","ceremonies_details","intro_text","additional_info","final_message","gallery_photos","pastor_word","blessing_message","custom_verse","publication_status","is_published","rsvp_deadline","custom_primary_color","custom_secondary_color","custom_accent_color","custom_text_color","custom_font_family","custom_font_size","custom_text_align","photo_position_x","photo_position_y","show_countdown","show_story","show_programme","show_locations","show_verse","show_rsvp","show_cagnotte","show_qr_code","cagnotte_enabled","cagnotte_title","cagnotte_description","cagnotte_payment_method","cagnotte_payment_url","cagnotte_button_text","cagnotte_updated_at","created_at","cagnotte_goal_amount"],
  cagnotte_contributions: ["id","couple_id","donor_name","donor_phone","amount","message","payment_reference","is_verified","created_at"],
  providers: ["id","business_name","contact_name","service","city","whatsapp","email","price_from","description","photos","status","admin_notes","reviewed_at","reviewed_by","created_at","updated_at","country"],
  payments: ["id","couple_id","amount","plan_type","payer_email","payer_partner","payment_date","reference_number","proof_image_url","status","admin_notes","rejection_reason","reviewed_at","reviewed_by","created_at"],
  guests: ["id","couple_id","first_name","last_name","group_name","phone","email","plus_ones_allowed","plus_ones_confirmed","rsvp_status","dietary_needs","table_number","notes","qr_code_token","is_checked_in","checked_in_at","created_at"],
  rsvps: ["id","invitation_id","guest_id","guest_name","email","phone","attending","attendance_status","plus_ones_count","message_for_couple","prayer_wishes","advice_wishes","submitted_at"],
  quiz_questions: ["id","category","question","options","correct_option_index","explanation","bible_ref","ivorian_context","day_number","created_at"],
  quiz_attempts: ["id","couple_id","quiz_question_id","partner_key","chosen_option","is_correct","discussion_notes","attempted_at"],
  game_sessions: ["id","couple_id","game_type","game_state","mode","ai_level","turn","score1","score2","status","winner","room_code","last_move_at","updated_at"],
  admins: ["id","email","password_hash","name","role","created_at"],
  /* tables créées par la migration du kit */
  ceremonies: ["id","couple_id","key","label","is_enabled","position","event_date","event_time","location","note","created_at","updated_at"],
  couple_quiz_questions: ["id","couple_id","question","option_a","option_b","option_c","option_d","good_answer","explanation","position","is_public","created_at"],
  couple_riddles: ["id","couple_id","riddle","answer","hint","position","is_public","created_at"],
  couple_game_plays: ["id","couple_id","guest_name","kind","score","total","played_at"],
  provider_leads: ["id","provider_id","couple_id","couple_name","couple_phone","wedding_date","message","whatsapp_link","status","created_at"],
  provider_features: ["id","provider_id","payment_id","days","amount","starts_at","ends_at","created_at"],
  /* vues de la migration */
  v_public_ceremonies: ["couple_id","key","label","is_enabled","position","event_date","event_time","location"],
  v_public_gifts: ["couple_id","collecte","gestes","en_attente","objectif","visible"]
};

/* ═══════════════════════════════════════════════════════════════════════════
   Chargeur : transpile les .ts du kit à la volée, avec des modules virtuels
   pour la base, les sessions et next/server.
   ═══════════════════════════════════════════════════════════════════════════ */
/* Le dossier temporaire doit rester sous votre dépôt pour que Node puisse
   résoudre next/server et drizzle-orm. node_modules/.cache est ignoré par Git
   et supprimé à la fin. Repli sur le dossier temporaire système sinon. */
const NODE_MODULES = join(RACINE, "node_modules");
const TMP = existsSync(NODE_MODULES)
  ? mkdtempSync(join(NODE_MODULES, ".cache", "check-sql-"))
  : mkdtempSync(join(tmpdir(), "check-sql-"));
const cache = new Map();

const VIRTUELS = {
  "@/db": `export const db = globalThis.__DB__; export const client = {};`,
  "@/lib/auth-helpers": `export async function getCurrentSession() { return null; }
                        export async function hashPassword(x) { return x; }`,
  "next/server": `export class NextResponse { static json(o, init) { return { corps: o, statut: init?.status || 200 }; } }`
};

/** Capture le SQL au lieu de l'exécuter : on instrumente lire() et ecrire(). */
const INSTRUMENT = [
  [`export async function lire<T = any>(requete: string, valeurs: any[] = []): Promise<T[]> {`,
   `export async function lire<T = any>(requete: string, valeurs: any[] = []): Promise<T[]> {
  (globalThis as any).__SQL__.push(sqlEscape(requete, valeurs));
  if ((globalThis as any).__SIMULER__) return [] as T[];`],
  [`export async function ecrire<T = any>(requete: string, valeurs: any[] = []): Promise<T[]> {`,
   `export async function ecrire<T = any>(requete: string, valeurs: any[] = []): Promise<T[]> {
  (globalThis as any).__SQL__.push(sqlEscape(requete, valeurs));
  if ((globalThis as any).__SIMULER__) return [] as T[];`]
];

function resoudre(spec, depuis) {
  if (spec.startsWith(".")) return resolve(dirname(depuis), spec);
  if (spec.startsWith("@/")) return join(RACINE, "src", spec.slice(2));
  return null;
}

/** Résout vers un FICHIER : les extensions d'abord, puis index, jamais un dossier. */
function versFichier(spec) {
  if (!spec) return null;
  for (const c of [spec + ".ts", spec + ".tsx", join(spec, "index.ts"), join(spec, "index.tsx"), spec]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

/* Chaque import du kit est réécrit vers un chemin absolu déjà transpilé :
   les modules virtuels pour la base, les sessions et next/server, les fichiers
   réels pour le reste. Les modules externes (drizzle-orm) sont laissés tels
   quels et résolus normalement grâce à l'emplacement du dossier temporaire. */
function preparer(fichier) {
  /* Mémoïsation AVANT la récursion : un cycle d'imports (ou une simple
     mention du chemin dans un commentaire) ne peut plus boucler. */
  if (cache.has(fichier)) return cache.get(fichier);
  const sortie = join(TMP, `p-${cache.size}.mjs`);
  cache.set(fichier, sortie);

  let src = readFileSync(fichier, "utf8");
  for (const [avant, apres] of INSTRUMENT) src = src.split(avant).join(apres);
  src = src.replace(/from\s+"([^"]+)"/g, (m, spec) => {
    /* modules simulés : base, sessions, next/server */
    if (VIRTUELS[spec]) {
      const f = join(TMP, `v-${Buffer.from(spec).toString("hex").slice(0, 24)}.mjs`);
      if (!existsSync(f)) writeFileSync(f, VIRTUELS[spec]);
      return `from "${pathToFileURL(f).href}"`;
    }
    /* fichiers du kit : transpilés à la volée */
    if (spec.startsWith(".") || spec.startsWith("@/")) {
      const cible = versFichier(resoudre(spec, fichier));
      return cible ? `from "${pathToFileURL(preparer(cible)).href}"` : m;
    }
    /* module externe réel (drizzle-orm) : laissé tel quel */
    return m;
  });
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  writeFileSync(sortie, js);
  return sortie;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Appels représentatifs : un jeu d'arguments par fonction de queries.ts
   ═══════════════════════════════════════════════════════════════════════════ */
const APPELS = {
  coupleParSlug: ["aya-et-kofi"],
  coupleParId: [1],
  accesCouple: [{ id: 1, status: "trial", trial_ends_at: null, country: "CI" }],
  ceremoniesDuCouple: [1],
  enregistrerCeremonie: [1, { key: "civil", label: "Mariage civil", isEnabled: true, position: 2, eventDate: "2026-12-01", eventTime: "10:00", location: "Abidjan" }],
  cagnotteDuCouple: [1],
  creerCagnotteSiAbsente: [1],
  compteurCadeaux: [1],
  cadeauxDuCouple: [1, 50],
  insererCadeau: [1, { donorName: "Aya Kouassi", donorPhone: "0700000000", message: "Félicitations", amount: 5000, reference: "WAVE-9981" }],
  confirmerCadeau: [1, 2, "confirme"],
  visibiliteCagnotte: [1, true],
  definirObjectifCagnotte: [1, 500000],
  questionsQuiz: [1, true],
  devinettes: [1, true],
  enregistrerPartie: [1, { guestName: "Kofi", kind: "quiz", score: 3, total: 5 }],
  statistiquesJeux: [1],
  providersPublics: [],
  providerParId: ["3"],
  insererLead: [3, { coupleId: 1, coupleName: "Aya et Kofi", couplePhone: "0700000000", weddingDate: "2026-12-01", message: "Bonjour", whatsappLink: "https://wa.me/22570000000" }],
  leadsDunPrestataire: [3],
  activerMiseEnAvant: [3, 30, 10000, 7],
  retirerMiseEnAvant: [3],
  compterMisesEnAvantActives: [],
  ouvrirEssai: [1, new Date(Date.now() + 14 * 86400000)],
  declarerPaiement: [1, { amount: 3000, planType: "couple", payerEmail: "aya@exemple.ci", payerPartner: "partner1", paymentDate: "2026-09-29", referenceNumber: "WAVE-9981", proofImageUrl: null, operator: "wave", note: "Objet : activation" }],
  statistiquesInvitation: [1]
};

/* ═══════════════════════════════════════════════════════════════════════════
   Vérifications du SQL capturé
   ═══════════════════════════════════════════════════════════════════════════ */
const MOTS_CLEFS = new Set(["select","from","where","and","or","not","null","as","on","join","left","lateral",
  "group","order","by","limit","insert","into","values","update","set","returning","case","when","then","else",
  "end","count","sum","coalesce","filter","distinct","desc","asc","inner","outer","cross","now","true","false",
  "is","in","exists","interval","cast","lower","upper","text","integer","boolean","with","recursive","union","all"]);

function aliasDuSql(sqlTexte) {
  const alias = new Map();
  const re = /\b(?:FROM|JOIN|UPDATE|INTO)\s+([a-z_][a-z0-9_]*)\s+(?:AS\s+)?([a-z][a-z0-9_]*)/gi;
  let m;
  while ((m = re.exec(sqlTexte))) {
    const table = m[1].toLowerCase(), a = m[2].toLowerCase();
    if (MOTS_CLEFS.has(a) || SCHEMA[table] === undefined) continue;
    alias.set(a, table);
    alias.set(table, table);
  }
  /* tables sans alias */
  const re2 = /\b(?:FROM|JOIN|UPDATE|INTO)\s+([a-z_][a-z0-9_]*)/gi;
  while ((m = re2.exec(sqlTexte))) {
    const table = m[1].toLowerCase();
    if (!MOTS_CLEFS.has(table)) alias.set(table, table);
  }
  return alias;
}

function verifierSql(sqlTexte, origine) {
  const problemes = [];

  if (sqlTexte.includes("${")) problemes.push(`interpolation non résolue : \${...}`);
  const restes = sqlTexte.match(/\$\d+/g);
  if (restes) problemes.push(`paramètres non substitués : ${[...new Set(restes)].join(", ")}`);

  const alias = aliasDuSql(sqlTexte);

  /* tables inconnues */
  for (const [nom, table] of alias) {
    if (nom === table && !SCHEMA[table]) problemes.push(`table inconnue : ${table}`);
  }
  const reTable = /\b(?:FROM|JOIN|UPDATE|INTO)\s+([a-z_][a-z0-9_]*)/gi;
  let m;
  while ((m = reTable.exec(sqlTexte))) {
    const t = m[1].toLowerCase();
    if (!MOTS_CLEFS.has(t) && !SCHEMA[t]) problemes.push(`table inconnue : ${t}`);
  }

  /* colonnes qualifiées : alias.colonne */
  const reCol = /\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\b/gi;
  while ((m = reCol.exec(sqlTexte))) {
    const a = m[1].toLowerCase(), col = m[2].toLowerCase();
    if (MOTS_CLEFS.has(a)) continue;
    const table = alias.get(a);
    if (!table) continue;                       /* alias non résolu : on ne conclut pas */
    const connues = SCHEMA[table];
    if (!connues) continue;
    if (!connues.includes(col)) problemes.push(`colonne inexistante : ${table}.${col} (écrit ${a}.${col})`);
  }

  return [...new Set(problemes)];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
globalThis.__SQL__ = [];
globalThis.__SIMULER__ = true;
globalThis.__DB__ = { execute: () => ({ rows: [] }) };

const queries = join(RACINE, "src", "lib", "queries.ts");
if (!existsSync(queries)) { console.error("src/lib/queries.ts introuvable."); process.exit(2); }

const module = await import(pathToFileURL(preparer(queries)).href);
const fonctions = Object.keys(module).filter(k => typeof module[k] === "function");

let captures = 0, problemes = 0, nonCouvertes = [];
const parFonction = new Map();

for (const nom of fonctions.sort()) {
  if (nom === "sqlEscape" || nom === "literal") continue;
  const args = APPELS[nom];
  if (!args) { nonCouvertes.push(nom); continue; }
  const avant = globalThis.__SQL__.length;
  try {
    await module[nom](...args);
  } catch (e) {
    /* une fonction peut s'arrêter sur un résultat vide : le SQL déjà émis reste valable */
  }
  const emis = globalThis.__SQL__.slice(avant);
  parFonction.set(nom, emis);
  for (const s of emis) {
    captures++;
    const pb = verifierSql(s, nom);
    if (pb.length) {
      problemes += pb.length;
      console.log(`\n[SQL] ${nom}`);
      for (const p of pb) console.log(`      ${p}`);
      console.log(`      requête : ${s.replace(/\s+/g, " ").trim().slice(0, 300)}`);
    }
  }
}

/* honnêteté sur la couverture : une fonction qui n'émet aucune requête
   n'a pas été réellement vérifiée (garde anticipée, retour sur résultat vide...) */
const muettes = [...parFonction.entries()].filter(([, v]) => v.length === 0).map(([k]) => k);

console.log(`\n${fonctions.length - nonCouvertes.length} fonctions appelées sur ${fonctions.length}`);
if (muettes.length) {
  console.log(`\nFonctions appelées mais n'ayant émis aucune requête (non vérifiées de fait) :`);
  for (const n of muettes) console.log(`  - ${n}`);
}
console.log(`${captures} requêtes SQL capturées et vérifiées - ${problemes} problème(s)`);
if (nonCouvertes.length) {
  console.log(`\nFonctions sans jeu d'arguments (non exercées) :`);
  for (const n of nonCouvertes) console.log(`  - ${n}`);
}
try { rmSync(TMP, { recursive: true, force: true }); } catch {}
process.exit(problemes === 0 ? 0 : 1);
