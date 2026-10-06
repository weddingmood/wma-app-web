"use client";

import { useEffect, useMemo, useState } from "react";
import PremiumLock from "@/components/PremiumLock";

type Provider = {
  id: number;
  businessName: string;
  contactName: string;
  service: string;
  city: string | null;
  whatsapp: string;
  priceFrom: number | null;
  description: string | null;
  photos: string[] | null;
};

const SERVICES: Record<string, string> = {
  traiteur: "Traiteur",
  decorateur: "D\u00e9corateur",
  photographe: "Photographe",
  videaste: "Vid\u00e9aste",
  dj_sono: "DJ & Sono",
  salle: "Salle",
  makeup_coiffure: "Maquillage & Coiffure",
  robe_tenues: "Robes & Tenues",
  patisserie: "P\u00e2tisserie",
  fleuriste: "Fleuriste",
  transport: "Transport",
  animation_mc: "Animation & MC",
  autre: "Autre",
};

export default function PrestatairesPage() {
  const [list, setList] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState("all");
  const [q, setQ] = useState("");
  const [traiteursLocked, setTraiteursLocked] = useState(false);

  useEffect(() => {
    fetch("/api/providers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setList(Array.isArray(d.providers) ? (d.providers as Provider[]) : []);
        setTraiteursLocked(Boolean(d.traiteursLocked));
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list.filter((p) => {
      if (service !== "all" && p.service !== service) return false;
      if (!needle) return true;
      return (p.businessName + " " + (p.city || "") + " " + (p.description || "")).toLowerCase().includes(needle);
    });
  }, [list, service, q]);

  const usedServices = Array.from(new Set(list.map((p) => p.service)));
  const input = { padding: "8px 10px", border: "1px solid #d6d3d1", borderRadius: 10, fontSize: 14, background: "#fff" } as const;

  return (
    <div style={{ display: "grid", gap: 16, paddingBottom: 64 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>{"Prestataires du mariage"}</h1>
      <p style={{ fontSize: 13, color: "#57534e" }}>
        {"Traiteurs, d\u00e9corateurs, photographes\u2026 s\u00e9lectionn\u00e9s et valid\u00e9s par notre \u00e9quipe. Contactez-les directement sur WhatsApp."}
      </p>

      <div style={{ padding: 14, border: "1px dashed #C05638", borderRadius: 16, background: "#fff7ed", display: "grid", gap: 6 }}>
        <strong>{"Vous \u00eates prestataire ?"}</strong>
        <span style={{ fontSize: 13, color: "#57534e" }}>
          {"Inscrivez-vous gratuitement : votre fiche sera visible par tous les couples apr\u00e8s validation par notre \u00e9quipe."}
        </span>
        <a
          href="/devenir-prestataire"
          style={{ marginTop: 4, padding: "9px 12px", borderRadius: 12, background: "#C05638", color: "#fff", textAlign: "center", fontWeight: 700, fontSize: 13 }}
        >
          {"S'inscrire gratuitement"}
        </a>
      </div>
      {traiteursLocked && <PremiumLock feature="le service traiteurs" compact />}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select style={input} value={service} onChange={(e) => setService(e.target.value)}>
          <option value="all">{"Tous les m\u00e9tiers"}</option>
          {usedServices.map((s) => (
            <option key={s} value={s}>{SERVICES[s] ?? s}</option>
          ))}
        </select>
        <input style={{ ...input, flex: 1, minWidth: 160 }} placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading && <p>{"Chargement..."}</p>}
      {!loading && shown.length === 0 && (
        <p style={{ fontSize: 14, color: "#57534e" }}>{"Aucun prestataire disponible pour le moment. Revenez bient\u00f4t !"}</p>
      )}

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {shown.map((p) => {
          const photo = p.photos && p.photos.length > 0 ? p.photos[0] : null;
          const phone = (p.whatsapp || "").replace(/\D/g, "");
          return (
            <div key={p.id} style={{ border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff", overflow: "hidden", display: "grid" }}>
              {photo && <img src={photo} alt="" style={{ width: "100%", height: 150, objectFit: "cover" }} />}
              <div style={{ padding: 14, display: "grid", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#C05638", textTransform: "uppercase" }}>{SERVICES[p.service] ?? p.service}</span>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>{p.businessName}</h3>
                <p style={{ fontSize: 12, color: "#78716c" }}>{(p.city || "Abidjan") + " \u2022 " + p.contactName}</p>
                {p.description && <p style={{ fontSize: 13, color: "#44403c" }}>{p.description}</p>}
                {p.priceFrom ? (
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{"\u00c0 partir de " + p.priceFrom.toLocaleString("fr-FR") + " FCFA"}</p>
                ) : null}
                {phone && (
                  <a
                    href={"https://wa.me/" + phone}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginTop: 6, padding: "9px 12px", borderRadius: 12, background: "#16a34a", color: "#fff", textAlign: "center", fontWeight: 700, fontSize: 13 }}
                  >
                    {"Contacter sur WhatsApp"}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}