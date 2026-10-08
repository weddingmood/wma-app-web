"use client";
import { useEffect, useState } from "react";
type Amb = { id: number; name: string; referral_slug: string; city: string; phone: string; balance: number; total_clients: number; photo_url: string };
type Payout = { id: number; ambassador_id: number; ambassador_name: string; amount: number; proof_url: string; notes: string; created_at: string };

export default function PayoutsPage() {
  const [toPay, setToPay] = useState<Amb[]>([]);
  const [history, setHistory] = useState<Payout[]>([]);
  const [all, setAll] = useState<any[]>([]);
  const [threshold, setThreshold] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Amb | null>(null);
  const [amount, setAmount] = useState("");
  const [proof, setProof] = useState("");
  const [notes, setNotes] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/wma-admin-2026-secure/payouts", { cache: "no-store" })
     .then(r => r.json()).then(d => {
        if (d.success) { setToPay(d.toPay); setHistory(d.history); setAll(d.all); setThreshold(d.threshold); }
      }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const markPaid = async () => {
    if (!selected) return;
    const res = await fetch("/api/wma-admin-2026-secure/payouts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ambassadorId: selected.id, amount: Number(amount), proofUrl: proof, notes })
    });
    const d = await res.json();
    if (d.success) { setSelected(null); setAmount(""); setProof(""); setNotes(""); load(); }
    else alert(d.message);
  };

  const box = { padding: 16, border: "1px solid #e7e5e4", borderRadius: 12, background: "#fff", display: "grid", gap: 10 } as const;
  const btn = { padding: "8px 12px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", border: 0 } as const;

  if (loading) return <main style={{ padding: 24 }}>Chargement...</main>;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px", display: "grid", gap: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Paiements ambassadeurs - Vendredi (Seuil: {threshold.toLocaleString("fr-FR")} F)</h1>

      <section style={box}>
        <h2 style={{ fontWeight: 800 }}>À payer cette semaine ({toPay.length})</h2>
        {toPay.length === 0 && <p style={{ fontSize: 14, color: "#78716c" }}>Aucun ambassadeur n'a atteint le seuil.</p>}
        <div style={{ display: "grid", gap: 8 }}>
          {toPay.map(a => (
            <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, border: "1px solid #D4AF37", borderRadius: 12, background: "#FFFBEB" }}>
              <div style={{ flex: 1 }}>
                <strong>{a.name}</strong> - {a.city} - {a.phone}<br/>
                <span style={{ fontSize: 13 }}>Solde: <strong style={{ color: "#15803d" }}>{Number(a.balance).toLocaleString("fr-FR")} F</strong> | Clients: {a.total_clients} | /r/{a.referral_slug}</span>
              </div>
              <button onClick={() => { setSelected(a); setAmount(String(a.balance)); }} style={{...btn, background: "#16a34a", color: "#fff" }}>Payer</button>
            </div>
          ))}
        </div>
      </section>

      {selected && (
        <section style={{...box, border: "2px solid #16a34a", background: "#f0fdf4" }}>
          <h3>Payer {selected.name} - Solde {Number(selected.balance).toLocaleString("fr-FR")} F</h3>
          <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>Montant payé (F)<input value={amount} onChange={e => setAmount(e.target.value)} type="number" style={{ padding: 8, borderRadius: 8, border: "1px solid #d6d3d1" }} /></label>
          <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>Lien preuve (capture Wave)<input value={proof} onChange={e => setProof(e.target.value)} placeholder="https://..." style={{ padding: 8, borderRadius: 8, border: "1px solid #d6d3d1" }} /></label>
          <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>Notes<input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payé via Wave le..." style={{ padding: 8, borderRadius: 8, border: "1px solid #d6d3d1" }} /></label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={markPaid} style={{...btn, background: "#16a34a", color: "#fff" }}>Marquer payé et déduire solde</button>
            <button onClick={() => setSelected(null)} style={{...btn, background: "#fff", border: "1px solid #d6d3d1" }}>Annuler</button>
          </div>
        </section>
      )}

      <section style={box}>
        <h2 style={{ fontWeight: 800 }}>Tous les soldes actifs</h2>
        <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
          {all.map((a: any) => <div key={a.id}>{a.name} - {Number(a.balance).toLocaleString("fr-FR")} F - {a.phone}</div>)}
        </div>
      </section>

      <section style={box}>
        <h2 style={{ fontWeight: 800 }}>Historique des paiements</h2>
        {history.map(h => (
          <div key={h.id} style={{ padding: "8px 0", borderBottom: "1px solid #f5f5f4", fontSize: 13 }}>
            {new Date(h.created_at).toLocaleDateString("fr-FR")} - {h.ambassador_name} - {Number(h.amount).toLocaleString("fr-FR")} F {h.proof_url && <a href={h.proof_url} target="_blank" style={{ color: "#2563eb" }}>Preuve</a>} {h.notes && <>- {h.notes}</>}
          </div>
        ))}
      </section>
    </main>
  );
}