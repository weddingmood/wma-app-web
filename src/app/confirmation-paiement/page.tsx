"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const WHATSAPP_NUMBER = "22570501356";

const PACKS = [
  { value: "individual", label: "Individuelle - 2 000 FCFA", planType: "individual", amount: 2000 },
  { value: "standard_couple", label: "Couple Standard - 3 000 FCFA", planType: "standard_couple", amount: 3000 },
  { value: "premium_couple", label: "Couple Premium - 5 000 FCFA", planType: "premium_couple", amount: 5000 },
  { value: "upgrade_premium", label: "Compl\u00e9ment Standard vers Premium - 2 000 FCFA", planType: "premium_couple", amount: 2000 },
];

type Amb = { slug: string; name: string; city: string; countrySlug: string; countryName: string; flag: string; photoUrl: string };

export default function ConfirmationPaiementPage() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(true);
  const [pack, setPack] = useState("premium_couple");
  const [coupleName, setCoupleName] = useState("");
  const [email, setEmail] = useState("");
  const [waveNumber, setWaveNumber] = useState("");
  const [txId, setTxId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ label: string; amount: number; ambassador: string } | null>(null);

  const [ambs, setAmbs] = useState<Amb[]>([]);
  const [rate, setRate] = useState(15);
  const [selected, setSelected] = useState<string | null>(null);
  const [noAmb, setNoAmb] = useState(false);
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [showCode, setShowCode] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [codeMsg, setCodeMsg] = useState<string | null>(null);

  const addToList = (a: Amb) => setAmbs((list) => (list.some((x) => x.slug === a.slug) ? list : [a, ...list]));

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("pack");
    if (wanted && PACKS.some((p) => p.value === wanted)) setPack(wanted);

    fetch("/api/payments", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          setLoggedIn(false);
          return;
        }
        const d = await res.json().catch(() => null);
        if (d && d.success) {
          setCoupleName([d.partner1Name, d.partner2Name].filter(Boolean).join(" et "));
          setEmail(d.partner1Email || "");
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));

    fetch("/api/ambassadors/list", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.ambassadors)) {
          setAmbs(
            d.ambassadors.map((x: Record<string, string>) => ({
              slug: x.slug, name: x.name, city: x.city || "", countrySlug: x.country_slug || "",
              countryName: x.country_name || "", flag: x.flag || "", photoUrl: x.photo_url || "",
            }))
          );
          setRate(Number(d.commissionRate) || 15);
        }
      })
      .catch(() => {});

    // Ambassadeur memorise par le lien de recommandation : deja coche
    fetch("/api/ambassadors/check", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d && d.valid && d.ambassador && d.ambassador.slug) {
          addToList(d.ambassador as Amb);
          setSelected(d.ambassador.slug);
        }
      })
      .catch(() => {});
  }, []);

  const selectedPack = PACKS.find((p) => p.value === pack) ?? PACKS[2];
  const selectedAmb = ambs.find((a) => a.slug === selected) || null;
  const commission = Math.round((selectedPack.amount * rate) / 100);

  const countries = useMemo(() => {
    const map = new Map<string, string>();
    ambs.forEach((a) => {
      if (a.countrySlug) map.set(a.countrySlug, (a.flag ? a.flag + " " : "") + a.countryName);
    });
    return Array.from(map.entries());
  }, [ambs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ambs.filter((a) => {
      if (countryFilter !== "all" && a.countrySlug !== countryFilter) return false;
      if (!q) return true;
      return (a.name + " " + a.city).toLowerCase().includes(q);
    });
  }, [ambs, query, countryFilter]);

  const toggleAmb = (slug: string) => {
    if (selected === slug) setSelected(null);
    else {
      setSelected(slug);
      setNoAmb(false);
    }
  };

  const verifyCode = async () => {
    const code = codeInput.trim();
    if (!code) {
      setCodeMsg("Saisissez le code de votre ambassadeur.");
      return;
    }
    setChecking(true);
    setCodeMsg(null);
    try {
      const res = await fetch("/api/ambassadors/check?code=" + encodeURIComponent(code), { cache: "no-store" });
      const d = await res.json();
      if (d && d.valid && d.ambassador && d.ambassador.slug) {
        addToList(d.ambassador as Amb);
        setSelected(d.ambassador.slug);
        setNoAmb(false);
        setCodeMsg("Ambassadeur trouv\u00e9 \u2714");
      } else {
        setCodeMsg("Code introuvable. Cochez plut\u00f4t votre ambassadeur dans la liste.");
      }
    } catch {
      setCodeMsg("V\u00e9rification impossible pour le moment.");
    } finally {
      setChecking(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (!selectedAmb && !noAmb) {
      setError("Cochez votre ambassadeur dans la liste, ou cochez \u00ab Aucun ambassadeur \u00bb.");
      return;
    }
    if (txId.trim().length < 4) {
      setError("Indiquez l'identifiant de transaction Wave (re\u00e7u par SMS ou dans l'application Wave).");
      return;
    }
    if (!waveNumber.trim()) {
      setError("Indiquez le num\u00e9ro Wave qui a effectu\u00e9 le paiement.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: selectedPack.planType,
          amount: selectedPack.amount,
          payerEmail: email,
          paymentDate: new Date().toISOString().slice(0, 10),
          referenceNumber: txId.trim(),
          coupleName,
          waveNumber,
          ambassadorSlug: selectedAmb ? selectedAmb.slug : "",
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        setDone({ label: selectedPack.label, amount: selectedPack.amount, ambassador: selectedAmb ? selectedAmb.name : "aucun" });
      } else setError((data && data.message) || "Envoi impossible. R\u00e9essayez dans un instant.");
    } catch {
      setError("Connexion indisponible.");
    } finally {
      setBusy(false);
    }
  };

  const box = { padding: 18, border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff", display: "grid", gap: 12 } as const;
  const input = { width: "100%", padding: "9px 11px", border: "1px solid #d6d3d1", borderRadius: 10, fontSize: 14 } as const;
  const lab = { fontSize: 12, fontWeight: 700, display: "grid", gap: 4 } as const;
  const btn = { padding: "12px 14px", borderRadius: 14, fontWeight: 800, fontSize: 14, textAlign: "center", display: "block", border: 0, cursor: "pointer" } as const;

  const waText = done
    ? "\uD83D\uDD14 NOUVEAU PAIEMENT - " + done.label + " - Couple: " + coupleName + " - Email: " + email + " - Tel Wave: " + waveNumber + " - TxID: " + txId + " - Ambassadeur: " + done.ambassador + " - \u00c0 ACTIVER"
    : "";

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 64px", display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>{"Confirmer mon paiement Wave"}</h1>

      {!ready && <p>{"Chargement\u2026"}</p>}

      {ready && !loggedIn && (
        <div style={box}>
          <p style={{ fontSize: 14 }}>{"Connectez-vous d'abord \u00e0 votre espace Wedding Mood, puis revenez sur cette page pour confirmer votre paiement."}</p>
          <Link href="/dashboard" style={{ ...btn, background: "#C05638", color: "#fff" }}>
            {"Me connecter"}
          </Link>
        </div>
      )}

      {ready && loggedIn && done && (
        <div style={box}>
          <strong>{"Merci ! Votre demande est enregistr\u00e9e."}</strong>
          <p style={{ fontSize: 14, color: "#57534e" }}>
            {"Notre \u00e9quipe v\u00e9rifie votre paiement de " + done.amount.toLocaleString("fr-FR") + " FCFA (" + done.label + ") et active votre pack."}
          </p>
          <a
            href={"https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(waText)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...btn, background: "#16a34a", color: "#fff" }}
          >
            {"Pr\u00e9venir l'\u00e9quipe sur WhatsApp"}
          </a>
          <Link href="/dashboard" style={{ fontSize: 13 }}>{"Retour \u00e0 mon espace"}</Link>
        </div>
      )}

      {ready && loggedIn && !done && (
        <div style={box}>
          <label style={lab}>
            {"Pack choisi"}
            <select style={input} value={pack} onChange={(e) => setPack(e.target.value)}>
              {PACKS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <label style={lab}>
            {"Nom du couple"}
            <input style={input} value={coupleName} onChange={(e) => setCoupleName(e.target.value)} />
          </label>
          <label style={lab}>
            {"Email du compte Wedding Mood"}
            <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label style={lab}>
            {"Num\u00e9ro Wave ayant pay\u00e9"}
            <input style={input} type="tel" placeholder="+225 ..." value={waveNumber} onChange={(e) => setWaveNumber(e.target.value)} />
          </label>
          <label style={lab}>
            {"Identifiant de transaction Wave"}
            <input style={input} value={txId} onChange={(e) => setTxId(e.target.value)} />
          </label>

          <div style={{ padding: 14, border: "1px solid #D4AF37", borderRadius: 14, background: "#FFFBEB", display: "grid", gap: 10 }}>
            <strong>{"Qui vous a recommand\u00e9 ? Cochez votre ambassadeur"}</strong>

            {ambs.length > 5 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input style={{ ...input, flex: 1, minWidth: 140 }} placeholder="Rechercher un nom ou une ville" value={query} onChange={(e) => setQuery(e.target.value)} />
                {countries.length > 1 && (
                  <select style={{ ...input, width: "auto" }} value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
                    <option value="all">{"Tous les pays"}</option>
                    {countries.map(([slug, label]) => (
                      <option key={slug} value={slug}>{label}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div style={{ maxHeight: 300, overflowY: "auto", display: "grid", gap: 8 }}>
              {filtered.length === 0 && <span style={{ fontSize: 13, color: "#78716c" }}>{ambs.length === 0 ? "Aucun ambassadeur pour le moment." : "Aucun r\u00e9sultat."}</span>}
              {filtered.map((a) => {
                const on = selected === a.slug && !noAmb;
                return (
                  <label
                    key={a.slug}
                    style={{ display: "flex", gap: 10, alignItems: "center", padding: 10, borderRadius: 12, cursor: "pointer", border: on ? "2px solid #16a34a" : "1px solid #e7e5e4", background: on ? "#f0fdf4" : "#fff" }}
                  >
                    <input type="checkbox" checked={on} onChange={() => toggleAmb(a.slug)} style={{ width: 22, height: 22, accentColor: "#16a34a" }} />
                    {a.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.photoUrl} alt="" style={{ width: 44, height: 44, borderRadius: 999, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 999, background: "#f5f5f4" }} />
                    )}
                    <div style={{ display: "grid", gap: 2 }}>
                      <strong style={{ fontSize: 14 }}>{a.name}</strong>
                      <span style={{ fontSize: 12, color: "#78716c" }}>{(a.flag ? a.flag + " " : "") + a.city + (a.countryName ? ", " + a.countryName : "")}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={noAmb}
                onChange={(e) => {
                  setNoAmb(e.target.checked);
                  if (e.target.checked) setSelected(null);
                }}
                style={{ width: 20, height: 20 }}
              />
              <span>{"Aucun ambassadeur"}</span>
            </label>

            <button type="button" onClick={() => setShowCode((v) => !v)} style={{ background: "transparent", border: 0, color: "#C05638", fontSize: 13, textAlign: "left", cursor: "pointer", padding: 0 }}>
              {showCode ? "Masquer le champ code" : "J'ai un code ambassadeur"}
            </button>
            {showCode && (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input style={{ ...input, fontFamily: "monospace" }} placeholder="WM-AICHA-73X" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} />
                  <button type="button" disabled={checking} onClick={verifyCode} style={{ ...btn, background: "#2563eb", color: "#fff", padding: "9px 14px", whiteSpace: "nowrap" }}>
                    {checking ? "\u2026" : "V\u00e9rifier"}
                  </button>
                </div>
                {codeMsg && <span style={{ fontSize: 12 }}>{codeMsg}</span>}
              </div>
            )}

            <div style={{ fontSize: 13, display: "grid", gap: 3, borderTop: "1px dashed #D4AF37", paddingTop: 8 }}>
              <span>{"Montant du pack : " + selectedPack.amount.toLocaleString("fr-FR") + " FCFA"}</span>
              {selectedAmb && !noAmb && <span>{"Ambassadeur : " + selectedAmb.name}</span>}
              {selectedAmb && !noAmb && (
                <span style={{ color: "#15803d", fontWeight: 700 }}>
                  {rate + " % = " + commission.toLocaleString("fr-FR") + " FCFA revers\u00e9s \u00e0 votre ambassadeur"}
                </span>
              )}
              <strong>{"Vous payez : " + selectedPack.amount.toLocaleString("fr-FR") + " FCFA (prix inchang\u00e9)"}</strong>
            </div>
          </div>

          {error && <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>}
          <button type="button" disabled={busy} onClick={submit} style={{ ...btn, background: "#C05638", color: "#fff" }}>
            {busy ? "Envoi en cours\u2026" : "Envoyer ma confirmation"}
          </button>
        </div>
      )}
    </main>
  );
}