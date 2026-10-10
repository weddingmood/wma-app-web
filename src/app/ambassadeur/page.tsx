"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AmbassadorCard from "@/components/AmbassadorCard";

function Stat({ label, value, big }: { label: string; value: string | number; big?: boolean }) {
  return (
    <div style={{ padding: 12, background: "var(--wm-surface-pure, #fff)", borderRadius: 12, border: "1px solid var(--wm-border, var(--wm-line))" }}>
      <div style={{ fontSize: 11, color: "var(--wm-text-muted, var(--wm-text-faint))" }}>{label}</div>
      <div style={{ fontSize: big ? 20 : 18, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

export default function AmbassadeurDashboard() {
  const [code, setCode] = useState("");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (value: string) => {
    const c = value.trim().toUpperCase();
    if (!c) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ambassadors/dashboard?code=" + encodeURIComponent(c), { cache: "no-store" });
      const d = await res.json();
      if (d.success) {
        setData(d);
        setCode(c);
        localStorage.setItem("amb_code", c);
      } else {
        setErr(d.message || "Code invalide");
        localStorage.removeItem("amb_code");
      }
    } catch {
      setErr("Connexion impossible");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("amb_code");
      if (saved) load(saved);
    } catch {}
  }, [load]);

  const box = { padding: 16, border: "1px solid var(--wm-border, var(--wm-line))", borderRadius: 14, background: "var(--wm-surface-pure, #fff)", display: "grid", gap: 10 } as const;
  const btn = { padding: "12px 14px", borderRadius: 12, fontWeight: 800, fontSize: 14, textAlign: "center", border: 0, cursor: "pointer" } as const;
  const muted = "var(--wm-text-muted, var(--wm-text-faint))";

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 64px", display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Espace Ambassadeur</h1>

      {!data && (
        <div style={box}>
          <p style={{ fontSize: 14, color: muted }}>{"Entrez votre code ambassadeur (ex : WM-RAPH-FEV)."}</p>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WM-..." style={{ width: "100%", padding: "12px", border: "1px solid var(--wm-border, #d6d3d1)", borderRadius: 10, fontFamily: "monospace", fontSize: 15 }} />
          {err && <span style={{ fontSize: 13, color: "#dc2626" }}>{err}</span>}
          <button onClick={() => load(code)} disabled={busy || !code.trim()} style={{ ...btn, background: "var(--wm-primary, #16a34a)", color: "#fff" }}>{busy ? "..." : "Voir mon solde"}</button>
          <Link href="/" style={{ fontSize: 12, color: muted }}>Retour accueil</Link>
        </div>
      )}

      {data && (
        <>
          <div style={{ ...box, background: "var(--wm-accent-gold-light, #FFFBEB)", border: "1px solid var(--wm-accent-gold, var(--wm-accent-gold))" }}>
            <strong>{"Bonjour " + data.ambassador.name + " !"}</strong>
<AmbassadorCard name={data.ambassador.name} city={data.ambassador.city} countryName={data.ambassador.countryName} flag={data.ambassador.flag} photoUrl={data.ambassador.photoUrl} slug={data.ambassador.slug} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
              <Stat big label="SOLDE ACTUEL" value={Number(data.ambassador.balance).toLocaleString("fr-FR") + " F"} />
              <Stat big label={"TOTAL GAGN\u00c9"} value={Number(data.ambassador.totalPaid + data.ambassador.balance).toLocaleString("fr-FR") + " F"} />
              <Stat label="CLICS" value={data.ambassador.totalClicks} />
              <Stat label="CLIENTS" value={data.ambassador.totalClients} />
            </div>
            <div style={{ fontSize: 12, color: muted, marginTop: 6 }}>{"Paiements chaque vendredi d\u00e8s 5 000 F. Partage ton lien pour gagner 15 %."}</div>
          </div>

          <div style={box}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>{"Derniers clients (" + data.clients.length + ")"}</h3>
            {data.clients.length === 0 && <span style={{ fontSize: 13, color: muted }}>{"Aucun client pour l'instant. Partage ton lien."}</span>}
            {data.clients.map((c: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f5f5f4" }}>
                <span>{(c.couple_name || "Couple") + " - " + Number(c.amount).toLocaleString("fr-FR") + " F"}</span>
                <span style={{ color: "#15803d", fontWeight: 700 }}>{"+" + Number(c.commission_amount).toLocaleString("fr-FR") + " F"}</span>
                <span style={{ fontSize: 11, color: c.status === "verified" ? "#15803d" : "#a8a29e" }}>{c.status}</span>
              </div>
            ))}
          </div>

          <div style={box}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>{"Historique des paiements re\u00e7us"}</h3>
            {data.payouts.length === 0 && <span style={{ fontSize: 13, color: muted }}>{"Aucun paiement re\u00e7u pour l'instant."}</span>}
            {data.payouts.map((p: any, i: number) => (
              <div key={i} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f5f5f4" }}>
                {new Date(p.created_at).toLocaleDateString("fr-FR") + " - " + Number(p.amount).toLocaleString("fr-FR") + " F" + (p.notes ? " - " + p.notes : "")}
              </div>
            ))}
          </div>

          <button onClick={() => { setData(null); setCode(""); localStorage.removeItem("amb_code"); }} style={{ ...btn, background: "var(--wm-surface-pure, #fff)", border: "1px solid var(--wm-border, #d6d3d1)" }}>{"Se d\u00e9connecter"}</button>
        </>
      )}
    </main>
  );
}