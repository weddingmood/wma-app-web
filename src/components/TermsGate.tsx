"use client";

import { useEffect, useRef, useState } from "react";
import { TERMS_VERSION } from "@/lib/legal-version";

const KEY = "wm_terms_accepted";

type Pending = { context: "payment" | "signup"; resume: () => void };

function accepted(): boolean {
  try { return localStorage.getItem(KEY) === TERMS_VERSION; } catch { return false; }
}

export default function TermsGate() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [checked, setChecked] = useState(false);
  const allow = useRef(false);
  const boxRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const release = () => { window.setTimeout(() => { allow.current = false; }, 0); };

    const onClick = (ev: MouseEvent) => {
      if (allow.current || accepted()) return;
      const t = ev.target as Element | null;
      const a = t && t.closest ? (t.closest("a") as HTMLAnchorElement | null) : null;
      if (!a || (a.getAttribute("href") || "").indexOf("pay.wave.com") < 0) return;
      ev.preventDefault();
      ev.stopPropagation();
      setChecked(false);
      setPending({
        context: "payment",
        resume: () => { allow.current = true; try { a.click(); } finally { release(); } },
      });
    };

    const onSubmit = (ev: Event) => {
      if (allow.current || accepted()) return;
      const form = ev.target as HTMLFormElement | null;
      if (!form || form.tagName !== "FORM") return;
      const isPay = window.location.pathname === "/confirmation-paiement";
      const isSignup = (form.textContent || "").indexOf("Cr\u00e9er Notre Espace") >= 0;
      if (!isPay && !isSignup) return;
      ev.preventDefault();
      ev.stopPropagation();
      setChecked(false);
      setPending({
        context: isPay ? "payment" : "signup",
        resume: () => {
          allow.current = true;
          try {
            if (typeof form.requestSubmit === "function") form.requestSubmit();
            else form.submit();
          } finally { release(); }
        },
      });
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  useEffect(() => {
    if (pending && boxRef.current) { try { boxRef.current.focus(); } catch {} }
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPending(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending]);

  if (!pending) return null;

  const confirm = () => {
    if (!checked) return;
    try { localStorage.setItem(KEY, TERMS_VERSION); } catch {}
    let sid = "";
    try { sid = sessionStorage.getItem("wm_sid") || ""; } catch {}
    try {
      fetch("/api/terms/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: TERMS_VERSION, context: pending.context, sid }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
    const go = pending.resume;
    setPending(null);
    go();
  };

  const link = { color: "var(--wm-primary, #C05638)", fontWeight: 700, textDecoration: "underline" } as const;
  const btn = (primary: boolean, off?: boolean): React.CSSProperties => ({
    padding: "11px 14px", borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: off ? "not-allowed" : "pointer",
    border: primary ? "0" : "1px solid var(--wm-border, #d6d3d1)",
    background: primary ? "var(--wm-primary, #C05638)" : "var(--wm-surface-pure, #fff)",
    color: primary ? "#fff" : "inherit", opacity: off ? 0.5 : 1,
  });

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="wm-terms-title" style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ maxWidth: 440, width: "100%", background: "var(--wm-surface-pure, #fff)", borderRadius: 18, padding: 18, display: "grid", gap: 12, border: "1px solid var(--wm-accent-gold, #D4AF37)" }}>
        <h2 id="wm-terms-title" style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
          {pending.context === "signup" ? "Avant de créer votre espace" : "Avant de payer"}
        </h2>
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.5 }}>
          <input ref={boxRef} type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }} />
          <span>
            {"J'ai lu et j'accepte les "}
            <a href="/cgv" target="_blank" rel="noopener noreferrer" style={link}>{"conditions générales de vente"}</a>
            {", les "}
            <a href="/cgu" target="_blank" rel="noopener noreferrer" style={link}>{"conditions générales d'utilisation"}</a>
            {" et la "}
            <a href="/confidentialite" target="_blank" rel="noopener noreferrer" style={link}>{"politique de confidentialité"}</a>
            {"."}
          </span>
        </label>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" onClick={() => setPending(null)} style={btn(false)}>{"Annuler"}</button>
          <button type="button" onClick={confirm} disabled={!checked} style={btn(true, !checked)}>{"Continuer"}</button>
        </div>
      </div>
    </div>
  );
}