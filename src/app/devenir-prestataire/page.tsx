"use client";

import React, { useRef, useState } from "react";
import { fileToCompressedDataUrl } from "@/lib/image-upload";
import { PROVIDER_SERVICES, PROVIDER_CITIES } from "@/lib/provider-constants";
import { Camera, CheckCircle2, Store } from "lucide-react";

export default function DevenirPrestatairePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    service: PROVIDER_SERVICES[0].id,
    city: PROVIDER_CITIES[0],
    whatsapp: "",
    email: "",
    priceFrom: "",
    description: "",
  });

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 6 - photos.length);
    if (files.length === 0) return;
    try {
      const dataUrls = await Promise.all(
        files.map((f) => fileToCompressedDataUrl(f, { maxSize: 1000, quality: 0.75 }))
      );
      setPhotos((prev) => [...prev, ...dataUrls].slice(0, 6));
    } catch {
      setError("Impossible de lire une des images.");
    } finally {
      e.target.value = "";
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.businessName || !form.contactName || !form.whatsapp) {
      setError("Le nom de l'entreprise, le contact et le WhatsApp sont obligatoires.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, priceFrom: Number(form.priceFrom) || 0, photos }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setError(data.message || "Une erreur est survenue.");
      }
    } catch {
      setError("Connexion perdue. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 shadow-xl p-8 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
          <h1 className="font-serif text-xl font-bold text-stone-900">Inscription envoyée !</h1>
          <p className="text-sm text-stone-600">
            Merci. Votre profil sera visible dans notre marketplace dès qu'il aura été vérifié par
            notre équipe. Cela prend généralement moins de 48 heures.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#D4AF37] text-white flex items-center justify-center mx-auto shadow-md">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Devenez prestataire partenaire</h1>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Inscription gratuite. Les futurs mariés vous trouveront directement depuis notre
            marketplace, par ville et par service.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Nom de l'entreprise *</label>
              <input
                required
                value={form.businessName}
                onChange={set("businessName")}
                placeholder="Ex: Chez Awa Traiteur"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Nom du contact *</label>
              <input
                required
                value={form.contactName}
                onChange={set("contactName")}
                placeholder="Votre nom"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Service *</label>
              <select
                value={form.service}
                onChange={set("service")}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-400"
              >
                {PROVIDER_SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Ville *</label>
              <select
                value={form.city}
                onChange={set("city")}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-400"
              >
                {PROVIDER_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">WhatsApp *</label>
              <input
                required
                value={form.whatsapp}
                onChange={set("whatsapp")}
                placeholder="+225 07 00 00 00 00"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Email (optionnel)</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="contact@entreprise.com"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Prix à partir de (FCFA, optionnel)</label>
            <input
              type="number"
              min="0"
              value={form.priceFrom}
              onChange={set("priceFrom")}
              placeholder="Ex: 150000"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Description courte</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={3}
              placeholder="Présentez votre activité en quelques phrases..."
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-2">Photos de vos réalisations (jusqu'à 6)</label>
            <input type="file" ref={fileRef} accept="image/*" multiple onChange={handlePhotos} className="hidden" />
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200">
                  <img src={p} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-0 right-0 bg-black/60 text-white text-[10px] w-4 h-4 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 hover:border-amber-400 hover:text-amber-600"
                >
                  <Camera className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-[#D4AF37] hover:bg-[#B8942E] text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {saving ? "Envoi..." : "Envoyer mon inscription"}
          </button>
        </form>
      </div>
    </div>
  );
}