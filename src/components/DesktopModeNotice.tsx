"use client";

import { useEffect, useState } from "react";

export default function DesktopModeNotice() {
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("wm_desktop_notice_closed")) return;
    } catch {
      // stockage indisponible
    }
    const touch = navigator.maxTouchPoints > 0;
    const wide = window.innerWidth > 800 && window.screen.width < 700;
    if (touch && wide) setScale(window.innerWidth / window.screen.width);
  }, []);

  if (scale === null) return null;

  const close = () => {
    try {
      sessionStorage.setItem("wm_desktop_notice_closed", "1");
    } catch {
      // stockage indisponible
    }
    setScale(null);
  };

  return (
    <div
      role="status"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999, background: "#FEF3C7", color: "#78350F",
        padding: 10 * scale, fontSize: 14 * scale, lineHeight: 1.4, display: "flex", gap: 10 * scale,
        alignItems: "center", justifyContent: "space-between",
      }}
    >
      <span>
        {"Votre navigateur affiche la version ordinateur du site. Pour un affichage adapt\u00e9 au t\u00e9l\u00e9phone, d\u00e9sactivez \u00ab Version pour ordinateur \u00bb dans le menu \u22EE du navigateur."}
      </span>
      <button
        type="button"
        onClick={close}
        style={{ border: 0, background: "#78350F", color: "#fff", borderRadius: 6 * scale, padding: 6 * scale + "px " + 10 * scale + "px", fontSize: 14 * scale }}
      >
        {"OK"}
      </button>
    </div>
  );
}