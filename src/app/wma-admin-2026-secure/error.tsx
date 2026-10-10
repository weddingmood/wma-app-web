"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const btn = { padding: "10px 14px", borderRadius: 12, fontWeight: 800, fontSize: 13, border: 0, cursor: "pointer", textDecoration: "none" } as const;
  return (
    <div style={{ padding: 24, display: "grid", gap: 12, maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800 }}>{"Un probl\u00e8me est survenu dans l'administration"}</h2>
      <p style={{ fontSize: 13, color: "#57534e" }}>
        {"Message : " + (error.message || "inconnu") + (error.digest ? " (r\u00e9f. " + error.digest + ")" : "")}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => reset()} style={{ ...btn, background: "#800020", color: "#fff" }}>{"R\u00e9essayer"}</button>
        <a href="/wma-admin-2026-secure" style={{ ...btn, background: "#fff", color: "#800020", border: "1px solid #800020" }}>{"Retour au tableau de bord"}</a>
      </div>
    </div>
  );
}