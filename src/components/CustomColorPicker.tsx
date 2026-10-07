"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeContext";
import { COLOR_THEMES } from "@/lib/constants";
import { buildCustomTheme, isValidHex, normalizeHex } from "@/lib/custom-theme";

const QUICK = ["#C05638", "#9F1239", "#7C2D12", "#B45309", "#15803D", "#0F766E", "#1D4ED8", "#6D28D9", "#BE185D", "#0F172A"];

export default function CustomColorPicker() {
  const { preferences } = useTheme();
  const [saved, setSaved] = useState<string | null>(null);
  const [color, setColor] = useState("#C05638");
  const [hex, setHex] = useState("#C05638");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/theme-color", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.success && typeof d.color === "string") {
          setSaved(d.color);
          setColor(d.color);
          setHex(d.color);
        }
      })
      .catch(() => {});
  }, []);

  const base = COLOR_THEMES.find((t) => t.id === preferences.themeId) || COLOR_THEMES[0];
  const preview = buildCustomTheme(color, base);
  const adjusted = preview.primary.toUpperCase() !== normalizeHex(color);

  const pick = (value: string) => {
    const n = normalizeHex(value);
    setColor(n);
    setHex(n);
  };

  const onHexChange = (value: string) => {
    setHex(value);
    const n = normalizeHex(value);
    if (isValidHex(n)) setColor(n);
  };

  const save = async (value: string | null) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/theme-color", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color: value, baseThemeId: preferences.themeId }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d && d.success) {
        setSaved(value);
        window.dispatchEvent(new Event("wm-custom-color"));
        setMsg(value ? "Couleur appliqu\u00e9e \u2714" : "Th\u00e8me d'origine r\u00e9tabli \u2714");
      } else {
        setMsg((d && d.message) || "Enregistrement impossible.");
      }
    } catch {
      setMsg("Connexion indisponible.");
    } finally {
      setBusy(false);
    }
  };

  const box = { padding: 16, border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff", display: "grid", gap: 12 } as const;
  const btn = (bg: string) => ({ padding: "10px 14px", borderRadius: 12, border: 0, color: "#fff", background: bg, fontWeight: 700, fontSize: 13, cursor: "pointer" }) as const;

  return (
    <div style={box}>
      <div>
        <strong style={{ fontSize: 16 }}>{"Ma couleur personnalis\u00e9e"}</strong>
        <p style={{ fontSize: 12, color: "#57534e", marginTop: 4 }}>
          {"En plus des 20 th\u00e8mes, cr\u00e9ez votre propre couleur avec la palette ou un code (exemple : #C05638)."}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="color"
          value={color}
          onChange={(e) => pick(e.target.value)}
          aria-label="Palette de couleurs"
          style={{ width: 64, height: 44, padding: 0, border: "1px solid #d6d3d1", borderRadius: 10, background: "#fff", cursor: "pointer" }}
        />
        <input
          value={hex}
          onChange={(e) => onHexChange(e.target.value)}
          maxLength={7}
          aria-label="Code couleur"
          style={{ width: 120, padding: "9px 11px", border: "1px solid #d6d3d1", borderRadius: 10, fontFamily: "monospace", fontSize: 14 }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {QUICK.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => pick(c)}
            aria-label={"Choisir " + c}
            style={{ width: 30, height: 30, borderRadius: 999, background: c, border: c === color ? "3px solid #1c1917" : "2px solid #fff", boxShadow: "0 0 0 1px #d6d3d1", cursor: "pointer" }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: 12, borderRadius: 12, background: preview.badgeBg }}>
        <span style={{ padding: "8px 14px", borderRadius: 10, background: preview.primary, color: "#fff", fontWeight: 700, fontSize: 13 }}>
          {"Aper\u00e7u du bouton"}
        </span>
        <span style={{ padding: "4px 10px", borderRadius: 999, background: preview.badgeBg, color: preview.badgeText, border: "1px solid " + preview.primary, fontSize: 12, fontWeight: 700 }}>
          {"Badge"}
        </span>
      </div>
      {adjusted && (
        <p style={{ fontSize: 12, color: "#78716c" }}>
          {"Cette couleur est l\u00e9g\u00e8rement assombrie pour que le texte blanc reste lisible."}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" disabled={busy || !isValidHex(color)} onClick={() => save(color)} style={btn(preview.primary)}>
          {"Appliquer cette couleur"}
        </button>
        {saved && (
          <button type="button" disabled={busy} onClick={() => save(null)} style={btn("#6b7280")}>
            {"Revenir au th\u00e8me d'origine"}
          </button>
        )}
      </div>
      {msg && <p style={{ fontSize: 13 }}>{msg}</p>}
    </div>
  );
}