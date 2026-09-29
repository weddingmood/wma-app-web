#!/usr/bin/env node
/**
 * tools/check-imports.mjs
 * ---------------------------------------------------------------------------
 * Vérifie que chaque import nommé du kit correspond à un export réel du
 * fichier cible. C'est exactement l'erreur que Turbopack signale au build :
 *
 *   Export ecrire doesn't exist in target module
 *
 * Le contrôle de syntaxe (tools/check-syntax.mjs) ne la voit pas : il ne
 * vérifie que l'existence du fichier, pas celle des symboles.
 *
 *   node tools/check-imports.mjs
 *
 * Portée : les fichiers du dépôt dont le chemin est sous src/. Les modules
 * externes (react, next/server, drizzle-orm, lucide-react) sont ignorés.
 * Les alias @/lib/... et @/db/... sont résolus dans votre src/. Un import
 * vers un fichier qui n'existe pas dans src/ (par exemple @/db si votre
 * accès base est ailleurs) est signalé comme « non résolu », pas comme une
 * erreur : à vous de juger.
 *
 * Seule dépendance : TypeScript, déjà présent dans votre dépôt Next.js.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

/** TypeScript vient de votre dépôt : TS_PATH, puis node_modules en remontant. */
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
  for (const c of candidats) {
    if (!existsSync(c)) continue;
    try { return require(c); } catch {}
  }
  try { return require("typescript"); } catch { return null; }
}
const ts = trouverTypeScript();
if (!ts) {
  console.error("TypeScript introuvable. Installez-le (npm i -D typescript)");
  console.error("ou lancez avec TS_PATH=/chemin/vers/node_modules/typescript");
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

/** Résout un spécificateur vers un fichier du dépôt. null si non résolu. */
function resoudre(depuis, spec) {
  let base;
  if (spec.startsWith(".")) base = resolve(dirname(depuis), spec);
  else if (spec.startsWith("@/")) base = join(RACINE, "src", spec.slice(2));
  else return null;                                   // module externe
  for (const c of [base, base + ".ts", base + ".tsx", join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

const sourceDe = (f) =>
  ts.createSourceFile(f, readFileSync(f, "utf8"), ts.ScriptTarget.ES2022, true,
    f.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

/** Noms exportés par un fichier, en suivant les `export *`. */
const memo = new Map();
function exportsDe(fichier, vu = new Set()) {
  if (memo.has(fichier)) return memo.get(fichier);
  if (vu.has(fichier)) return new Set();              // cycle : on s'arrête
  vu.add(fichier);

  const noms = new Set();
  const sf = sourceDe(fichier);
  const visite = (n) => {
    if (ts.isExportDeclaration(n)) {
      if (n.exportClause && ts.isNamedExports(n.exportClause)) {
        for (const e of n.exportClause.elements) noms.add(e.name.text);
      } else if (!n.exportClause && n.moduleSpecifier) {          // export * from
        const cible = resoudre(fichier, n.moduleSpecifier.text);
        if (cible) for (const x of exportsDe(cible, vu)) noms.add(x);
      }
    } else if (ts.isExportAssignment(n)) {
      noms.add("default");
    } else if (n.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      if (ts.isFunctionDeclaration(n) || ts.isClassDeclaration(n) || ts.isInterfaceDeclaration(n)
          || ts.isTypeAliasDeclaration(n) || ts.isEnumDeclaration(n) || ts.isModuleDeclaration(n)) {
        if (n.name) noms.add(n.name.text);
      } else if (ts.isVariableStatement(n)) {
        for (const d of n.declarationList.declarations) if (d.name?.text) noms.add(d.name.text);
      }
    }
    n.forEachChild(visite);
  };
  sf.forEachChild(visite);
  memo.set(fichier, noms);
  return noms;
}

let echecs = 0, verifs = 0, nonResolus = 0;
const nonResolusListe = [];

for (const f of fichiers(join(RACINE, "src")).sort()) {
  const sf = sourceDe(f);
  const visite = (n) => {
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
      const spec = n.moduleSpecifier.text;
      const bindings = n.importClause?.namedBindings;

      if (spec.startsWith(".") || spec.startsWith("@/")) {
        if (!resoudre(f, spec)) {
          nonResolus++;
          nonResolusListe.push(`${relative(RACINE, f)} -> ${spec}`);
        }
      }

      const cible = resoudre(f, spec);
      if (cible && bindings && ts.isNamedImports(bindings)) {
        const dispo = exportsDe(cible);
        for (const e of bindings.elements) {
          verifs++;
          const nom = e.propertyName ? e.propertyName.text : e.name.text;
          if (!dispo.has(nom)) {
            echecs++;
            console.log(`[IMPORT] ${relative(RACINE, f)} -> ${spec} : export « ${nom} » inexistant`);
            console.log(`         disponibles : ${[...dispo].sort().join(", ").slice(0, 240)}`);
          }
        }
      }
    }
    n.forEachChild(visite);
  };
  sf.forEachChild(visite);
}

console.log(`\n${verifs} imports nommés vérifiés - ${echecs} en échec - ${nonResolus} non résolus`);
if (nonResolusListe.length) {
  console.log("\nSpécificateurs non résolus dans src/ (à vérifier, pas forcément une erreur) :");
  for (const l of [...new Set(nonResolusListe)].slice(0, 20)) console.log(`  - ${l}`);
}
process.exit(echecs === 0 ? 0 : 1);
