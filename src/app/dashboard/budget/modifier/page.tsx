"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Category = { id: number; name: string; allocatedAmount: number | null };

export default function ModifierBudgetPage() {
  const [total, setTotal] = useState("");
  const [cats, setCats] = useState<Category[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/budget", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) {
          setMsg(d.message || "Chargement impossible.");
          return;
        }
        setTotal(String(d.summary.totalBudget));
        setCats(d.categories as Category[]);
      })
      .catch(() => setMsg("Connexion indisponible."));
  }, []);

  const send = async (key: string, payload: Record<string, unknown>) => {
    setBusy(key);
    setMsg(null);
    try {
      const res = await fetch("/api/budget", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setMsg(res.ok && data.success ? "Enregistr\u00e9 \u2714" : data.message || "\u00c9chec de l'enregistrement.");
    } catch {
      setMsg("Connexion indisponible.");
    } finally {
      setBusy(null);
    }
  };

  const updateCat = (id: number, patch: Partial<Category>) =>
    setCats((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const box = { padding: 14, border: "1px solid var(--wm-line)", borderRadius: 16, background: "#fff" } as const;
  const input = { width: "100%", padding: "8px 10px", border: "1px solid #d6d3d1", borderRadius: 10 } as const;
  const btn = { padding: "8px 14px", borderRadius: 10, border: 0, color: "#fff", background: "var(--wm-primary)", cursor: "pointer" } as const;

  return (
    <div style={{ display: "grid", gap: 16, paddingBottom: 64 }}>
      <Link href="/dashboard/budget" style={{ fontSize: 13 }}>
        {"\u2190 Retour au budget"}
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{"Modifier mon budget"}</h1>

      <div style={box}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>{"Budget total (FCFA)"}</label>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <input style={input} type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} />
          <button style={btn} disabled={busy === "total"} onClick={() => send("total", { totalBudget: Number(total) })}>
            {"Enregistrer"}
          </button>
        </div>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700 }}>{"Cat\u00e9gories"}</h2>
      {cats.map((c) => (
        <div key={c.id} style={{ ...box, display: "grid", gap: 8 }}>
          <input style={input} value={c.name} onChange={(e) => updateCat(c.id, { name: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={input}
              type="number"
              min={0}
              value={c.allocatedAmount ?? 0}
              onChange={(e) => updateCat(c.id, { allocatedAmount: Number(e.target.value) })}
            />
            <button
              style={btn}
              disabled={busy === "cat" + c.id}
              onClick={() => send("cat" + c.id, { categoryId: c.id, name: c.name, allocatedAmount: c.allocatedAmount ?? 0 })}
            >
              {"Enregistrer"}
            </button>
          </div>
        </div>
      ))}

      {msg && <p style={{ fontSize: 13 }}>{msg}</p>}
    </div>
  );
}