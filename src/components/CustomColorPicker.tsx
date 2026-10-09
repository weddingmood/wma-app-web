"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeContext";
import { COLOR_THEMES } from "@/lib/constants";
import { buildCustomTheme, isValidHex, normalizeHex, onColor, readableText } from "@/lib/custom-theme";

const QUICK = ["#C05638", "#9F1239", "#7C2D12", "#B45309", "#15803D", "#0F766E", "#1D4ED8", "#6D28D9", "#BE185D", "#0F172A"];
const QUICK_TEXT = ["#1F2937", "#1C1917", "#111827", "#3F2A1D", "#1E3A2F", "#312E81", "#7F1D1D", "#0F172A"];

type FieldProps = {
  label: string;
  help: string;
  value: string | null;
  fallback: string;
  swatches: string[];
  onChange: (v: string | null) => void;
};

function Field({ label, help, value, fallback, swatches, onChange }: FieldProps) {
  const shown = value ?? fallback;
  const [hex, setHex] = useState(shown);
  useEffect(() => { setHex(shown); }, [shown]);

  const typed = (v: string) => {
    setHex(v);
    const n = normalizeHex(v);
    if (isValidHex(n)) onChange(n);
  };

  return (
    <div style={{ display: "grid", gap: 8, padding: 12, border: "1px solid #e7e5e4", borderRadius: 12 }}>
      <div>
        <strong style={{ fontSize: 14 }}>{label}</strong>
        <p style={{ fontSize: 12, color: "#57534e", marginTop: 2 }}>{help}</p>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="color"
          value={shown.toLowerCase()}
          onChange={(e) => onChange(normalizeHex(e.target.value))}
          aria-label={label}
          style={{ width: 56, height: 40, padding: 0, border: "1px solid #d6d3d1", borderRadius: 10, background: "#fff", cursor: "pointer" }}
        />
        <input
          value={hex}
          onChange={(e) => typed(e.target.value)}
          maxLength={7}
          aria-label={"Code " + label}
          style={{ width: 110, padding: "8px 10px", border: "1px solid #d6d3d1", borderRadius: 10, fontFamily: "monospace", fontSize: 14 }}
        />
        {value && (
          <button type="button" onClick={() => onChange(null)} style={{ fontSize: 12, background: "none", border: 0, color: "#57534e", textDecoration: "underline", cursor: "pointer" }}>
            {"Par d\u00e9faut"}
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {swatches.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={"Choisir " + c}
            style={{ width: 28, height: 28, borderRadius: 999, background: c, border: c === value ? "3px solid #1c1917" : "2px solid #fff", boxShadow: "0 0 0 1px #d6d3d1", cursor: "pointer" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CustomColorPicker() {
  const { preferences } = useTheme();
  const [main, setMain] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [button, setButton] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/theme-color", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.success) {
          setMain(typeof d.color === "string" ? d.color : null);
          setText(typeof d.textColor === "string" ? d.textColor : null);
          setButton(typeof d.buttonColor === "string" ? d.buttonColor : null);
        }
      })
      .catch(() => {});
  }, []);

  const base = COLOR_THEMES.find((t) => t.id === preferences.themeId) || COLOR_THEMES[0];
  const theme = main ? buildCustomTheme(main, base) : base;
  const btnBg = button ?? theme.primary;
  const txtColor = text ? readableText(text) : "#1F2937";
  const textAdjusted = Boolean(text) && txtColor !== normalizeHex(text as string);

  const save = async (reset: boolean) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/theme-color", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reset ? { reset: true } : { color: main, textColor: text, buttonColor: button, baseThemeId: preferences.themeId }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d && d.success) {
        if (reset) { setMain(null); setText(null); setButton(null); }
        window.dispatchEvent(new Event("wm-custom-color"));
        setMsg(reset ? "Th\u00e8me d'origine r\u00e9tabli \u2714" : "Couleurs appliqu\u00e9es \u2714");
      } else {
        setMsg((d && d.message) || "Enregistrement impossible.");
      }
    } catch {
      setMsg("Connexion indisponible.");
    } finally {
      setBusy(false);
    }
  };

  const btn = (bg: string) => ({ padding: "10px 14px", borderRadius: 12, border: 0, color: onColor(bg), background: bg, fontWeight: 700, fontSize: 13, cursor: "pointer" }) as const;

  return (
    <div style={{ padding: 16, border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff", display: "grid", gap: 12 }}>
      <div>
        <strong style={{ fontSize: 16 }}>{"Mes couleurs personnalis\u00e9es"}</strong>
        <p style={{ fontSize: 12, color: "#57534e", marginTop: 4 }}>
          {"Choisissez la couleur principale, celle des textes et celle des boutons, avec la palette ou un code (exemple : #C05638)."}
        </p>
      </div>

      <Field label="Couleur principale" help={"Titres, accents et ic\u00f4nes de l'application."} value={main} fallback={base.primary} swatches={QUICK} onChange={setMain} />
      <Field label="Couleur des textes" help={"Le texte reste lisible : il est assombri si le contraste est trop faible."} value={text} fallback="#1F2937" swatches={QUICK_TEXT} onChange={setText} />
      <Field label="Couleur des boutons" help={"Le texte du bouton passe automatiquement en blanc ou en noir."} value={button} fallback={theme.primary} swatches={QUICK} onChange={setButton} />

      <div style={{ display: "grid", gap: 10, padding: 12, borderRadius: 12, background: theme.badgeBg }}>
        <span style={{ color: txtColor, fontWeight: 700, fontSize: 15 }}>{"Aper\u00e7u du texte"}</span>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ padding: "8px 14px", borderRadius: 10, background: btnBg, color: onColor(btnBg), fontWeight: 700, fontSize: 13 }}>
            {"Aper\u00e7u du bouton"}
          </span>
          <span style={{ padding: "4px 10px", borderRadius: 999, background: theme.badgeBg, color: theme.badgeText, border: "1px solid " + theme.primary, fontSize: 12, fontWeight: 700 }}>
            {"Badge"}
          </span>
        </div>
      </div>
      {textAdjusted && (
        <p style={{ fontSize: 12, color: "#78716c" }}>{"La couleur du texte a \u00e9t\u00e9 l\u00e9g\u00e8rement assombrie pour rester lisible."}</p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" disabled={busy} onClick={() => save(false)} style={btn(btnBg)}>
          {"Appliquer mes couleurs"}
        </button>
        {(main || text || button) && (
          <button type="button" disabled={busy} onClick={() => save(true)} style={btn("#6b7280")}>
            {"Revenir au th\u00e8me d'origine"}
          </button>
        )}
      </div>
      {msg && <p style={{ fontSize: 13 }}>{msg}</p>}
    </div>
  );
}