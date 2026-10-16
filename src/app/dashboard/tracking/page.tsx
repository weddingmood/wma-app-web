"use client";

import { useEffect, useState } from "react";

type Ev = { id: string; event_name: string; value: number | string; currency: string; source: string; campaign_id: string | null; fbc: string | null; capi_status: string; capi_response: string | null; created_at: string };
type Data = {
  site: { slug: string; pixelId: string | null; hasToken: boolean; testEventCode: string | null; adSpend: number; currency: string };
  events: Ev[];
  totals: { sent: number; failed: number; pending: number; total: number; fbValue: number; realValue: number | null; roasFacebook: number | null; roasReal: number | null };
};

const STATUS: Record<string, [string, string]> = {
  sent: ["Envoy\u00e9", "#16a34a"], failed: ["\u00c9chou\u00e9", "#dc2626"], pending: ["En attente", "#B45309"], skipped: ["Non configur\u00e9", "#78716c"],
};
const fcfa = (v: number | string | null) => Number(v || 0).toLocaleString("fr-FR") + " F";
const roas = (v: number | null) => (v === null ? "n/d" : v.toFixed(2) + "x");

export default function TrackingPage() {
  const [data, setData] = useState<Data | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pixel, setPixel] = useState("");
  const [token, setToken] = useState("");
  const [test, setTest] = useState("");
  const [spend, setSpend] = useState("0");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/tracking", { cache: "no-store" });
      const d = await res.json();
      if (res.ok && d.success) {
        setData(d as Data);
        setPixel(d.site.pixelId || "");
        setTest(d.site.testEventCode || "");
        setSpend(String(d.site.adSpend || 0));
      } else setMsg(d.message || "Connectez-vous d'abord.");
    } catch {
      setMsg("Connexion indisponible.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/tracking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pixelId: pixel, accessToken: token, testEventCode: test, adSpend: Number(spend) }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d && d.success) {
        setToken("");
        setMsg("R\u00e9glages enregistr\u00e9s \u2714");
        await load();
      } else setMsg((d && d.message) || "Enregistrement impossible.");
    } catch {
      setMsg("Connexion indisponible.");
    } finally {
      setBusy(false);
    }
  };

  const retry = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/tracking", { method: "POST" });
      const d = await res.json().catch(() => null);
      setMsg(d && d.success ? d.sent + " \u00e9v\u00e9nement(s) renvoy\u00e9(s) \u2714" : "Renvoi impossible.");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const box = { padding: 14, border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff", display: "grid", gap: 10 } as const;
  const input = { width: "100%", padding: "8px 10px", border: "1px solid #d6d3d1", borderRadius: 10, fontSize: 14 } as const;
  const lab = { fontSize: 12, fontWeight: 700, display: "grid", gap: 4 } as const;
  const btn = (bg: string) => ({ padding: "9px 13px", borderRadius: 10, border: 0, color: "#fff", background: bg, fontWeight: 700, fontSize: 13, cursor: "pointer" }) as const;

  if (!data) return <div style={{ padding: 16 }}>{msg || "Chargement\u2026"}</div>;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const snippet = '<script src="' + origin + '/wt.js" data-site="' + data.site.slug + '" defer></script>';

  return (
    <div style={{ display: "grid", gap: 14, paddingBottom: 64 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{"Suivi publicitaire"}</h1>
      {msg && <p style={{ fontSize: 13, padding: 10, borderRadius: 10, background: "#f5f5f4" }}>{msg}</p>}

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div style={box}><span style={{ fontSize: 11, fontWeight: 700, color: "#78716c" }}>{"ROAS FACEBOOK (SUIVI)"}</span><strong style={{ fontSize: 24 }}>{roas(data.totals.roasFacebook)}</strong><span style={{ fontSize: 12 }}>{"Achats suivis : " + fcfa(data.totals.fbValue)}</span></div>
        <div style={box}><span style={{ fontSize: 11, fontWeight: 700, color: "#78716c" }}>{"ROAS R\u00c9EL"}</span><strong style={{ fontSize: 24 }}>{roas(data.totals.roasReal)}</strong><span style={{ fontSize: 12 }}>{"Cagnotte v\u00e9rifi\u00e9e : " + (data.totals.realValue === null ? "n/d" : fcfa(data.totals.realValue))}</span></div>
        <div style={box}><span style={{ fontSize: 11, fontWeight: 700, color: "#78716c" }}>{"STATUT CAPI (30 JOURS)"}</span><span style={{ fontSize: 13 }}>{data.totals.sent + " envoy\u00e9s, " + data.totals.failed + " \u00e9chou\u00e9s, " + data.totals.pending + " en attente"}</span></div>
      </div>

      <div style={box}>
        <strong>{"R\u00e9glages Facebook"}</strong>
        <label style={lab}>{"Identifiant du pixel"}<input style={input} inputMode="numeric" value={pixel} onChange={(e) => setPixel(e.target.value)} /></label>
        <label style={lab}>{"Jeton d'acc\u00e8s Conversions API" + (data.site.hasToken ? " (d\u00e9j\u00e0 enregistr\u00e9, laissez vide pour le conserver)" : "")}<input style={input} type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} /></label>
        <label style={lab}>{"Code d'\u00e9v\u00e9nement de test (facultatif)"}<input style={input} value={test} onChange={(e) => setTest(e.target.value)} /></label>
        <label style={lab}>{"D\u00e9pense publicitaire totale (F)"}<input style={input} type="number" min={0} value={spend} onChange={(e) => setSpend(e.target.value)} /></label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" disabled={busy} style={btn("#C05638")} onClick={save}>{"Enregistrer"}</button>
          <button type="button" disabled={busy} style={btn("#2563eb")} onClick={retry}>{"Renvoyer les \u00e9checs"}</button>
        </div>
      </div>

      <div style={box}>
        <strong>{"Installation sur un autre site"}</strong>
        <code style={{ fontSize: 12, wordBreak: "break-all", background: "#f5f5f4", padding: 8, borderRadius: 8 }}>{snippet}</code>
        <button type="button" style={{ ...btn("#6b7280"), justifySelf: "start" }} onClick={() => { void navigator.clipboard.writeText(snippet); setMsg("Code copi\u00e9 \u2714"); }}>{"Copier"}</button>
        <span style={{ fontSize: 12, color: "#57534e" }}>{"Sur votre page d'invitation, le script est d\u00e9j\u00e0 actif. Les visiteurs doivent accepter la mesure d'audience avant tout envoi."}</span>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 640 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#fafaf9" }}>
              {["\u00c9v\u00e9nement", "Valeur", "Source", "Campaign ID", "fbc", "Statut CAPI"].map((h) => (<th key={h} style={{ padding: 10 }}>{h}</th>))}
            </tr>
          </thead>
          <tbody>
            {data.events.length === 0 && (<tr><td colSpan={6} style={{ padding: 14, color: "#78716c" }}>{"Aucun \u00e9v\u00e9nement pour le moment."}</td></tr>)}
            {data.events.map((e) => {
              const st = STATUS[e.capi_status] || [e.capi_status, "#78716c"];
              return (
                <tr key={e.id} style={{ borderTop: "1px solid #f5f5f4" }} title={e.capi_response || ""}>
                  <td style={{ padding: 10 }}>{e.event_name}</td>
                  <td style={{ padding: 10 }}>{Number(e.value) > 0 ? fcfa(e.value) : "-"}</td>
                  <td style={{ padding: 10 }}>{e.source}</td>
                  <td style={{ padding: 10 }}>{e.campaign_id || "-"}</td>
                  <td style={{ padding: 10, fontFamily: "monospace", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.fbc || "-"}</td>
                  <td style={{ padding: 10 }}><span style={{ color: "#fff", background: st[1], padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>{st[0]}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}