"use client";
import { useState } from "react";
import Link from "next/link";

export default function AmbassadeurDashboard() {
  const [code, setCode] = useState("");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setErr(null); setBusy(true);
    try {
      const res = await fetch("/api/ambassadors/dashboard?code=" + encodeURIComponent(code.trim().toUpperCase()), { cache: "no-store" });
      const d = await res.json();
      if (d.success) { setData(d); localStorage.setItem("amb_code", code.trim().toUpperCase()); }
      else setErr(d.message || "Code invalide");
    } catch { setErr("Connexion impossible"); } finally { setBusy(false); }
  };

  const box = { padding: 16, border: "1px solid #e7e5e4", borderRadius: 14, background: "#fff", display: "grid", gap: 10 } as const;
  const btn = { padding: "12px 14px", borderRadius: 12, fontWeight: 800, fontSize: 14, textAlign: "center", border: 0, cursor: "pointer" } as const;

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 64px", display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Espace Ambassadeur</h1>

      {!data && (
        <div style={box}>
          <p style={{ fontSize: 14, color: "#57534e" }}>Entrez votre code ambassadeur (ex: WM-RAPH-FEV). Votre lien est wedding.bouakestore.com/r/{data?.ambassador?.slug || "votre-nom"}</p>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="WM-..." style={{ width: "100%", padding: "12px", border: "1px solid #d6d3d1", borderRadius: 10, fontFamily: "monospace", fontSize: 15 }} />
          {err && <span style={{ fontSize: 13, color: "#dc2626" }}>{err}</span>}
          <button onClick={load} disabled={busy || !code.trim()} style={{...btn, background: "#16a34a", color: "#fff"}}>{busy ? "..." : "Voir mon solde"}</button>
          <Link href="/" style={{ fontSize: 12, color: "#78716c" }}>Retour accueil</Link>
        </div>
      )}

      {data && (
        <>
          <div style={{ ...box, background: "#FFFBEB", border: "1px solid #D4AF37" }}>
            <strong>Bonjour {data.ambassador.name} !</strong>
            <div style={{ fontSize: 13 }}>Lien: <strong>wedding.bouakestore.com/r/{data.ambassador.slug}</strong></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
              <div style={{ padding: 12, background: "#fff", borderRadius: 12, border: "1px solid #e7e5e4" }}><div style={{ fontSize: 11, color: "#78716c" }}>SOLDE ACTUEL</div><div style={{ fontSize: 20, fontWeight: 800, color: "#15803d" }}>{Number(data.ambassador.balance).toLocaleString("fr-FR")} F</div></div>
              <div style={{ padding: 12, background: "#fff", borderRadius: 12, border: "1px solid #e7e5e4" }}><div style={{ fontSize: 11, color: "#78716c" }}>TOTAL GAGNÉ</div><div style={{ fontSize: 20, fontWeight: 800 }}>{Number(data.ambassador.totalPaid + data.ambassador.balance).toLocaleString("fr-FR")} F</div></div>
              <div style={{ padding: 12, background: "#fff", borderRadius: 12, border: "1px solid #e7e5e4" }}><div style={{ fontSize: 11, color: "#78716c" }}>CLICS</div><div style={{ fontSize: 18, fontWeight: 700 }}>{data.ambassador.totalClicks}</div></div>
              <div style={{ padding: 12, background: "#fff", borderRadius: 12, border: "1px solid #e7e5e4" }}><div style={{ fontSize: 11, color: "#78716c" }}>CLIENTS</div><div style={{ fontSize: 18, fontWeight: 700 }}>{data.ambassador.totalClients}</div></div>
            </div>
            <div style={{ fontSize: 12, color: "#57534e", marginTop: 6 }}>Paiements chaque vendredi dès {5000}F. Partage ton lien /r/{data.ambassador.slug} pour gagner 15%.</div>
          </div>

          <div style={box}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Derniers clients ({data.clients.length})</h3>
            {data.clients.length === 0 && <span style={{ fontSize: 13, color: "#78716c" }}>Aucun client pour l'instant. Partage ton lien.</span>}
            {data.clients.map((c: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f5f5f4" }}>
                <span>{c.couple_name || "Couple"} - {Number(c.amount).toLocaleString("fr-FR")}F</span>
                <span style={{ color: "#15803d", fontWeight: 700 }}>+{Number(c.commission_amount).toLocaleString("fr-FR")}F</span>
                <span style={{ fontSize: 11, color: c.status === "verified" ? "#15803d" : "#a8a29e" }}>{c.status}</span>
              </div>
            ))}
          </div>

          <div style={box}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Historique paiements reçus</h3>
            {data.payouts.length === 0 && <span style={{ fontSize: 13, color: "#78716c" }}>Aucun paiement reçu pour l'instant.</span>}
            {data.payouts.map((p: any, i: number) => (
              <div key={i} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f5f5f4" }}>{new Date(p.created_at).toLocaleDateString("fr-FR")} - {Number(p.amount).toLocaleString("fr-FR")}F {p.notes ? "- " + p.notes : ""}</div>
            ))}
          </div>

          <button onClick={() => { setData(null); setCode(""); localStorage.removeItem("amb_code"); }} style={{...btn, background: "#fff", border: "1px solid #d6d3d1"}}>Se déconnecter</button>
        </>
      )}
    </main>
  );
}