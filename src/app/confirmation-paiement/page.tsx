"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const WHATSAPP_NUMBER = "22570501356";

const PACKS = [
  { value: "individual", label: "Individuelle - 2 000 FCFA", planType: "individual", amount: 2000 },
  { value: "standard_couple", label: "Couple Standard - 3 000 FCFA", planType: "standard_couple", amount: 3000 },
  { value: "premium_couple", label: "Couple Premium - 5 000 FCFA", planType: "premium_couple", amount: 5000 },
  { value: "upgrade_premium", label: "Compl\u00e9ment Standard vers Premium - 2 000 FCFA", planType: "premium_couple", amount: 2000 },
];

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
  const [done, setDone] = useState<{ label: string; amount: number } | null>(null);

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
  }, []);

  const selected = PACKS.find((p) => p.value === pack) ?? PACKS[2];

  const submit = async () => {
    setError(null);
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
          planType: selected.planType,
          amount: selected.amount,
          payerEmail: email,
          paymentDate: new Date().toISOString().slice(0, 10),
          referenceNumber: txId.trim(),
          coupleName,
          waveNumber,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) setDone({ label: selected.label, amount: selected.amount });
      else setError((data && data.message) || "Envoi impossible. R\u00e9essayez dans un instant.");
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
    ? "\uD83D\uDD14 NOUVEAU PAIEMENT - " + done.label + " - Couple: " + coupleName + " - Email: " + email + " - Tel Wave: " + waveNumber + " - TxID: " + txId + " - \u00c0 ACTIVER"
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
          {error && <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>}
          <button type="button" disabled={busy} onClick={submit} style={{ ...btn, background: "#C05638", color: "#fff" }}>
            {busy ? "Envoi en cours\u2026" : "Envoyer ma confirmation"}
          </button>
        </div>
      )}
    </main>
  );
}