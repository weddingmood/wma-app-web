#!/usr/bin/env node
/**
 * tools/check-syntax.mjs
 * ---------------------------------------------------------------------------
 * Vérification syntaxique du kit avec le compilateur TypeScript, plus deux
 * contrôles éditoriaux du projet (aucun emoji, aucun tiret cadratin) et la
 * cohérence des imports relatifs.
 *
 *   node tools/check-syntax.mjs
 *
 * TypeScript n'est pas installé par ce script : il utilise celui de votre
 * dépôt (dépendance de Next.js). Lancez-le depuis la racine du dépôt après
 * avoir copié le kit, ou avec NODE_PATH pointant vers un node_modules.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// TypeScript vient de votre dépôt (dépendance de Next.js).
const require = createRequire(import.meta.url);
let ts;
try {
  ts = require("typescript");
} catch {
  let dir = RACINE;
  const candidats = process.env.TS_PATH ? [process.env.TS_PATH] : [];
  for (let i = 0; i < 8; i++) {
    candidats.push(join(dir, "node_modules", "typescript"));
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  for (const c of candidats) { if (existsSync(c)) { try { ts = require(c); break; } catch {} } }
}
if (!ts) {
  console.error("TypeScript introuvable. Installez-le (npm i -D typescript) ou indiquez TS_PATH=/chemin/vers/typescript");
  process.exit(2);
}


function fichiers(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (["node_modules", ".next", "out", "dist"].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) fichiers(p, out);
    else if (/\.(ts|tsx)$/.test(e)) out.push(p);
  }
  return out;
}

let erreurs = 0, lus = 0;
const importsRelatifs = [];
const cibles = [...fichiers(join(RACINE, "src")), ...fichiers(join(RACINE, "tests"))].sort();

for (const f of cibles.filter(f => /\.(ts|tsx)$/.test(f))) {
  const code = readFileSync(f, "utf8");
  lus++;
  const sf = ts.createSourceFile(f, code, ts.ScriptTarget.ES2022, true,
    f.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const diag = sf.parseDiagnostics || [];
  if (diag.length) {
    erreurs += diag.length;
    for (const d of diag) {
      const { line, character } = sf.getLineAndCharacterOfPosition(d.start);
      console.log(`[SYNTAXE] ${relative(RACINE, f)}:${line + 1}:${character + 1} ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
    }
  }
  const visite = (n) => {
    if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
      const spec = n.moduleSpecifier.text;
      if (spec.startsWith(".")) importsRelatifs.push({ depuis: f, spec });
    }
    n.forEachChild(visite);
  };
  sf.forEachChild(visite);
}

let casses = 0;
for (const { depuis, spec } of importsRelatifs) {
  const base = resolve(dirname(depuis), spec);
  if (![base, base + ".ts", base + ".tsx", base + ".mjs", base + ".js", join(base, "index.ts")].some(existsSync)) {
    casses++;
    console.log(`[IMPORT] ${relative(RACINE, depuis)} -> ${spec} : cible introuvable`);
  }
}

let editoriaux = 0;
for (const f of cibles) {
  const code = readFileSync(f, "utf8");
  const emoji = code.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}]/gu);
  const cadratin = code.match(/[\u2013\u2014]/g);
  if (emoji) { editoriaux++; console.log(`[EMOJI] ${relative(RACINE, f)} : ${[...new Set(emoji)].join(" ")}`); }
  if (cadratin) { editoriaux++; console.log(`[CADRATIN] ${relative(RACINE, f)} : ${cadratin.length} occurrence(s)`); }
}

console.log(`\n${lus} fichiers TypeScript analysés`);
console.log(`${erreurs} erreur(s) de syntaxe - ${casses} import(s) relatif(s) cassé(s) - ${editoriaux} faute(s) éditoriale(s)`);
process.exit(erreurs + casses + editoriaux === 0 ? 0 : 1);
