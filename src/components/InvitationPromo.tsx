"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function InvitationPromo() {
  const pathname = usePathname();
  const show = !!pathname && pathname.startsWith("/invitation/");
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!show) return;
    try { setHidden(sessionStorage.getItem("wm_promo_off") === "1"); } catch { setHidden(false); }
  }, [show]);

  if (!show || hidden) return null;

  return (
    <div
      style={{
        position: "fixed", left: 12, right: 12, bottom: "calc(12px + env(safe-area-inset-bottom, 0px))", zIndex: 40,
        maxWidth: 520, margin: "0 auto", display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 16, background: "var(--wm-surface-pure, #fff)",
        border: "1px solid var(--wm-accent-gold, #D4AF37)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      <span style={{ flex: 1, fontSize: 13, lineHeight: 1.35 }}>
        {"Vous pr\u00e9parez votre mariage ? Cr\u00e9ez votre faire-part num\u00e9rique avec Wedding Mood."}
      </span>
      <a
        href="/?utm_source=invitation"
        data-track="click_invitation_promo"
        style={{ padding: "9px 12px", borderRadius: 12, background: "var(--wm-primary, #C05638)", color: "#fff", fontWeight: 800, fontSize: 12, whiteSpace: "nowrap", textDecoration: "none" }}
      >
        {"Essayer gratuitement"}
      </a>
      <button
        type="button"
        aria-label="Fermer"
        onClick={() => { try { sessionStorage.setItem("wm_promo_off", "1"); } catch {} setHidden(true); }}
        style={{ border: 0, background: "transparent", fontSize: 18, lineHeight: 1, cursor: "pointer", color: "var(--wm-text-faint, #78716c)" }}
      >
        {"\u00d7"}
      </button>
    </div>
  );
}