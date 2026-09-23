// Applique le correctif de sécurité des sessions (cookies signés, plus de couple par défaut).
// Usage : node outils/appliquer-securite.mjs   (à lancer depuis la racine du projet)
// Rien n'est modifié si un des fichiers ne ressemble pas à ce qui est attendu.

import fs from "node:fs";
import path from "node:path";

const racine = process.cwd();
const sauvegardes = path.join(racine, "sauvegardes-securite");

function lire(rel) {
  const brut = fs.readFileSync(path.join(racine, rel), "utf8").replace(/^\uFEFF/, "");
  return { crlf: brut.includes("\r\n"), texte: brut.replace(/\r\n/g, "\n") };
}

function compter(texte, motif) {
  return (texte.match(motif) || []).length;
}

function arreter(message) {
  console.log("ARRET : " + message + " -- rien n'a ete modifie");
  process.exit(1);
}

const fichiers = {
  helpers: "src/lib/auth-helpers.ts",
  auth: "src/app/api/auth/route.ts",
  admin: "src/app/api/admin/auth/route.ts",
  jeton: "src/lib/session-token.ts",
};

if (!fs.existsSync(path.join(racine, fichiers.jeton))) {
  arreter("src/lib/session-token.ts est absent (copiez d'abord le dossier src du zip)");
}

const h = lire(fichiers.helpers);
const a = lire(fichiers.auth);
const d = lire(fichiers.admin);

// ---- 1. auth-helpers.ts : remplacement complet (3 exports identiques) ----
if (
  !h.texte.includes("export async function getCurrentSession") ||
  !h.texte.includes("Fallback: If no session cookie") ||
  h.texte.includes("verifyToken")
) {
  arreter("auth-helpers.ts n'a pas l'aspect attendu (ou est deja corrige)");
}

const helpersNouveau = `import { cookies } from "next/headers";
import { db } from "@/db";
import { couples, admins } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { verifyToken } from "@/lib/session-token";

export function hashPassword(plainText: string): string {
  return crypto.createHash("sha256").update(plainText).digest("hex");
}

export interface SessionData {
  coupleId?: number;
  coupleSlug?: string;
  activePartner: "partner1" | "partner2";
  partnerName: string;
  isAdmin?: boolean;
  adminId?: number;
}

export async function getCurrentSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("wm_session")?.value;
  const adminToken = cookieStore.get("wm_admin_session")?.value;

  // Les jetons sont signés : un cookie fabriqué ou modifié à la main est refusé.
  const adminDecoded = verifyToken<{ adminId: number }>(adminToken, "admin");
  if (adminDecoded) {
    try {
      const [admin] = await db.select().from(admins).where(eq(admins.id, adminDecoded.adminId)).limit(1);
      if (admin) {
        return {
          isAdmin: true,
          adminId: admin.id,
          activePartner: "partner1",
          partnerName: admin.name,
        };
      }
    } catch {
      // ignore token lookup error
    }
  }

  const coupleDecoded = verifyToken<{ coupleId: number; activePartner?: string }>(sessionToken, "couple");
  if (coupleDecoded) {
    try {
      const [couple] = await db.select().from(couples).where(eq(couples.id, coupleDecoded.coupleId)).limit(1);
      if (couple) {
        const activePartner = coupleDecoded.activePartner === "partner2" ? "partner2" : "partner1";
        const partnerName = activePartner === "partner2" ? couple.partner2Name : couple.partner1Name;
        return {
          coupleId: couple.id,
          coupleSlug: couple.slug,
          activePartner,
          partnerName,
          isAdmin: false,
        };
      }
    } catch {
      // ignore
    }
  }

  // Plus de "couple par défaut" : sans session valide, personne n'est connecté.
  return null;
}
`;

// ---- 2. api/auth/route.ts ----
let t = a.texte;
if (t.includes("verifyToken")) arreter("api/auth/route.ts est deja corrige");

const importCookies = 'import { cookies } from "next/headers";';
if (compter(t, /import \{ cookies \} from "next\/headers";/g) !== 1) arreter("import cookies introuvable (auth)");
t = t.replace(importCookies, importCookies + '\nimport { signToken, verifyToken } from "@/lib/session-token";');

const motifGet = /export async function GET\(\) \{[\s\S]*?\n\}\n\nexport async function POST/;
if (compter(t, new RegExp(motifGet.source, "g")) !== 1) arreter("fonction GET introuvable (auth)");
const nouveauGet = `export async function GET() {
  // seedDatabaseIfEmpty() désactivé sur POST pour éviter timeout 504
  const cookieStore = await cookies();
  const decoded = verifyToken<{ coupleId: number; activePartner?: string }>(
    cookieStore.get("wm_session")?.value,
    "couple"
  );

  // Plus de couple par défaut : sans session valide, rien n'est renvoyé.
  if (!decoded?.coupleId) {
    return Response.json({ success: false, message: "Non connecté" }, { status: 401 });
  }

  const activePartner: "partner1" | "partner2" =
    decoded.activePartner === "partner2" ? "partner2" : "partner1";

  const [couple] = await db.select().from(couples).where(eq(couples.id, decoded.coupleId)).limit(1);
  if (!couple) {
    return Response.json({ success: false, message: "Session invalide" }, { status: 401 });
  }

  let [prefs] = await db.select().from(couplePreferences).where(eq(couplePreferences.coupleId, couple.id)).limit(1);
  if (!prefs) {
    const [newPref] = await db.insert(couplePreferences).values({ coupleId: couple.id }).returning();
    prefs = newPref;
  }

  const { passwordHash: _, ...safeCouple } = couple;

  return Response.json({
    success: true,
    couple: safeCouple,
    preferences: prefs,
    activePartner,
    partnerName: activePartner === "partner2" ? couple.partner2Name : couple.partner1Name,
  });
}

export async function POST`;
t = t.replace(motifGet, () => nouveauGet);

const motifPayload =
  /const sessionPayload = Buffer\.from\(\s*JSON\.stringify\(\{\s*coupleId: ([^,\n]+),\s*coupleSlug: ([^,\n]+),\s*activePartner: ([^,\n]+?),?\s*\}\)\s*\)\.toString\("base64"\);/g;
if (compter(t, motifPayload) !== 2) arreter("creation de session (connexion/inscription) introuvable (auth)");
t = t.replace(
  motifPayload,
  'const sessionPayload = signToken(\n      { typ: "couple", coupleId: $1, coupleSlug: $2, activePartner: $3 },\n      60 * 60 * 24 * 30\n    );'
);

const motifDecode = /const decoded = JSON\.parse\(Buffer\.from\(sessionToken, "base64"\)\.toString\("utf8"\)\);/g;
if (compter(t, motifDecode) !== 1) arreter("lecture de session (changement de partenaire) introuvable (auth)");
t = t.replace(
  motifDecode,
  `const decoded = verifyToken<{ coupleId: number; coupleSlug?: string; activePartner?: string }>(
      sessionToken,
      "couple"
    );
    if (!decoded) {
      return Response.json({ success: false, message: "Session invalide" }, { status: 401 });
    }`
);

const motifNouveau = /const newPayload = Buffer\.from\(JSON\.stringify\(decoded\)\)\.toString\("base64"\);/g;
if (compter(t, motifNouveau) !== 1) arreter("reecriture de session (changement de partenaire) introuvable (auth)");
t = t.replace(
  motifNouveau,
  `const newPayload = signToken(
      {
        typ: "couple",
        coupleId: decoded.coupleId,
        coupleSlug: decoded.coupleSlug,
        activePartner: decoded.activePartner,
      },
      60 * 60 * 24 * 30
    );`
);
const authNouveau = t;

// ---- 3. api/admin/auth/route.ts ----
let u = d.texte;
if (u.includes("verifyToken")) arreter("api/admin/auth/route.ts est deja corrige");

const importSeed = 'import { seedDatabaseIfEmpty, hashPassword } from "@/lib/seed";';
if (compter(u, /import \{ seedDatabaseIfEmpty, hashPassword \} from "@\/lib\/seed";/g) !== 1) arreter("import seed introuvable (admin)");
u = u.replace(importSeed, importSeed + '\nimport { signToken, verifyToken } from "@/lib/session-token";');

const motifAdminDecode = /const decoded = JSON\.parse\(Buffer\.from\(adminToken, "base64"\)\.toString\("utf8"\)\);/g;
if (compter(u, motifAdminDecode) !== 2) arreter("lecture du cookie admin introuvable (admin)");
u = u.replace(
  motifAdminDecode,
  'const decoded = verifyToken<{ adminId: number }>(adminToken, "admin");\n    if (!decoded) throw new Error("Session invalide");'
);

const motifAdminPayload = /const payload = Buffer\.from\(JSON\.stringify\(\{ adminId: admin\.id, role: admin\.role \}\)\)\.toString\("base64"\);/g;
if (compter(u, motifAdminPayload) !== 1) arreter("creation du cookie admin introuvable (admin)");
u = u.replace(
  motifAdminPayload,
  'const payload = signToken({ typ: "admin", adminId: admin.id, role: admin.role }, 60 * 60 * 24 * 7);'
);

// ---- Ecriture (sauvegardes d'abord, fins de ligne d'origine conservées) ----
fs.mkdirSync(sauvegardes, { recursive: true });
for (const [cle, rel] of Object.entries(fichiers)) {
  if (cle === "jeton") continue;
  fs.copyFileSync(path.join(racine, rel), path.join(sauvegardes, rel.replace(/[\\/]/g, "__")));
}

function ecrire(rel, texte, crlf) {
  fs.writeFileSync(path.join(racine, rel), crlf ? texte.replace(/\n/g, "\r\n") : texte, "utf8");
}
ecrire(fichiers.helpers, helpersNouveau, h.crlf);
ecrire(fichiers.auth, authNouveau, a.crlf);
ecrire(fichiers.admin, u, d.crlf);

console.log("OK : securite des sessions appliquee (3 fichiers modifies, sauvegardes dans sauvegardes-securite)");
