#!/usr/bin/env node
/**
 * tests/logique-pure.mjs
 * ---------------------------------------------------------------------------
 * Vérifie la logique métier des six piliers SANS base de données et SANS
 * déploiement : les modules de src/lib/ sont transpilés à la volée puis
 * exécutés ici.
 *
 *   node tests/logique-pure.mjs
 *
 * À lancer en local avant de pousser sur GitHub : c'est le contrôle le plus
 * rapide du kit. Les tests contre le déploiement Vercel sont dans
 * tests/roadmap-vercel.mjs.
 *
 * Seule dépendance : TypeScript (déjà présent dans votre dépôt Next.js).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

/** TypeScript vient de votre dépôt (dépendance de Next.js) : on le cherche
 *  dans TS_PATH, puis en remontant les node_modules parents. */
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

/* ── mini chargeur de modules : src/lib/*.ts -> objets évalués ──────────── */
const cache = new Map();

/**
 * Charge un module de src/lib depuis un chemin ABSOLU (avec ou sans
 * extension). Passer par un chemin absolu évite tout recalcul de préfixe :
 * c'est ce qui cassait sous Windows et dès que le dossier contient une espace.
 */
function chargerAbsolu(chemin) {
  const avecExt = existsSync(chemin) ? chemin : chemin + ".ts";
  if (cache.has(avecExt)) return cache.get(avecExt);

  const source = readFileSync(avecExt, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: avecExt
  });

  const exports = {};
  const miniRequire = (spec) => {
    if (spec.startsWith(".")) return chargerAbsolu(resolve(dirname(avecExt), spec));
    throw new Error(`Module externe non chargé dans ce test : ${spec}`);
  };
  const fn = new Function("exports", "require", "module", "__filename", outputText);
  cache.set(avecExt, exports);           // inscrit avant exécution : cycles tolérés
  fn(exports, miniRequire, { exports }, avecExt);
  return exports;
}

/** Point d'entrée : nom relatif au dossier src/lib. */
function charger(nomRelatif) {
  return chargerAbsolu(join(RACINE, "src", "lib", nomRelatif.replace(/^\.\//, "")));
}

const pays = charger("./pays");
const paiements = charger("./paiements");
const plans = charger("./plans");
const vendors = charger("./vendors");
const invitation = charger("./invitation");
const partage = charger("./platform-shared");

/* ── harnais ────────────────────────────────────────────────────────────── */
let ok = 0, ko = 0;
const echecs = [];
function verifier(nom, condition, detail = "") {
  if (condition) { ok++; console.log(`  [ok]   ${nom}`); }
  else { ko++; echecs.push(nom + (detail ? ` -- ${detail}` : "")); console.log(`  [ECHEC] ${nom}${detail ? ` -- ${detail}` : ""}`); }
}
function titre(t) { console.log(`\n=== ${t} ===`); }

console.log("\nLogique pure des six piliers - Wedding Mood Africa");
console.log(`Node ${process.version} - ${new Date().toISOString()}`);

/* ═══ Pilier 1 : cérémonies par pays ═════════════════════════════════════ */
titre("Pilier 1 - cérémonies configurables par pays");
{
  verifier("quatre pays couverts", pays.codesPays().join(",") === "CI,SN,ML,CM", pays.codesPays().join(","));

  const ci = pays.getPays("CI");
  verifier("Côte d'Ivoire : cinq étapes", ci.ceremonies.length === 5);
  verifier("Côte d'Ivoire : clés attendues",
    ["fiancailles", "civil", "religieuse", "traditionnelle", "reception"].every(k => ci.ceremonies.some(c => c.key === k)));
  verifier("Côte d'Ivoire : dot par défaut", ci.ceremonies.find(c => c.key === "fiancailles").defaut === true);
  verifier("Côte d'Ivoire : traditionnelle optionnelle", ci.ceremonies.find(c => c.key === "traditionnelle").defaut === false);
  verifier("Côte d'Ivoire : 8 villes proposées", ci.villes.length === 8);

  const sn = pays.getPays("SN");
  verifier("Sénégal : coutumière par défaut", sn.ceremonies.find(c => c.key === "traditionnelle").defaut === true);
  verifier("Sénégal : civil optionnel", sn.ceremonies.find(c => c.key === "civil").defaut === false);

  const cm = pays.getPays("CM");
  verifier("Cameroun : devise XAF", cm.devise === "XAF");
  verifier("Cameroun : indicatif +237", cm.indicatif === "+237");

  verifier("pays inconnu -> repli sur CI", pays.getPays("ZZ").code === "CI");
  verifier("pays vide -> repli sur CI", pays.getPays(null).code === "CI");
  verifier("minuscules acceptées", pays.getPays("ci").code === "CI");

  // quatre étapes actives par défaut en CI
  verifier("CI : quatre étapes actives par défaut", pays.etapesActives("CI").length === 4);
  verifier("SN : quatre étapes actives par défaut", pays.etapesActives("SN").length === 4);

  // personnalisation des intitulés et de l'ordre
  const etat = pays.normaliserEtat("CI", [
    { key: "fiancailles", label: "Dot chez les Kouassi", is_enabled: true, position: 1 },
    { key: "civil", label: "Mairie de Cocody", is_enabled: true, position: 2 },
    { key: "religieuse", label: "Bénédiction", is_enabled: false, position: 3 },
    { key: "traditionnelle", label: "Cérémonie au village", is_enabled: true, position: 4 },
    { key: "reception", label: "Réception au bord de la lagune", is_enabled: true, position: 5 }
  ]);
  verifier("intitulés personnels conservés", etat[0].label === "Dot chez les Kouassi", etat[0].label);
  verifier("étape désactivée respectée", etat.find(c => c.key === "religieuse").defaut === false);
  verifier("étape optionnelle activable", etat.find(c => c.key === "traditionnelle").defaut === true);
  verifier("cinq étapes après personnalisation", etat.length === 5);
  verifier("ordre recalculé", etat.every((c, i) => c.ordre === i + 1));

  // étapes ajoutées par le couple, hors propositions du pays
  const libre = pays.ceremoniesDuCouple("CI", [
    { key: "coutume", label: "Coutume familiale", is_enabled: true, position: 9 }
  ]);
  verifier("étape libre ajoutée", libre.some(c => c.key === "coutume" && c.label === "Coutume familiale"));
  verifier("propositions du pays conservées", libre.length === 6);

  // rien d'enregistré : les propositions du pays servent d'état initial
  verifier("état initial = propositions du pays", pays.ceremoniesDuCouple("CI", []).length === 5);
  verifier("intitulés jamais vides", pays.ceremoniesDuCouple("CI", []).every(c => String(c.label).length >= 4));
}

/* ═══ Piliers 2 et 3 : mobile money et cadeaux ═══════════════════════════ */
titre("Piliers 2 et 3 - opérateurs et gestes des invités");
{
  verifier("six opérateurs référencés", paiements.OPERATEURS.length === 6);
  verifier("Wave seul actif", paiements.OPERATEURS.filter(o => o.etat === "actif").map(o => o.key).join(",") === "wave");
  verifier("Orange annoncé bientôt", paiements.getOperateur("orange").etat === "bientot");
  verifier("MTN annoncé bientôt", paiements.getOperateur("mtn").etat === "bientot");
  verifier("Moov annoncé bientôt", paiements.getOperateur("moov").etat === "bientot");
  verifier("M-Pesa prévu", paiements.getOperateur("mpesa").etat === "prevu");
  verifier("Airtel prévu", paiements.getOperateur("airtel").etat === "prevu");

  verifier("Wave accepté en CI", paiements.peutPayer("wave", "CI") === true);
  verifier("Wave accepté au CM", paiements.peutPayer("wave", "CM") === true);
  verifier("Orange refusé partout (non branché)", paiements.peutPayer("orange", "CI") === false);
  verifier("opérateur inconnu refusé", paiements.peutPayer("paypal", "CI") === false);
  verifier("opérateur vide refusé", paiements.peutPayer(null, "CI") === false);

  const lien = paiements.lienDePaiement("wave", 25000);
  verifier("lien marchand Wave généré", String(lien).startsWith("https://pay.wave.com/m/"), lien);
  verifier("montant présent dans le lien", String(lien).includes("amount=25000"));
  verifier("compte marchand Ivoirstore", paiements.WAVE_COMPTE_LIBELLE === "Ivoirstore");
  verifier("aucun lien pour Orange", paiements.lienDePaiement("orange", 25000) === null);

  // bornes des gestes
  verifier("minimum 1 000 FCFA", paiements.MONTANT_MIN === 1000);
  verifier("maximum 2 000 000 FCFA", paiements.MONTANT_MAX === 2000000);
  verifier("montant sous le plancher refusé", paiements.montantValide(500).valide === false);
  verifier("montant au-dessus du plafond refusé", paiements.montantValide(9000000).valide === false);
  verifier("montant négatif refusé", paiements.montantValide(-5000).valide === false);
  verifier("montant non numérique refusé", paiements.montantValide("abc").valide === false);
  verifier("montant valide accepté", paiements.montantValide("25000").valide === true && paiements.montantValide("25000").valeur === 25000);
  verifier("montant arrondi à l'entier", paiements.montantValide(10000.6).valeur === 10001);
  verifier("quatre montants suggérés", paiements.MONTANTS_SUGGERES.length === 4);

  // encadré affiché à l'invité
  const encadre = paiements.encadrePaiement("CI");
  verifier("encadré : un seul actif", encadre.actifs.length === 1 && encadre.actifs[0].key === "wave");
  verifier("encadré : opérateurs annoncés", encadre.annonces.length >= 3);
  verifier("encadré : aucune clé API exposée", !JSON.stringify(encadre).match(/api|secret|cle|token/i));

  // consigne pour un opérateur non branché
  const consigne = paiements.consigneOperateur("orange", 15000, "Ruth et David");
  verifier("consigne : nom du couple", consigne.includes("Ruth et David"));
  verifier("consigne : montant", consigne.includes("15000 FCFA"));
  verifier("consigne : opérateur nommé", consigne.includes("Orange Money"));
  verifier("consigne : renvoi vers la déclaration", consigne.includes("déclarez votre référence"));

  // états d'un geste
  verifier("trois états de geste", Object.keys(paiements.ETAT_CONTRIBUTION).join(",") === "declare,confirme,refuse");
  verifier("geste déclaré = à vérifier", paiements.ETAT_CONTRIBUTION.declare.label === "À vérifier");
  verifier("geste confirmé = reçu", paiements.ETAT_CONTRIBUTION.confirme.label === "Reçu");
}

/* ═══ Pilier 4 : animations ══════════════════════════════════════════════ */
titre("Pilier 4 - animations jouables depuis l'invitation");
{
  const url = invitation.urlJeux("ruth-david", "https://wma.ci");
  verifier("lien des animations construit", url === "https://wma.ci/invitation/ruth-david#animations", url);
  verifier("lien d'invitation construit", invitation.urlInvitation("ruth-david", "https://wma.ci") === "https://wma.ci/invitation/ruth-david");

  const d = invitation.deroulePublic("CI", [
    { key: "fiancailles", label: "Dot", is_enabled: true, position: 1 },
    { key: "civil", label: "Mairie", is_enabled: true, position: 2 },
    { key: "religieuse", label: "Bénédiction", is_enabled: false, position: 3 },
    { key: "traditionnelle", label: "Cérémonie au village", is_enabled: false, position: 4 },
    { key: "reception", label: "Réception", is_enabled: false, position: 5 }
  ]);
  verifier("déroulé : pays renvoyé", d.pays.nom === "Côte d'Ivoire");
  verifier("déroulé : étapes désactivées exclues", !d.etapes.some(e => e.key === "religieuse"));
  verifier("déroulé : deux étapes actives", d.etapes.length === 2, `${d.etapes.length} : ${d.etapes.map(e => e.key).join(",")}`);
  verifier("déroulé : intitulés personnels affichés", d.etapes.map(e => e.label).join("|") === "Dot|Mairie");

  // étapes non renseignées : les propositions du pays servent d'état initial
  const partiel = invitation.deroulePublic("CI", [
    { key: "fiancailles", label: "Dot", is_enabled: true, position: 1 },
    { key: "civil", label: "Mairie", is_enabled: true, position: 2 }
  ]);
  verifier("état partiel : réception proposée par défaut", partiel.etapes.some(e => e.key === "reception"));
  verifier("déroulé : aucun horaire exposé ici", d.etapes.every(e => e.event_date === undefined));

  const texte = invitation.textePartage({
    slug: "ruth-david", partner1Name: "Ruth", partner2Name: "David",
    weddingDate: "2026-11-12", ville: "Abidjan", base: "https://wma.ci"
  });
  verifier("partage : les deux prénoms", texte.includes("Ruth") && texte.includes("David"));
  verifier("partage : date en clair", texte.includes("novembre 2026"));
  verifier("partage : ville", texte.includes("Abidjan"));
  verifier("partage : lien inclus", texte.includes("https://wma.ci/invitation/ruth-david"));
  verifier("partage : aucun emoji", !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(texte));
  const wa = invitation.lienPartageWhatsApp({ slug: "ruth-david", base: "https://wma.ci" }, "2250700000000");
  verifier("partage WhatsApp : wa.me", wa.startsWith("https://wa.me/2250700000000?text="));
  verifier("partage WhatsApp : texte encodé", wa.includes("%2F%2Fruth-david") || wa.includes("ruth-david"));

  const carte = invitation.carteLien({ slug: "ruth-david", texte: "Notre mariage", base: "https://wma.ci" });
  verifier("carte imprimable : SVG autonome", carte.svg.startsWith("<svg") && carte.svg.includes("</svg>"));
  const liens = (carte.svg.match(/https?:\/\/[^"\s]+/g) || []).filter(u => !u.startsWith("http://www.w3.org/2000/svg"));
  verifier("carte imprimable : aucune ressource externe", liens.every(u => u.startsWith("https://wma.ci")) && !carte.svg.includes("<image") && !carte.svg.includes("xlink:href"), JSON.stringify(liens));
  verifier("carte imprimable : texte échappé", !invitation.carteLien({ slug: "a<b>&c" }).svg.includes("<b>"));

  // compteur public
  const ouvert = invitation.compteurPublic({ visible: true, collecte: 325000, gestes: 12, objectif: 1500000, acces: { premium: true } });
  verifier("compteur : ouvert quand premium et visible", ouvert.ouverte === true);
  verifier("compteur : pourcentage arrondi", ouvert.pourcentage === 22, `${ouvert.pourcentage}`);
  verifier("compteur : montant formaté", ouvert.texte === "325 000 FCFA", ouvert.texte);
  const masque = invitation.compteurPublic({ visible: false, collecte: 325000, acces: { premium: true } });
  verifier("compteur : masqué par le couple", masque.ouverte === false && masque.raison === "masquee_par_le_couple");
  const sansPremium = invitation.compteurPublic({ visible: true, collecte: 325000, acces: { premium: false } });
  verifier("compteur : fermé sans premium", sansPremium.ouverte === false && sansPremium.raison === "premium_requis");
  verifier("compteur : aucun montant divulgué quand fermé", sansPremium.collecte === 325000 && sansPremium.ouverte === false);
  const sansObjectif = invitation.compteurPublic({ visible: true, collecte: 50000, objectif: 0, acces: { premium: true } });
  verifier("compteur : objectif nul -> 0 %", sansObjectif.pourcentage === 0);
}

/* ═══ Pilier 5 : marketplace ═════════════════════════════════════════════ */
titre("Pilier 5 - carnet des prestataires");
{
  verifier("treize métiers normalisés", vendors.METIERS.length === 13);
  verifier("métiers : clés uniques", new Set(vendors.METIERS.map(m => m.key)).size === 13);
  /* Garde-fou : ces clés doivent rester EXACTEMENT celles de votre colonne
     providers.service, sinon le filtre du marketplace ne trouve plus rien. */
  const SERVICES_REELS = ["traiteur", "decorateur", "photographe", "videaste", "dj_sono",
    "salle", "makeup_coiffure", "robe_tenues", "patisserie", "fleuriste",
    "transport", "animation_mc", "autre"];
  verifier("métiers : vocabulaire identique à providers.service",
    JSON.stringify(vendors.METIERS.map(m => m.key).slice().sort()) === JSON.stringify(SERVICES_REELS.slice().sort()),
    vendors.METIERS.map(m => m.key).join(","));
  verifier("métiers : traiteur présent", Boolean(vendors.getMetier("traiteur")));
  verifier("métiers : descriptions non vides", vendors.METIERS.every(m => m.description.length >= 15));
  verifier("métiers : aucun emoji", !vendors.METIERS.some(m => /[\u{1F300}-\u{1FAFF}]/u.test(m.nom + m.description)));

  verifier("villes par pays", vendors.villesParPays("CI").includes("Abidjan"));
  verifier("villes du Sénégal", vendors.villesParPays("SN").includes("Dakar"));
  verifier("mise en avant : 30 jours", vendors.JOURS_MISE_EN_AVANT === 30);
  verifier("mise en avant : 10 000 FCFA", vendors.PRIX_MISE_EN_AVANT === 10000);
  verifier("fiche prestataire : 5 000 FCFA par an", vendors.PRIX_FICHE_ANNUEL === 5000);

  // validation d'une inscription publique
  verifier("inscription complète acceptée", vendors.inscriptionValide({
    businessName: "Chez Aya Traiteur", city: "Abidjan", serviceKey: "traiteur",
    whatsapp: "+225 07 00 00 00 00", description: "Buffets ivoiriens pour mariages, de 50 à 500 couverts."
  }).valide === true);
  const sansNom = vendors.inscriptionValide({ businessName: "ab", city: "Abidjan", serviceKey: "traiteur", whatsapp: "22507000000", description: "Une description assez longue pour passer." });
  verifier("nom trop court refusé", sansNom.valide === false && sansNom.erreurs.length >= 1);
  const sansMetier = vendors.inscriptionValide({ businessName: "Chez Aya", city: "Abidjan", serviceKey: "inconnu", whatsapp: "22507000000", description: "Une description assez longue pour passer." });
  verifier("métier hors liste refusé", sansMetier.valide === false);
  const sansTel = vendors.inscriptionValide({ businessName: "Chez Aya", city: "Abidjan", serviceKey: "traiteur", whatsapp: "12", description: "Une description assez longue pour passer." });
  verifier("numéro WhatsApp invalide refusé", sansTel.valide === false);
  const sansTexte = vendors.inscriptionValide({ businessName: "Chez Aya", city: "Abidjan", serviceKey: "traiteur", whatsapp: "22507000000", description: "court" });
  verifier("description trop courte refusée", sansTexte.valide === false);

  // slug
  verifier("slug sans accent", vendors.slugify("Décoration Événementielle") === "decoration-evenementielle");
  verifier("slug sans caractère spécial", vendors.slugify("DJ & Sono !") === "dj-sono");
  verifier("slug vide toléré", vendors.slugify("") === "");

  // tri : mise en avant en tête
  const futur = new Date(Date.now() + 5 * 86400000).toISOString();
  const passe = new Date(Date.now() - 5 * 86400000).toISOString();
  const fiches = [
    { id: 1, business_name: "Alpha Décor", city: "Abidjan", country: "CI", service_key: "decoration", status: "approved", created_at: "2026-01-01" },
    { id: 2, business_name: "Beta Traiteur", city: "Abidjan", country: "CI", service_key: "traiteur", status: "approved", created_at: "2026-02-01", is_featured: true, featured_until: futur },
    { id: 3, business_name: "Gamma DJ", city: "Dakar", country: "SN", service_key: "dj", status: "approved", created_at: "2026-03-01", is_featured: true, featured_until: passe }
  ];
  verifier("mise en avant active détectée", vendors.miseEnAvantActive(fiches[1]) === true);
  verifier("mise en avant expirée ignorée", vendors.miseEnAvantActive(fiches[2]) === false);
  const tries = vendors.trier(fiches);
  verifier("fiche mise en avant en tête", tries[0].id === 2);
  verifier("filtre par ville", vendors.trier(fiches, { ville: "Dakar" }).map(f => f.id).join(",") === "3");
  verifier("filtre par métier", vendors.trier(fiches, { service: "traiteur" }).map(f => f.id).join(",") === "2");
  verifier("filtre par pays", vendors.trier(fiches, { pays: "CI" }).map(f => f.id).sort().join(",") === "1,2");
  verifier("recherche libre insensible à la casse", vendors.trier(fiches, { q: "alpha" }).length === 1);
  verifier("aucun résultat : liste vide", vendors.trier(fiches, { q: "introuvable" }).length === 0);

  // fiche publique : aucun champ interne
  const pub = vendors.fichePublique(fiches[1]);
  verifier("fiche publique : slug généré", pub.slug === "beta-traiteur", pub.slug);
  verifier("fiche publique : métier en clair", pub.serviceNom === "Traiteur");
  verifier("fiche publique : aucun statut interne", pub.status === undefined);
  verifier("fiche publique : aucune vue exposée", pub.views === undefined);
  verifier("fiche publique : photos en tableau", Array.isArray(pub.photos));
  verifier("fiche publique : fin de mise en avant datée", /^\d{4}-\d{2}-\d{2}$/.test(pub.finMiseEnAvant || ""), pub.finMiseEnAvant);

  // mise en relation
  const lien = vendors.lienContact({ nom: "Beta Traiteur", whatsapp: "+225 07 00 00 00 00" }, { nom: "Ruth et David", date: "2026-11-12", message: "120 couverts" });
  verifier("lien WhatsApp : wa.me", lien.startsWith("https://wa.me/2250700000000?text="));
  const decode = decodeURIComponent(lien);
  verifier("lien WhatsApp : nom du couple", decode.includes("Ruth et David"));
  verifier("lien WhatsApp : date du mariage", decode.includes("2026-11-12"));
  verifier("lien WhatsApp : message du couple", decode.includes("120 couverts"));
  verifier("lien WhatsApp : numéro nettoyé", !lien.includes("%2B") && !lien.includes("+225"));

  // résumé pour l'équipe
  const resume = vendors.aVerifier([
    { status: "pending" }, { status: "approved" }, { status: "suspended" },
    { status: "approved", is_featured: true, featured_until: futur }
  ]);
  verifier("résumé équipe : total", resume.total === 4);
  verifier("résumé équipe : en attente", resume.enAttente === 1);
  verifier("résumé équipe : mises en avant", resume.misesEnAvant === 1);
}

/* ═══ Pilier 6 : paliers ═════════════════════════════════════════════════ */
titre("Pilier 6 - trois paliers, essai et lecture seule");
{
  const p = plans.paliersPublics();
  verifier("trois paliers", p.length === 3);
  verifier("ordre : gratuit, premium, prestataire", p.map(x => x.key).join(",") === "gratuit,premium,prestataire");
  verifier("gratuit : 0 FCFA", p[0].prix === 0);
  verifier("gratuit : sans limite de durée", /sans limite/.test(p[0].periode));
  verifier("premium : 2 000 FCFA", p[1].prix === 2000);
  verifier("prestataire : 5 000 FCFA", p[2].prix === 5000);
  verifier("prestataire : par an", p[2].periode === "par an");
  verifier("un seul palier recommandé", p.filter(x => x.recommande).length === 1 && p[1].recommande === true);
  verifier("gratuit : limite de 50 invités", plans.LIMITE_INVITES_GRATUIT === 50 && p[0].inclus.some(t => t.includes("50")));
  verifier("essai : 14 jours", plans.JOURS_ESSAI === 14);
  verifier("aucun palier ne mentionne une API", !JSON.stringify(p).match(/api|webhook|sdk/i));
  verifier("aucun emoji dans les paliers", !JSON.stringify(p).match(/[\u{1F300}-\u{1FAFF}]/u));

  // Accès calculé depuis VOS colonnes réelles (src/db/schema.ts) :
  // couples.status vaut trial | pending_payment | verification | active
  // | expired | suspended, et il n'y a PAS de colonne is_premium.
  const gratuit = plans.accesDe({ status: "trial", trialEndsAt: null, planType: "couple" });
  verifier("couple neuf (status trial, essai non daté) : palier gratuit", gratuit.palier === "gratuit", gratuit.palier);
  verifier("couple neuf : premium inactif", gratuit.premium === false);
  verifier("couple neuf : lecture seule non déclenchée", gratuit.lectureSeule === false);
  verifier("couple neuf : limite de 50 invités", gratuit.limiteInvites === 50);
  verifier("couple neuf : statut brut exposé", gratuit.statut === "trial");

  const premium = plans.accesDe({ status: "active", planType: "couple" });
  verifier("status active : palier premium", premium.palier === "premium");
  verifier("status active : premium acquis", premium.acquis === true);
  verifier("status active : invités illimités", premium.limiteInvites === null);
  verifier("status active : lecture seule inactive", premium.lectureSeule === false);

  const enEssai = plans.accesDe({ status: "trial", trialEndsAt: new Date(Date.now() + 9 * 86400000).toISOString() });
  verifier("trial + date future : premium actif", enEssai.premium === true);
  verifier("trial + date future : 9 jours restants", enEssai.joursRestants === 9, `${enEssai.joursRestants}`);
  verifier("trial + date future : non expiré", enEssai.essaiExpire === false);
  verifier("trial + date future : acquis reste faux", enEssai.acquis === false);

  const attente = plans.accesDe({ status: "pending_payment" });
  verifier("status pending_payment : non premium", attente.premium === false);
  verifier("status pending_payment : signalé en attente", attente.enAttente === true);
  verifier("status pending_payment : pas de lecture seule", attente.lectureSeule === false);
  verifier("status pending_payment : message de vérification", /v[ée]rification/i.test(attente.message));

  const verification = plans.accesDe({ status: "verification" });
  verifier("status verification : en attente", verification.enAttente === true);
  verifier("status verification : non premium", verification.premium === false);

  const expire = plans.accesDe({ status: "expired" });
  verifier("status expired : lecture seule", expire.lectureSeule === true);
  verifier("status expired : premium inactif", expire.premium === false);
  verifier("status expired : palier gratuit", expire.palier === "gratuit");

  const expireDate = plans.accesDe({ status: "trial", trialEndsAt: new Date(Date.now() - 2 * 86400000).toISOString() });
  verifier("trial + date dépassée : lecture seule", expireDate.lectureSeule === true);
  verifier("trial + date dépassée : essai expiré", expireDate.essaiExpire === true);
  verifier("trial + date dépassée : 0 jour restant", expireDate.joursRestants === 0);

  const suspendu = plans.accesDe({ status: "suspended" });
  verifier("status suspended : lecture seule", suspendu.lectureSeule === true);
  verifier("status suspended : message explicite", /suspendu/i.test(suspendu.message));
  verifier("status suspended : premium inactif", suspendu.premium === false);

  // tolérances : is_premium si vous l'ajoutez un jour, et noms snake_case
  /* "blocked" est une septième valeur de votre couples.status, absente de ma
     première liste : un espace bloqué ne doit donner ni Premium ni écriture. */
  const bloque = plans.accesDe({ status: "blocked" });
  verifier("status blocked : lecture seule", bloque.lectureSeule === true);
  verifier("status blocked : premium inactif", bloque.premium === false);
  verifier("status blocked : palier gratuit", bloque.palier === "gratuit");
  verifier("status blocked : RSVP fermé", plans.peut("rsvp", bloque) === false);
  verifier("status blocked : cagnotte fermée", plans.peut("cagnotte", bloque) === false);
  /* Un statut jamais vu replie sur le palier gratuit, jamais sur Premium. */
  const inconnu = plans.accesDe({ status: "statut_jamais_vu" });
  verifier("statut inconnu : jamais premium", inconnu.premium === false);
  verifier("statut inconnu : palier gratuit", inconnu.palier === "gratuit");

  verifier("colonne is_premium tolérée", plans.accesDe({ status: "trial", isPremium: true }).premium === true);
  const snake = plans.accesDe({ status: "active", plan_type: "individual", trial_ends_at: null });
  verifier("colonnes snake_case lues", snake.premium === true);
  verifier("planType individual conservé", snake.planType === "individual");
  verifier("status absent : repli sur trial", plans.accesDe({}).statut === "trial");
  verifier("couple vide : aucun crash, palier gratuit", plans.accesDe(null).palier === "gratuit");

  // garde-fous par fonction
  verifier("RSVP ouvert au palier gratuit", plans.peut("rsvp", gratuit) === true);
  verifier("prestataires ouverts au palier gratuit", plans.peut("prestataires", gratuit) === true);
  verifier("cagnotte fermée au palier gratuit", plans.peut("cagnotte", gratuit) === false);
  verifier("animations fermées au palier gratuit", plans.peut("animations", gratuit) === false);
  verifier("cagnotte ouverte en premium", plans.peut("cagnotte", premium) === true);
  verifier("cagnotte ouverte pendant l'essai", plans.peut("cagnotte", enEssai) === true);
  verifier("jeux publics ouverts en premium", plans.peut("jeux_publics", premium) === true);
  verifier("tout fermé en lecture seule", plans.peut("rsvp", expire) === false && plans.peut("cagnotte", expire) === false);
  verifier("tout fermé si espace suspendu", plans.peut("rsvp", suspendu) === false);
  verifier("liste des fonctions complète", plans.fonctionsParPalier(gratuit).length >= 14);

  // essai : une seule fois
  verifier("essai possible sur un espace neuf (status trial)", plans.essaiPossible({ status: "trial" }).possible === true);
  verifier("essai refusé si Premium acquis (status active)", plans.essaiPossible({ status: "active" }).raison === "premium_deja_actif");
  verifier("essai refusé si espace suspendu", plans.essaiPossible({ status: "suspended" }).raison === "espace_suspendu");
  verifier("essai en cours : déjà ouvert", plans.essaiPossible({ status: "trial", trialEndsAt: new Date(Date.now() + 5 * 86400000).toISOString() }).raison === "essai_en_cours");
  verifier("essai passé : non renouvelable", plans.essaiPossible({ status: "expired", trialEndsAt: new Date(Date.now() - 5 * 86400000).toISOString() }).raison === "essai_deja_ouvert");
  const fin = plans.finEssai(14, new Date("2026-09-28T10:00:00Z"));
  verifier("fin d'essai : 14 jours plus tard", fin.toISOString().startsWith("2026-10-12"), fin.toISOString());
  verifier("fin d'essai : fin de journée", fin.getUTCHours() === 23 && fin.getUTCMinutes() === 59);

  // mise en avant
  verifier("fin de mise en avant en ISO", /^\d{4}-\d{2}-\d{2}T/.test(plans.finMiseEnAvant(30, new Date("2026-09-28T00:00:00Z"))));
  verifier("mise en avant : 30 jours plus tard", plans.finMiseEnAvant(30, new Date("2026-09-28T00:00:00Z")).startsWith("2026-10-28"));
}

/* ═══ Utilitaires partagés ═══════════════════════════════════════════════ */
titre("Utilitaires partagés");
{
  verifier("WhatsApp officiel : +225 70 50 13 56", partage.WHATSAPP_OFFICIEL === "22570501356");
  verifier("lien officiel construit", partage.lienWhatsAppOfficiel("Bonjour").startsWith("https://wa.me/22570501356?text="));
  verifier("FCFA formaté avec espaces simples", partage.fcfa(1500000) === "1 500 000 FCFA", partage.fcfa(1500000));
  verifier("FCFA sans espace insécable", !partage.fcfa(1500000).match(/[\u00A0\u202F\u2007]/));
  verifier("date longue en français", partage.dateLongue("2026-11-12").includes("novembre 2026"), partage.dateLongue("2026-11-12"));
  verifier("date invalide : chaîne vide", partage.dateLongue("pas-une-date") === "");
  verifier("jours restants positifs", partage.joursRestants(new Date(Date.now() + 3 * 86400000)) === 3);
  verifier("jours restants : jamais négatifs", partage.joursRestants(new Date(Date.now() - 3 * 86400000)) === 0);
  verifier("montant par pays : XOF", pays.montant(250000, "CI") === "250 000 FCFA");
  verifier("montant par pays : XAF", pays.montant(250000, "CM") === "250 000 FCFA");
  verifier("tranches de budget : trois niveaux", pays.tranchesBudget("CI").length === 3);
  verifier("tranches de budget : ordre croissant", pays.tranchesBudget("CI").every((t, i, a) => i === 0 || t.min >= a[i - 1].min));
}

/* ═══ Bilan ═════════════════════════════════════════════════════════════ */
console.log(`\n${"=".repeat(60)}`);
console.log(`Logique pure : ${ok} vérifications réussies, ${ko} en échec`);
console.log(`${"=".repeat(60)}`);
if (echecs.length) { console.log("\nÉchecs :"); echecs.forEach(e => console.log(`  - ${e}`)); }
console.log("");
process.exit(ko === 0 ? 0 : 1);
