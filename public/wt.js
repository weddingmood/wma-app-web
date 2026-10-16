/*! wt.js | tracker first-party WeddingMood | consentement d'abord | environ 5 Ko minifie */
(function () {
  "use strict";
  var d = document, w = window, s = d.currentScript;
  if (!s || w.__wt) return;
  var site = s.getAttribute("data-site");
  if (!site) return;
  w.__wt = 1;

  // --- Configuration (attributs data-*) ---
  var base;
  try { base = new URL(s.src, location.href); } catch (e) { base = location; }
  var endpoint = s.getAttribute("data-endpoint") ||
    (base.pathname.indexOf("/_wt/") === 0 ? base.origin + "/_wt/e" : base.origin + "/api/track");
  var currency = s.getAttribute("data-currency") || "XOF";
  var external = s.getAttribute("data-consent") === "external"; // true : le site gere son propre bandeau
  var useFbq = s.getAttribute("data-fbq") === "1";              // renvoie aussi l'evenement au pixel avec le meme eventID
  var leadRe = new RegExp(s.getAttribute("data-lead-match") || "rsvp", "i");
  var buyRe = new RegExp(s.getAttribute("data-purchase-match") || "contribution|cagnotte", "i");
  var KEY = "wt_consent", started = false, last = {};
  var nf = w.fetch ? w.fetch.bind(w) : null; // fetch d'origine, hors du crochet ci-dessous

  // --- Utilitaires ---
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function granted() { return ls(KEY) === "granted"; }
  function uid() {
    try { if (w.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function getCookie(n) { var m = d.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : ""; }
  function setCookie(n, v, days) {
    d.cookie = n + "=" + encodeURIComponent(v) + "; max-age=" + days * 86400 + "; path=/; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "");
  }
  function delCookie(n) { d.cookie = n + "=; max-age=0; path=/"; }

  // fbp / fbc : cookies Meta, crees ici si le pixel est absent (uniquement apres consentement)
  function ids() {
    var fbp = getCookie("_fbp"), fbc = getCookie("_fbc");
    var clid = new URLSearchParams(location.search).get("fbclid") || "";
    if (clid && (!fbc || fbc.split(".").pop() !== clid)) { fbc = "fb.1." + Date.now() + "." + clid; setCookie("_fbc", fbc, 90); }
    if (!fbp) { fbp = "fb.1." + Date.now() + "." + Math.floor(Math.random() * 1e10); setCookie("_fbp", fbp, 90); }
    return { fbp: fbp, fbc: fbc, fbclid: clid };
  }

  // SHA-256 cote navigateur : l'e-mail en clair ne quitte jamais l'appareil
  function sha(str, cb) {
    try {
      crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (h) {
        var a = new Uint8Array(h), o = "";
        for (var i = 0; i < a.length; i++) o += (a[i] < 16 ? "0" : "") + a[i].toString(16);
        cb(o);
      }, function () { cb(""); });
    } catch (e) { cb(""); }
  }

  // text/plain : evite la requete de pre-verification CORS ; sendBeacon survit a la fermeture de la page
  function send(p) {
    var j = JSON.stringify(p);
    try { if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([j], { type: "text/plain;charset=UTF-8" }))) return; } catch (e) {}
    try { if (nf) nf(endpoint, { method: "POST", body: j, keepalive: true, credentials: "omit", headers: { "Content-Type": "text/plain;charset=UTF-8" } }); } catch (e) {}
  }

  // --- Evenement ---
  function track(name, o) {
    if (!granted()) return "";
    o = o || {};
    var id = uid(), c = ids(), q = new URLSearchParams(location.search);
    var p = {
      site: site, event: name, event_id: id, ts: Date.now(), consent: true,
      url: location.href.split("#")[0], ref: d.referrer || "",
      fbp: c.fbp, fbc: c.fbc, fbclid: c.fbclid, gclid: q.get("gclid") || "",
      utm_source: q.get("utm_source") || "", utm_medium: q.get("utm_medium") || "", utm_campaign: q.get("utm_campaign") || "",
      campaign_id: q.get("campaign_id") || q.get("utm_id") || "",
      value: Number(o.value) || 0, currency: o.currency || currency
    };
    last[name] = id;
    if (o.email && /\S+@\S+\.\S+/.test(o.email)) {
      sha(String(o.email).trim().toLowerCase(), function (h) { if (h) p.email_hash = h; send(p); });
    } else { send(p); }
    if (useFbq && name !== "PageView" && typeof w.fbq === "function") {
      try { w.fbq("track", name, p.value ? { value: p.value, currency: p.currency } : {}, { eventID: id }); } catch (e) {}
    }
    return id;
  }

  // ViewContent : 50 % de scroll ou 15 s sur la page (une fois par page vue)
  function armView() {
    var done = false;
    function fire() { if (done) return; done = true; w.removeEventListener("scroll", onScroll); track("ViewContent"); }
    function onScroll() { var h = d.documentElement; if ((w.scrollY + w.innerHeight) / Math.max(h.scrollHeight, 1) >= 0.5) fire(); }
    w.addEventListener("scroll", onScroll, { passive: true });
    setTimeout(fire, 15000);
  }
  function pageview() { track("PageView"); armView(); }

  // Navigation sans rechargement (SPA)
  function hookHistory() {
    var lastUrl = location.href;
    function check() { if (location.href !== lastUrl) { lastUrl = location.href; pageview(); } }
    ["pushState", "replaceState"].forEach(function (m) {
      var o = history[m];
      history[m] = function () { var r = o.apply(this, arguments); setTimeout(check, 0); return r; };
    });
    w.addEventListener("popstate", check);
  }

  // Lead (RSVP) et Purchase (cagnotte) detectes automatiquement
  function auto(name, body) {
    var o = {};
    try { o = JSON.parse(body || "{}") || {}; } catch (e) {}
    track(name, { email: o.email || o.donorEmail || o.payerEmail || "", value: o.amount || o.montant || o.value || 0 });
  }
  if (nf) {
    w.fetch = function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var method = ((init && init.method) || (input && input.method) || "GET").toUpperCase();
      var p = nf.apply(w, arguments);
      if (method === "POST" && url.indexOf(endpoint) !== 0 && !/\/api\/track|\/_wt\/e/.test(url)) {
        var body = init && typeof init.body === "string" ? init.body : "";
        p.then(function (res) {
          if (!res || !res.ok) return;
          if (buyRe.test(url)) auto("Purchase", body); else if (leadRe.test(url)) auto("Lead", body);
        }).catch(function () {});
      }
      return p;
    };
  }
  d.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f || f.tagName !== "FORM") return;
    var t = f.getAttribute("data-wt");
    if (t !== "lead" && t !== "purchase" && !leadRe.test(f.getAttribute("action") || "")) return;
    var em = f.querySelector('input[type="email"]'), am = f.querySelector('[name="amount"],[name="montant"]');
    track(t === "purchase" ? "Purchase" : "Lead", { email: em ? em.value : "", value: am ? am.value : 0 });
  }, true);

  // --- Consentement (RGPD) : rien n'est envoye ni stocke avant l'accord ---
  function start() { if (started || !granted()) return; started = true; pageview(); hookHistory(); }
  function setConsent(v) {
    ls(KEY, v ? "granted" : "denied");
    if (v) start(); else { delCookie("_fbp"); delCookie("_fbc"); }
  }
  function banner() {
    var b = d.createElement("div"), t = d.createElement("span");
    b.setAttribute("role", "dialog");
    b.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;background:#1c1917;color:#fff;padding:12px;border-radius:12px;font:13px/1.4 system-ui,sans-serif;display:flex;gap:8px;align-items:center;flex-wrap:wrap";
    t.style.cssText = "flex:1;min-width:200px";
    t.textContent = "Nous mesurons l'audience de ce site pour am\u00e9liorer nos publicit\u00e9s. Acceptez-vous ?";
    b.appendChild(t);
    [["Accepter", "#16a34a", true], ["Refuser", "#57534e", false]].forEach(function (x) {
      var k = d.createElement("button");
      k.textContent = x[0];
      k.style.cssText = "border:0;border-radius:8px;padding:8px 14px;color:#fff;font-weight:700;cursor:pointer;background:" + x[1];
      k.onclick = function () { setConsent(x[2]); b.remove(); };
      b.appendChild(k);
    });
    d.body.appendChild(b);
  }

  w.wt = { track: track, consent: setConsent, eventId: function (n) { return last[n] || ""; } };
  if (granted()) start();
  else if (!external && ls(KEY) === null) { if (d.body) banner(); else d.addEventListener("DOMContentLoaded", banner); }
})();