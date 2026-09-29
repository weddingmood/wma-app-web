#!/usr/bin/env node
/**
 * tests/roadmap-vercel.mjs
 * ---------------------------------------------------------------------------
 * Vérification des six piliers sur votre déploiement Vercel, sans base de
 * test locale : tout passe par les Route Handlers déployés.
 *
 *   node tests/roadmap-vercel.mjs
 *
 * Variables :
 *   WM_BASE   adresse du déploiement à tester
 *             ex. WM_BASE=https://wma-app-git-six-piliers.vercel.app
 *             (défaut : https://wma-app.vercel.app)
 *   WM_SLUG   lien d'invitation d'un couple de test (ex. ruth-david)
 *   WM_USER / WM_PASS   identifiants du couple de test (facultatif)
 *   WM_ADMIN_USER / WM_ADMIN_PASS   identifiants équipe (facultatif)
 *
 * La suite est tolérante : sans identifiants, elle vérifie uniquement les
 * comportements publics et signale ce qui reste à tester.
 * Zéro dépendance (fetch natif de Node 18+).
 */

const BASE = (process.env.WM_BASE || "https://wma-app.vercel.app").replace(/\/+$/, "");
const SLUG = process.env.WM_SLUG || "";
const USER = process.env.WM_USER || "";
const PASS = process.env.WM_PASS || "";
const ADMIN_USER = process.env.WM_ADMIN_USER || "";
const ADMIN_PASS = process.env.WM_ADMIN_PASS || "";

let ok = 0, ko = 0, saute = 0;
const echecs = [];
const sautes = [];

function verifier(nom, condition, detail = "") {
  if (condition) { ok++; console.log(`  [ok]   ${nom}`); }
  else { ko++; echecs.push(nom + (detail ? ` -- ${detail}` : "")); console.log(`  [ECHEC] ${nom}${detail ? ` -- ${detail}` : ""}`); }
}
function sauter(nom, raison) {
  saute++; sautes.push(`${nom} (${raison})`);
  console.log(`  [--]   ${nom} -- ${raison}`);
}
function titre(t) { console.log(`\n=== ${t} ===`); }

/** Enveloppe attendue : { success: true, ... } ou { success: false, error } */
async function api(chemin, options = {}, cookie = "") {
  const entetes = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (cookie) entetes.Cookie = cookie;
  try {
    const r = await fetch(BASE + chemin, { ...options, headers: entetes, redirect: "manual" });
    let d = null;
    try { d = await r.json(); } catch { d = null; }
    return { statut: r.status, d, entetes: r.headers };
  } catch (e) {
    return { statut: 0, d: null, erreur: String(e && e.message || e) };
  }
}

function cookieDe(reponse) {
  const bruts = reponse.entetes?.getSetCookie?.() || [];
  const liste = bruts.length ? bruts : String(reponse.entetes?.get?.("set-cookie") || "").split(/,(?=[^;]+=)/).filter(Boolean);
  return liste.map(c => c.split(";")[0]).filter(Boolean).join("; ");
}

async function seConnecter(chemin, corps) {
  const r = await api(chemin, { method: "POST", body: JSON.stringify(corps || {}) });
  return { cookie: cookieDe(r), reponse: r };
}

async function page(chemin) {
  try {
    const r = await fetch(BASE + chemin, { redirect: "manual" });
    const texte = r.status === 200 ? await r.text() : "";
    return { statut: r.status, texte };
  } catch (e) {
    return { statut: 0, texte: "", erreur: String(e && e.message || e) };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */

console.log(`\nRoadmap Vercel - ${BASE}`);
console.log(`Node ${process.version} - ${new Date().toISOString()}`);
if (!SLUG) console.log("Astuce : WM_SLUG=<lien d'invitation> active les tests publics détaillés.");

let cookieCouple = "";
let cookieAdmin = "";

/* ── 0. Le déploiement répond ────────────────────────────────────────────── */
titre("0. Déploiement en ligne");
{
  const r = await api("/api/plans");
  verifier("GET /api/plans répond", r.statut === 200, `statut ${r.statut} ${r.erreur || ""}`);
  verifier("enveloppe { success: true }", r.d?.success === true, JSON.stringify(r.d || {}).slice(0, 120));
  verifier("trois paliers renvoyés", Array.isArray(r.d?.paliers) && r.d.paliers.length === 3, `${r.d?.paliers?.length}`);

  const p = await page("/");
  verifier("page d'accueil en ligne", p.statut === 200, `statut ${p.statut}`);
}

/* ── 1. Pilier 6 : paliers ───────────────────────────────────────────────── */
titre("1. Pilier 6 - trois paliers clairs");
{
  const r = await api("/api/plans");
  const paliers = (r.d?.paliers || []).map(x => x.key);
  verifier("palier gratuit présent", paliers.includes("gratuit"));
  verifier("palier premium présent", paliers.includes("premium"));
  verifier("palier prestataire présent", paliers.includes("prestataire"));

  const gratuit = (r.d?.paliers || []).find(x => x.key === "gratuit");
  verifier("gratuit : prix nul", Number(gratuit?.prix) === 0);
  verifier("gratuit : RSVP inclus", (gratuit?.inclus || []).some(t => /réponses|RSVP|présence/i.test(t)));
  verifier("gratuit : prestataires inclus", (gratuit?.inclus || []).some(t => /prestataire/i.test(t)));
  verifier("gratuit : limite d'invités annoncée", (gratuit?.inclus || []).some(t => /invités/i.test(t)));
  verifier("gratuit : cagnotte exclue", (gratuit?.nonInclus || []).some(t => /cagnotte/i.test(t)));

  const premium = (r.d?.paliers || []).find(x => x.key === "premium");
  verifier("premium : cagnotte incluse", (premium?.inclus || []).some(t => /cagnotte|cadeaux/i.test(t)));
  verifier("premium : animations incluses", (premium?.inclus || []).some(t => /animation|quiz|jeu/i.test(t)));
  verifier("premium : modèles inclus", (premium?.inclus || []).some(t => /modèle|personnalisation/i.test(t)));
  verifier("premium : recommandé", premium?.recommande === true);

  const prest = (r.d?.paliers || []).find(x => x.key === "prestataire");
  verifier("prestataire : fiche vérifiée", (prest?.inclus || []).some(t => /fiche/i.test(t)));
  verifier("prestataire : mise en avant", (prest?.inclus || []).some(t => /mise en avant/i.test(t)));

  const f = r.d?.fonctions || {};
  verifier("fonction cagnotte -> premium", (f.find?.(x => x.key === "cagnotte") || {}).requis === "premium");
  verifier("fonction rsvp -> gratuit", (f.find?.(x => x.key === "rsvp") || {}).requis === "gratuit");
  verifier("jours d'essai annoncés", Number(r.d?.joursEssai) === 14, `${r.d?.joursEssai}`);

  // sans session : pas d'ouverture d'essai
  const t = await api("/api/plans/trial", { method: "POST", body: JSON.stringify({}) });
  verifier("essai refusé sans session", t.statut === 401 && t.d?.success === false, `statut ${t.statut}`);
}

/* ── 2. Connexion du couple de test ─────────────────────────────────────── */
titre("2. Session du couple de test");
if (USER && PASS) {
  // vos routes reelles : /api/auth (couple) et /api/admin/auth (equipe)
  let c = await seConnecter("/api/auth", { email: USER, password: PASS });
  if (!c.cookie) c = await seConnecter("/api/auth/login", { email: USER, password: PASS });
  cookieCouple = c.cookie;
  verifier("connexion couple etablie via /api/auth", Boolean(cookieCouple), `statut ${c.reponse.statut}`);
} else {
  sauter("connexion couple", "WM_USER / WM_PASS non fournis");
}

if (ADMIN_USER && ADMIN_PASS) {
  let a = await seConnecter("/api/admin/auth", { email: ADMIN_USER, password: ADMIN_PASS });
  if (!a.cookie) a = await seConnecter("/api/auth/admin/login", { email: ADMIN_USER, password: ADMIN_PASS });
  cookieAdmin = a.cookie;
  verifier("connexion equipe etablie via /api/admin/auth", Boolean(cookieAdmin), `statut ${a.reponse.statut}`);
} else {
  sauter("connexion équipe", "WM_ADMIN_USER / WM_ADMIN_PASS non fournis");
}

/* ── 3. Pilier 1 : cérémonies configurables par pays ────────────────────── */
titre("3. Pilier 1 - cérémonies par pays");
if (cookieCouple) {
  const g = await api("/api/ceremonies", {}, cookieCouple);
  verifier("GET /api/ceremonies (session)", g.statut === 200 && g.d?.success === true, `statut ${g.statut}`);
  verifier("pays du couple renvoyé", Boolean(g.d?.pays?.code), JSON.stringify(g.d?.pays || null));
  const proposees = g.d?.proposees || [];
  verifier("au moins quatre étapes proposées", proposees.length >= 4, `${proposees.length}`);
  verifier("clés attendues", ["fiancailles", "civil", "religieuse", "traditionnelle", "reception"]
    .every(k => proposees.some(p => p.key === k)));
  verifier("intitulés non vides", proposees.every(p => String(p.label || "").length >= 3));

  const etat = g.d?.etat || [];
  const modifie = etat.map((c, i) => ({
    ...c,
    label: i === 0 ? "Dot et fiançailles chez nous" : c.label,
    defaut: i < 3
  }));
  const w = await api("/api/ceremonies", { method: "PUT", body: JSON.stringify({ ceremonies: modifie }) }, cookieCouple);
  verifier("PUT /api/ceremonies enregistre", w.statut === 200 && w.d?.success === true, `statut ${w.statut} ${w.d?.error || ""}`);
  verifier("intitulé personnalisé conservé", (w.d?.etat || [])[0]?.label === "Dot et fiançailles chez nous", (w.d?.etat || [])[0]?.label);
  verifier("ordre conservé", (w.d?.etat || []).every((c, i) => c.ordre === i + 1));
  verifier("trois étapes actives", (w.d?.actives || []).length === 3, `${(w.d?.actives || []).length}`);

  const g2 = await api("/api/ceremonies", {}, cookieCouple);
  verifier("état persisté après relecture", (g2.d?.etat || [])[0]?.label === "Dot et fiançailles chez nous");

  // refus : intitulé trop court, trop d'étapes
  const court = await api("/api/ceremonies", { method: "PUT", body: JSON.stringify({ ceremonies: [{ key: "x", label: "ab" }] }) }, cookieCouple);
  verifier("intitulé trop court refusé", court.statut === 400, `statut ${court.statut}`);
  const trop = await api("/api/ceremonies", { method: "PUT", body: JSON.stringify({ ceremonies: Array.from({ length: 13 }, (_, i) => ({ key: `k${i}`, label: `Etape ${i}` })) }) }, cookieCouple);
  verifier("plus de douze étapes refusé", trop.statut === 400, `statut ${trop.statut}`);
} else {
  const g = await api("/api/ceremonies");
  verifier("GET /api/ceremonies sans session -> 401", g.statut === 401, `statut ${g.statut}`);
  sauter("écriture des cérémonies", "session couple indisponible");
}

/* ── 4. Piliers 2 et 3 : mobile money et cadeaux ───────────────────────── */
titre("4. Piliers 2 et 3 - opérateurs et cadeaux");
{
  if (SLUG) {
    const c = await api(`/api/contributions?slug=${encodeURIComponent(SLUG)}`);
    verifier("GET /api/contributions public", c.statut === 200 && c.d?.success === true, `statut ${c.statut}`);
    verifier("compteur ou message de fermeture", c.d?.ouverte === true || Boolean(c.d?.message), JSON.stringify(c.d || {}).slice(0, 120));
    const ops = c.d?.operateurs || {};
    verifier("Wave annoncé actif", (ops.actifs || []).some(o => o.key === "wave"));
    verifier("Orange annoncé bientôt", (ops.annonces || []).some(o => /orange/i.test(o.nom)));
    verifier("MTN annoncé bientôt", (ops.annonces || []).some(o => /mtn/i.test(o.nom)));
    verifier("Moov annoncé bientôt", (ops.annonces || []).some(o => /moov/i.test(o.nom)));
    verifier("montants suggérés", (ops.montantsSuggeres || []).length >= 3);
    verifier("minimum 1 000 FCFA", Number(ops.minimum) === 1000);

    // gestes refusés côté public
    const sansNom = await api("/api/contributions", { method: "POST", body: JSON.stringify({ slug: SLUG, amount: 5000 }) });
    verifier("geste sans nom refusé", sansNom.statut === 400 || sansNom.d?.success === false, `statut ${sansNom.statut}`);
    const petit = await api("/api/contributions", { method: "POST", body: JSON.stringify({ slug: SLUG, donorName: "Test Suite", amount: 100 }) });
    verifier("montant sous 1 000 FCFA refusé", petit.statut === 400 || petit.d?.success === false, `statut ${petit.statut}`);
    const enorme = await api("/api/contributions", { method: "POST", body: JSON.stringify({ slug: SLUG, donorName: "Test Suite", amount: 99000000 }) });
    verifier("montant au-delà du plafond refusé", enorme.statut === 400 || enorme.d?.success === false, `statut ${enorme.statut}`);
    const inconnu = await api("/api/contributions", { method: "POST", body: JSON.stringify({ slug: "ce-slug-n-existe-pas", donorName: "Test Suite", amount: 5000 }) });
    verifier("slug inconnu -> 404", inconnu.statut === 404, `statut ${inconnu.statut}`);

    // geste valide : accepté seulement si la collecte est ouverte
    if (c.d?.ouverte) {
      const avant = Number(c.d?.compteur?.gestes || 0);
      const g = await api("/api/contributions", {
        method: "POST",
        body: JSON.stringify({ slug: SLUG, donorName: "Ruth Kouassi", amount: 10000, provider: "wave", guestMessage: "Félicitations", transferReference: "WV-TEST-" + Date.now() })
      });
      verifier("geste Wave enregistré", g.statut === 201 && g.d?.success === true, `statut ${g.statut} ${g.d?.error || ""}`);
      verifier("lien de paiement Wave renvoyé", String(g.d?.lienPaiement || "").includes("pay.wave.com"), g.d?.lienPaiement);
      verifier("geste en attente de confirmation", g.d?.geste?.statut === "declare");

      const apres = await api(`/api/contributions?slug=${encodeURIComponent(SLUG)}`);
      verifier("compteur inchangé avant confirmation", Number(apres.d?.compteur?.gestes || 0) === avant, `${avant} -> ${apres.d?.compteur?.gestes}`);

      const nonBranche = await api("/api/contributions", {
        method: "POST",
        body: JSON.stringify({ slug: SLUG, donorName: "Aya Traoré", amount: 5000, provider: "orange", transferReference: "OM-TEST-1" })
      });
      verifier("opérateur non branché : demande recevable", nonBranche.statut === 201 || nonBranche.d?.success === true, `statut ${nonBranche.statut} ${nonBranche.d?.error || ""}`);
      if (nonBranche.d?.success) {
        verifier("aucun lien automatique pour Orange", nonBranche.d?.lienPaiement === null);
        verifier("consigne de transfert renvoyée", String(nonBranche.d?.consigne || "").includes("Orange Money"));
      }

      if (cookieCouple && g.d?.geste?.id) {
        const conf = await api("/api/contributions", { method: "PATCH", body: JSON.stringify({ id: g.d.geste.id, statut: "confirme" }) }, cookieCouple);
        verifier("couple confirme le geste", conf.statut === 200 && conf.d?.success === true, `statut ${conf.statut}`);
        verifier("compteur incrémenté", Number(conf.d?.compteur?.gestes || 0) === avant + 1, `${avant} -> ${conf.d?.compteur?.gestes}`);
        verifier("collecte augmentée de 10 000", Number(conf.d?.compteur?.collecte || 0) >= 10000);
      } else {
        sauter("confirmation du geste par le couple", "session couple indisponible");
      }
    } else {
      sauter("geste Wave enregistré", "cagnotte non ouverte sur ce lien de test");
      sauter("compteur incrémenté", "cagnotte non ouverte sur ce lien de test");
    }
  } else {
    sauter("compteur public", "WM_SLUG non fourni");
  }

  if (cookieCouple) {
    const prive = await api("/api/contributions", {}, cookieCouple);
    verifier("vue privée des gestes", prive.statut === 200 && Array.isArray(prive.d?.gestes), `statut ${prive.statut}`);
    verifier("visibilité de la cagnotte exposée", typeof prive.d?.cagnotte?.visible === "boolean");
    verifier("statistiques de la collecte", prive.d?.compteur && typeof prive.d.compteur.collecte === "number");
  }
}

/* ── 5. Pilier 4 : animations publiques ───────────────────────────────── */
titre("5. Pilier 4 - animations pour les invités");
{
  if (SLUG) {
    const g = await api(`/api/games/public/${encodeURIComponent(SLUG)}`);
    verifier("GET /api/games/public/[slug]", g.statut === 200 && g.d?.success === true, `statut ${g.statut}`);
    verifier("disponibilité signalée", typeof g.d?.disponibles === "boolean");
    if (g.d?.disponibles) {
      verifier("questions sans réponses justes", (g.d?.questions || []).every(q => !q.bonne_reponse && !q.goodAnswer && !q.good_answer));
      verifier("quatre jeux annoncés", (g.d?.jeux || []).length === 4, JSON.stringify(g.d?.jeux));
      const qs = g.d?.questions || [];
      if (qs.length) {
        const reponses = qs.map((q, i) => ({ id: q.id, reponse: ["a", "b", "c", "d"][i % 4] }));
        const p = await api(`/api/games/public/${encodeURIComponent(SLUG)}`, {
          method: "POST",
          body: JSON.stringify({ guestName: "Invité Test", kind: "quiz", reponses })
        });
        verifier("score enregistré", p.statut === 201 && p.d?.success === true, `statut ${p.statut} ${p.d?.error || ""}`);
        verifier("corrections renvoyées après coup", Array.isArray(p.d?.corrections) && p.d.corrections.length === reponses.length);
        verifier("classement renvoyé", p.d?.classement && typeof p.d.classement.parties === "number");
        const vide = await api(`/api/games/public/${encodeURIComponent(SLUG)}`, { method: "POST", body: JSON.stringify({ reponses: [] }) });
        verifier("partie sans réponse refusée", vide.statut === 400, `statut ${vide.statut}`);
      } else {
        sauter("score enregistré", "aucune question publiée sur ce lien de test");
      }
    } else {
      verifier("raison de fermeture explicite", ["premium_requis", "essai_termine"].includes(g.d?.raison), `${g.d?.raison}`);
      sauter("quiz public", "animations non ouvertes sur ce lien de test");
    }
    const inconnu = await api("/api/games/public/ce-slug-n-existe-pas");
    verifier("slug inconnu -> 404", inconnu.statut === 404, `statut ${inconnu.statut}`);

    const inv = await api(`/api/invitations/${encodeURIComponent(SLUG)}/public`);
    verifier("GET /api/invitations/[slug]/public", inv.statut === 200 && inv.d?.success === true, `statut ${inv.statut}`);
    verifier("déroulé des cérémonies inclus", inv.d?.ceremonies && Array.isArray(inv.d.ceremonies.etapes));
    verifier("compteur de collecte inclus", inv.d?.cagnotte && typeof inv.d.cagnotte.ouverte === "boolean");
    verifier("animations incluses", inv.d?.animations && Array.isArray(inv.d.animations.jeux));
    verifier("aucun mot de passe ni champ interne", !JSON.stringify(inv.d || {}).match(/password|mot_de_passe|code_activation/i));
  } else {
    sauter("animations publiques", "WM_SLUG non fourni");
  }
}

/* ── 6. Pilier 5 : marketplace ────────────────────────────────────────── */
titre("6. Pilier 5 - carnet des prestataires");
{
  const s = await api("/api/providers/search?pays=CI");
  verifier("GET /api/providers/search", s.statut === 200 && s.d?.success === true, `statut ${s.statut}`);
  verifier("facettes : métiers", (s.d?.facettes?.metiers || []).length >= 10, `${(s.d?.facettes?.metiers || []).length}`);
  verifier("facettes : villes", (s.d?.facettes?.villes || []).length >= 3);
  verifier("facettes : pays", (s.d?.facettes?.pays || []).length === 4);

  const toutes = s.d?.fiches || [];
  verifier("fiches publiques sans champ interne", toutes.every(f => f.status === undefined && f.views === undefined));
  verifier("mise en avant exposée", toutes.every(f => typeof f.miseEnAvant === "boolean"));

  if (toutes.length) {
    const une = toutes[0];
    const parMetier = await api(`/api/providers/search?service=${encodeURIComponent(une.service)}`);
    verifier("filtre par métier", parMetier.statut === 200 && (parMetier.d?.fiches || []).every(f => f.service === une.service));
    const parVille = await api(`/api/providers/search?ville=${encodeURIComponent(une.ville)}`);
    verifier("filtre par ville", parVille.statut === 200 && (parVille.d?.fiches || []).every(f => f.ville === une.ville));
    const texte = await api(`/api/providers/search?q=${encodeURIComponent(une.nom.split(" ")[0])}`);
    verifier("recherche libre", texte.statut === 200 && texte.d?.total >= 1, `total ${texte.d?.total}`);

    // mise en relation : publique, sans session
    const contact = await api(`/api/providers/${une.id}/contact`, {
      method: "POST",
      body: JSON.stringify({ coupleName: "Ruth et David", couplePhone: "+2250700000000", weddingDate: "2026-11-12", message: "Cherchons un traiteur pour 120 couverts." })
    });
    verifier("demande de contact acceptée", contact.statut === 201 && contact.d?.success === true, `statut ${contact.statut} ${contact.d?.error || ""}`);
    if (contact.d?.success) {
      verifier("lien WhatsApp pré-rempli", String(contact.d?.lienWhatsApp || "").startsWith("https://wa.me/"), contact.d?.lienWhatsApp);
      verifier("contexte du couple dans le lien", decodeURIComponent(contact.d?.lienWhatsApp || "").includes("Ruth et David"));
      verifier("compteur de demandes renvoyé", typeof contact.d?.demandesRecues === "number");
    }
    const long = await api(`/api/providers/${une.id}/contact`, { method: "POST", body: JSON.stringify({ message: "x".repeat(500) }) });
    verifier("message trop long refusé", long.statut === 400, `statut ${long.statut}`);
    const absent = await api("/api/providers/999999999/contact", { method: "POST", body: JSON.stringify({ message: "Bonjour" }) });
    verifier("prestataire inconnu -> 404", absent.statut === 404, `statut ${absent.statut}`);
  } else {
    sauter("filtres et mise en relation", "aucune fiche approuvée sur ce déploiement");
  }

  // mise en avant réservée à l'équipe
  const boost = await api("/api/admin/providers/boost", { method: "POST", body: JSON.stringify({ providerId: 1 }) });
  verifier("mise en avant refusée sans session équipe", boost.statut === 401, `statut ${boost.statut}`);

  if (cookieAdmin && toutes.length) {
    const b = await api("/api/admin/providers/boost", { method: "POST", body: JSON.stringify({ providerId: toutes[0].id, jours: 30, montant: 10000 }) }, cookieAdmin);
    verifier("mise en avant activée par l'équipe", b.statut === 200 && b.d?.success === true, `statut ${b.statut} ${b.d?.error || ""}`);
    if (b.d?.success) {
      verifier("durée de 30 jours", Number(b.d?.jours) === 30);
      verifier("date de fin renvoyée", Boolean(b.d?.jusquau));
      const apres = await api(`/api/providers/search?id=${toutes[0].id}`);
      verifier("fiche en tête après mise en avant", (apres.d?.fiches || [])[0]?.miseEnAvant === true);
      const sup = await api(`/api/admin/providers/boost?providerId=${toutes[0].id}`, { method: "DELETE" }, cookieAdmin);
      verifier("mise en avant retirée", sup.statut === 200 && sup.d?.success === true, `statut ${sup.statut}`);
    }
  } else {
    sauter("mise en avant par l'équipe", "session équipe indisponible");
  }
}

/* ── 7. Sécurité et non-régression ─────────────────────────────────────── */
titre("7. Sécurité et non-régression");
{
  const sansSession = ["/api/ceremonies", "/api/contributions"];
  for (const chemin of sansSession) {
    const r = await api(chemin);
    verifier(`${chemin} sans session -> 401`, r.statut === 401, `statut ${r.statut}`);
  }
  const admin = await api("/api/admin/providers/boost", { method: "POST", body: JSON.stringify({}) });
  verifier("/api/admin/providers/boost sans session -> 401", admin.statut === 401, `statut ${admin.statut}`);

  // routes existantes : elles doivent continuer de répondre (200, 401 ou 405)
  const existantes = ["/api/health", "/api/auth", "/api/invitations", "/api/cagnotte", "/api/guests"];
  for (const chemin of existantes) {
    const r = await api(chemin, {}, cookieCouple);
    verifier(`${chemin} répond toujours`, [200, 401, 404, 405].includes(r.statut), `statut ${r.statut}`);
  }

  // pages existantes
  for (const chemin of ["/", "/marketplace", "/devenir-prestataire", "/telechargement"]) {
    const p = await page(chemin);
    verifier(`page ${chemin} en ligne`, p.statut === 200, `statut ${p.statut}`);
  }

  if (SLUG) {
    const p = await page(`/invitation/${SLUG}`);
    verifier("page d'invitation en ligne", p.statut === 200, `statut ${p.statut}`);
    if (p.statut === 200) {
      verifier("aucun emoji dans l'invitation", !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(p.texte));
      verifier("aucun tiret cadratin", !/[\u2013\u2014]/.test(p.texte));
      verifier("aucune trace technique", !/undefined|NaN|\[object Object\]|TODO|FIXME/i.test(p.texte));
    }
  }
}

/* ── 8. Essai et lecture seule ─────────────────────────────────────────── */
titre("8. Essai Premium et lecture seule");
if (cookieCouple) {
  const avant = await api("/api/plans", {}, cookieCouple);
  const t = await api("/api/plans/trial", { method: "POST", body: JSON.stringify({}) }, cookieCouple);
  if (t.statut === 200) {
    verifier("essai ouvert", t.d?.ouvert === true);
    verifier("durée de 14 jours", Number(t.d?.jours) === 14, `${t.d?.jours}`);
    verifier("accès premium pendant l'essai", t.d?.acces?.premium === true);
    verifier("lecture seule non déclenchée", t.d?.acces?.lectureSeule === false);
    const deuxieme = await api("/api/plans/trial", { method: "POST", body: JSON.stringify({}) }, cookieCouple);
    verifier("second essai refusé", deuxieme.statut === 409, `statut ${deuxieme.statut}`);
  } else if (t.statut === 409) {
    verifier("essai déjà utilisé : refus explicite", ["essai_deja_ouvert", "essai_en_cours", "premium_deja_actif", "espace_suspendu"].includes(t.d?.code), `${t.d?.code}`);
    sauter("ouverture d'essai", "déjà consommée sur ce compte de test");
  } else {
    verifier("essai démarré", false, `statut ${t.statut} ${t.d?.error || ""}`);
  }
  verifier("accès toujours lisible après essai", (await api("/api/plans", {}, cookieCouple)).d?.monAcces !== null);

  // demande d'activation via le flux paiements existant
  const d = await api("/api/plans/request", {
    method: "POST",
    body: JSON.stringify({ objet: "activation", amount: 2000, provider: "wave", transferReference: "WV-TEST-ACTIV" })
  }, cookieCouple);
  verifier("demande d'activation enregistrée", d.statut === 200 && d.d?.success === true, `statut ${d.statut} ${d.d?.error || ""}`);
  if (d.d?.success) {
    verifier("aucune activation automatique", d.d?.acces?.acquis === false || d.d?.acces?.premium === true);
    verifier("paiement en attente de validation", d.d?.paiement?.status === "pending", `${d.d?.paiement?.status}`);
    verifier("lien marchand Wave renvoyé", String(d.d?.lienPaiement || "").includes("pay.wave.com"));
  }
  const insuffisant = await api("/api/plans/request", { method: "POST", body: JSON.stringify({ objet: "activation", amount: 500, provider: "wave" }) }, cookieCouple);
  verifier("montant insuffisant refusé", insuffisant.statut === 400, `statut ${insuffisant.statut}`);
  const nonBranche = await api("/api/plans/request", { method: "POST", body: JSON.stringify({ objet: "activation", amount: 2000, provider: "orange" }) }, cookieCouple);
  verifier("opérateur non branché : référence exigée", nonBranche.statut === 400 && nonBranche.d?.code === "operateur_non_branche", `statut ${nonBranche.statut}`);
} else {
  sauter("essai et demande d'activation", "session couple indisponible");
}

/* ── Bilan ─────────────────────────────────────────────────────────────── */
console.log(`\n${"=".repeat(64)}`);
console.log(`Roadmap Vercel : ${ok} vérifiés, ${ko} en échec, ${saute} sautés`);
console.log(`${"=".repeat(64)}`);
if (echecs.length) {
  console.log("\nÉchecs :");
  echecs.forEach(e => console.log(`  - ${e}`));
}
if (sautes.length) {
  console.log("\nNon testés faute de données ou de session :");
  sautes.forEach(s => console.log(`  - ${s}`));
}
console.log("");
process.exit(ko === 0 ? 0 : 1);
