"use client";

import { useEffect, useState } from "react";
import PaymentLogos from "@/components/PaymentLogos";

type Partner = {
  id?: string | number;
  name?: string;
  logo_url?: string | null;
  logo?: string | null;
  website?: string | null;
  website_url?: string | null;
  type?: string | null;
};

export default function SiteFooter({ logo, fallbackWhatsapp }: { logo: React.ReactNode; fallbackWhatsapp: string }) {
  const [w, setW] = useState<Record<string, string>>({});
  const [s, setS] = useState<any>({});
  const [partners, setPartners] = useState<Partner[]>([]);
  const [about, setAbout] = useState("");

  useEffect(() => {
    fetch("/api/public-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d && d.success) setW(d.values || {}); })
      .catch(() => {});
    fetch("/api/site-contents", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setS((d && d.settings) || {});
        setPartners(Array.isArray(d && d.partenaires) ? d.partenaires : []);
        const list = Array.isArray(d && d.contents) ? d.contents : [];
        const a = list.find((x: any) => x && x.key === "footer_about");
        const av = a && a.value && typeof a.value === "object" ? a.value : null;
        setAbout(av && av.is_active !== false && av.content ? String(av.content) : "");
      })
      .catch(() => {});
  }, []);

  const year = new Date().getFullYear();
  const signature = (w.footer_signature || s.footer_signature || "\u00a9{YEAR} Wedding Mood C\u00f4te d'Ivoire. Tous droits r\u00e9serv\u00e9s.").replace(/\{YEAR\}/g, String(year));
  const wa = (w.whatsapp || "").replace(/\D/g, "");
  const waHref = wa ? "https://wa.me/" + wa : fallbackWhatsapp;
  const waLabel = w.whatsapp || "+225 70 50 13 56";
  const rccm = w.rccm || s.rccm || "";
  const legal = [
    w.company_name || "",
    w.dfe ? "DFE : " + w.dfe : "",
    rccm ? "RCCM : " + rccm : "",
    s.ncc ? "NCC : " + s.ncc : "",
  ].filter(Boolean).join(" \u2022 ");
  const logos = partners.filter((p) => (p.logo_url || p.logo) && (!p.type || p.type === "logo"));
  const link = "text-[var(--wm-primary)] font-bold hover:underline";

  return (
    <footer className="bg-white text-stone-700 py-12 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {logos.length > 0 && (
          <div className="text-center space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{"Nos partenaires"}</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {logos.map((p, i) => {
                const src = String(p.logo_url || p.logo);
                const href = p.website || p.website_url;
                const img = <img src={src} alt={p.name || "Partenaire"} title={p.name || ""} className="h-12 w-auto object-contain" />;
                return href ? (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer">{img}</a>
                ) : (
                  <span key={i}>{img}</span>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center">{logo}</div>
          <div className="text-xs text-stone-500 text-center sm:text-right space-y-1">
            <p>{"Support WhatsApp Officiel : "}<a href={waHref} target="_blank" rel="noopener noreferrer" className={link}>{waLabel}</a></p>
            {w.phone && <p>{"T\u00e9l\u00e9phone : " + w.phone}</p>}
            {w.email_contact && <p>{"E-mail : "}<a href={"mailto:" + w.email_contact} className={link}>{w.email_contact}</a></p>}
            {w.email_support && <p>{"Support : "}<a href={"mailto:" + w.email_support} className={link}>{w.email_support}</a></p>}
            {w.address && <p>{w.address}</p>}
          </div>
        </div>

        {about && <p className="text-xs text-stone-600 text-center max-w-2xl mx-auto" style={{ whiteSpace: "pre-wrap" }}>{about}</p>}

        <PaymentLogos />

        <div className="border-t border-stone-100 pt-5 text-center text-[11px] text-stone-500 space-y-2">
          {legal && <p>{legal}</p>}
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a href="/faq" className="hover:underline">{"FAQ"}</a>
            <a href="/conditions" className="hover:underline">{"Conditions d'utilisation"}</a>
            <a href="/confidentialite" className="hover:underline">{"Confidentialit\u00e9"}</a>
            <a href="/mentions-legales" className="hover:underline">{"Mentions l\u00e9gales"}</a>
          </p>
          <p style={{ whiteSpace: "pre-wrap" }}>{signature}</p>
        </div>
      </div>
    </footer>
  );
}