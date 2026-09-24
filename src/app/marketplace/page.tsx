"use client";

import React, { useEffect, useState } from "react";
import { PROVIDER_SERVICES, PROVIDER_CITIES } from "@/lib/provider-constants";
import { MapPin, MessageCircle, Search, Store } from "lucide-react";

interface Provider {
  id: number;
  businessName: string;
  service: string;
  city: string;
  whatsapp: string;
  priceFrom: number;
  description: string;
  photos: string[];
}

function serviceLabel(id: string) {
  return PROVIDER_SERVICES.find((s) => s.id === id)?.label || id;
}

function waveLinkWhatsapp(numero: string, entreprise: string) {
  const digits = numero.replace(/[^\d+]/g, "");
  const texte = encodeURIComponent(
    "Bonjour, j'ai trouvÃ© votre profil " + entreprise + " sur Wedding Mood, je suis intÃ©ressÃ©(e) par vos services."
  );
  return "https://wa.me/" + digits.replace(/^\+/, "") + "?text=" + texte;
}

export default function MarketplacePage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [service, setService] = useState("all");
  const [city, setCity] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const res = await fetch("/api/providers");
        const data = await res.json();
        if (!annule) {
          if (data.success) setProviders(data.providers || []);
          else setError(data.message || "Impossible de charger la marketplace.");
        }
      } catch {
        if (!annule) setError("Connexion perdue. Rechargez la page.");
      } finally {
        if (!annule) setLoading(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, []);

  const filtres = providers.filter((p) => {
    if (service !== "all" && p.service !== service) return false;
    if (city !== "all" && p.city !== city) return false;
    if (search.trim()) {
      const terme = search.trim().toLowerCase();
      if (!p.businessName.toLowerCase().includes(terme) && !(p.description || "").toLowerCase().includes(terme)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#D4AF37] text-white flex items-center justify-center mx-auto shadow-md">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Nos prestataires partenaires
          </h1>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Traiteurs, dÃ©corateurs, photographes... trouvez le prestataire qu'il vous faut pour
            votre mariage, et contactez-le directement sur WhatsApp.
          </p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un nom..."
              className="w-full border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">Tous les services</option>
            {PROVIDER_SERVICES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">Toutes les villes</option>
            {PROVIDER_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center text-sm text-stone-400 py-16 animate-pulse">
            Chargement des prestataires...
          </p>
        ) : filtres.length === 0 ? (
          <p className="text-center text-sm text-stone-500 py-16">
            Aucun prestataire ne correspond Ã  votre recherche pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtres.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="h-40 bg-stone-100 relative">
                  {p.photos && p.photos.length > 0 ? (
                    <img src={p.photos[0]} alt={p.businessName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <Store className="w-10 h-10" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-white text-[10px] font-bold">
                    {serviceLabel(p.service)}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h3 className="font-serif font-bold text-stone-900 text-base leading-tight">
                    {p.businessName}
                  </h3>
                  <p className="text-[11px] text-stone-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {p.city}
                  </p>
                  {p.description && (
                    <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">{p.description}</p>
                  )}
                  {p.priceFrom > 0 && (
                    <p className="text-xs font-bold text-amber-700">
                      Ã€ partir de {p.priceFrom.toLocaleString("fr-FR")} FCFA
                    </p>
                  )}
                  <a
                    href={waveLinkWhatsapp(p.whatsapp, p.businessName)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Contacter sur WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
