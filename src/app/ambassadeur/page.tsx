"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AmbassadorCard from "@/components/AmbassadorCard";

function Stat({ label, value, big }: { label: string; value: string | number; big?: boolean }) {
  return (
    <div style={{ padding: 12, background: "var(--wm-surface-pure, #fff)", borderRadius: 12, border: "1px solid var(--wm-border, #e7e5e4)" }}>
      <div style={{ fontSize: 11, color: "var(--wm-text-muted, #78716c)" }}>{label}</div>
      <div style={{ fontSize: big ? 20 : 18, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

export default function AmbassadeurDashboard() {
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/ambassadors/dashboard", { cache: "no-store" });
      const d = await res.json();
      if (d.success) { setData(d); return true; }
    } catch {}
    return false;
  }, []);

  useEffect(() => {
    try { localStorage.removeItem("amb_code"); } catch {}
    load().finally(() => setChecking(false));
  }, [load]);

  const login = async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ambassadors/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), pin: pin.trim() }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d && d.success) {
        setPin("");
        const ok = await load();
        if (!ok) setErr("Connexion impossible");
      } else {
        setErr((d && d.message) || "Code ou PIN incorrect");
      }
    } catch {
      setErr("Connexion impossible");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try { await fetch("/api/ambassadors/logout", { method: "POST" }); } catch {}
    setData(null);
    setCode("");
    setPin("");
  };

  const box = { padding: 16, border: "1px solid var(--wm-border, #e7e5e4)", borderRadius: 14, background: "var(--wm-surface-pure, #fff)", display: "grid", gap: 10 } as const;
  const btn = { padding: "12px 14px", borderRadius: 12, fontWeight: 800, fontSize: 14, textAlign: "center", border: 0, cursor: "pointer" } as const;
  const field = { width: "100%", padding: "12px", border: "1px solid var(--wm-border, #d6d3d1)", borderRadius: 10, fontFamily: "monospace", fontSize: 15 } as const;
  const muted = "var(--wm-text-muted, #78716c)";

  if (checking) {
    return <main style={{ maxWidth: 520, margin: "0 auto", padding: "40px 16px", textAlign: "center", color: muted }}>{"Chargement..."}</main>;
  }

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 64px", display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Espace Ambassadeur</h1>

      {!data && (
        <div style={box}>
          <p style={{ fontSize: 14, color: muted }}>{"Entrez votre code ambassadeur (ex : WM-RAPH-FEV) et votre PIN."}</p>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WM-..." autoCapitalize="characters" style={field} />
          <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" type="password" inputMode="numeric" maxLength={8} style={field}
            onKeyDown={(e) => { if (e.key === "Enter" && code.trim() && pin.trim() && !busy) login(); }} />
          {err && <span style={{ fontSize: 13, color: "#dc2626" }}>{err}</span>}
          <button onClick={login} disabled={busy || !code.trim() || !pin.trim()} style={{ ...btn, background: "var(--wm-primary, #16a34a)", color: "#fff" }}>{busy ? "..." : "Voir mon solde"}</button>
          <span style={{ fontSize: 12, color: muted }}>{"PIN oubli\u00e9 ? Demandez-en un nouveau \u00e0 l'\u00e9quipe Wedding Mood."}</span>
          <Link href="/" style={{ fontSize: 12, color: muted }}>Retour accueil</Link>
        </div>
      )}

      {data && (
        <>
          <div style={{ ...box, background: "var(--wm-accent-gold-light, #FFFBEB)", border: "1px solid var(--wm-accent-gold, #D4AF37)" }}>
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

          <button onClick={logout} style={{ ...btn, background: "var(--wm-surface-pure, #fff)", border: "1px solid var(--wm-border, #d6d3d1)" }}>{"Se d\u00e9connecter"}</button>
        </>
      )}
    </main>
  );
}