"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";


const BASE = "https://wedding.bouakestore.com";

export default function AmbassadorCard({
  name, city, countryName, flag, photoUrl, slug,
}: {
  name: string; city?: string; countryName?: string; flag?: string; photoUrl?: string; slug: string;
}) {
  const [copied, setCopied] = useState(false);
  const link = BASE + "/r/" + slug;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const place = [city, countryName].filter(Boolean).join(", ");
  const wa = "https://wa.me/?text=" + encodeURIComponent("Rejoignez Wedding Mood avec " + name + ", ambassadeur officiel : " + link);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez ce lien :", link);
    }
  };

  const btn = { padding: "10px 14px", borderRadius: 12, fontWeight: 800, fontSize: 13, border: 0, cursor: "pointer", textDecoration: "none", textAlign: "center" } as const;

  return (
    <div style={{ border: "2px solid var(--wm-accent-gold, #D4AF37)", borderRadius: 20, background: "var(--wm-surface-pure, #fff)", padding: 18, display: "grid", gap: 12, textAlign: "center", justifyItems: "center" }}>
      <Logo size={30} showText={true} variant="dark" />
      <span style={{ padding: "4px 12px", borderRadius: 999, background: "var(--wm-accent-gold, #D4AF37)", color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>
        {"AMBASSADEUR OFFICIEL"}
      </span>
      {photoUrl ? (
        <img src={photoUrl} alt={name} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--wm-accent-gold, #D4AF37)" }} />
      ) : (
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--wm-primary, #C05638)", color: "#fff", display: "grid", placeItems: "center", fontSize: 32, fontWeight: 800 }}>{initials}</div>
      )}
      <div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{name}</div>
        {place && <div style={{ fontSize: 13, color: "var(--wm-text-faint, #78716c)" }}>{(flag ? flag + " " : "") + place}</div>}
      </div>
      {slug ? (
        <>
          <div style={{ fontSize: 13, wordBreak: "break-all", padding: "8px 12px", borderRadius: 10, background: "var(--wm-surface-ivory, #FCFAF7)", border: "1px solid var(--wm-line, #e7e5e4)" }}>
            {link.replace("https://", "")}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <button type="button" onClick={copy} style={{ ...btn, background: "var(--wm-primary, #C05638)", color: "#fff" }}>
              {copied ? "Lien copi\u00e9 \u2714" : "Copier le lien"}
            </button>
            <a href={wa} target="_blank" rel="noopener noreferrer" style={{ ...btn, background: "#16a34a", color: "#fff" }}>
              {"Partager sur WhatsApp"}
            </a>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, color: "var(--wm-text-faint, #78716c)" }}>{"Votre lien est en cours de cr\u00e9ation."}</div>
      )}
    </div>
  );
}