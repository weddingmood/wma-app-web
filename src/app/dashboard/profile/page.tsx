"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/ThemeContext";
import { fileToCompressedDataUrl } from "@/lib/image-upload";
import { Camera, Save, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { couple, updateCoupleProfile } = useTheme();
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const photo1Ref = useRef<HTMLInputElement>(null);
  const photo2Ref = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.couple?.accessCode) setAccessCode(data.couple.accessCode);
      })
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    partner1Name: couple?.partner1Name || "",
    partner2Name: couple?.partner2Name || "",
    weddingDate: couple?.weddingDate ? couple.weddingDate.slice(0, 10) : "",
    city: couple?.city || "",
    venue: couple?.venue || "",
    bibleVerse: couple?.bibleVerse || "",
    partner1Photo: couple?.partner1Photo || "",
    partner2Photo: couple?.partner2Photo || "",
  });

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handlePhoto =
    (field: "partner1Photo" | "partner2Photo") =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await fileToCompressedDataUrl(file, { maxSize: 600, quality: 0.8 });
        setForm((prev) => ({ ...prev, [field]: dataUrl }));
      } catch {
        setMessage({ type: "error", text: "Impossible de lire cette image." });
      } finally {
        e.target.value = "";
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateCoupleProfile(form);
      setMessage({ type: "success", text: "Profil mis à jour avec succès !" });
    } catch {
      setMessage({ type: "error", text: "Connexion perdue. Réessayez." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Mon profil</h1>
        <p className="text-xs text-stone-500">
          Ces informations apparaissent sur votre tableau de bord, votre chronogramme et
          votre carte d'invitation.
        </p>
      </div>

      {accessCode && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-stone-700">
          Votre code d'accès : <strong className="text-stone-900">{accessCode}</strong>{" "}
          — gardez-le précieusement, il sert à vous reconnecter.
        </div>
      )}

      {message && (
        <div
          className={
            "p-3 rounded-xl text-xs font-semibold flex items-center gap-2 " +
            (message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200")
          }
        >
          {message.type === "success" && <CheckCircle2 className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
            Le couple
          </p>

          <div className="grid grid-cols-2 gap-4">
            {(
              [
                { label: "Partenaire 1", nameField: "partner1Name", photoField: "partner1Photo", ref: photo1Ref },
                { label: "Partenaire 2", nameField: "partner2Name", photoField: "partner2Photo", ref: photo2Ref },
              ] as const
            ).map((p) => (
              <div key={p.nameField} className="space-y-2">
                <input
                  type="file"
                  ref={p.ref}
                  accept="image/*"
                  onChange={handlePhoto(p.photoField)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => p.ref.current?.click()}
                  className="relative w-20 h-20 mx-auto block rounded-full overflow-hidden bg-stone-100 border border-stone-200"
                >
                  {form[p.photoField] ? (
                    <img src={form[p.photoField]} alt={p.label} className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-stone-300 text-xs">
                      Photo
                    </span>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] py-0.5 flex items-center justify-center gap-1">
                    <Camera className="w-2.5 h-2.5" /> Modifier
                  </span>
                </button>
                <label className="block text-[10px] font-semibold text-stone-500 text-center uppercase">
                  {p.label}
                </label>
                <input
                  value={form[p.nameField]}
                  onChange={set(p.nameField)}
                  placeholder="Prénom"
                  className="w-full text-center text-sm font-semibold border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-400"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
            Le mariage
          </p>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Date du mariage
            </label>
            <input
              type="date"
              value={form.weddingDate}
              onChange={set("weddingDate")}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Ville</label>
              <input
                value={form.city}
                onChange={set("city")}
                placeholder="Abidjan"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Lieu</label>
              <input
                value={form.venue}
                onChange={set("venue")}
                placeholder="Nom du lieu"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Verset ou pensée du couple
            </label>
            <textarea
              value={form.bibleVerse}
              onChange={set("bibleVerse")}
              rows={2}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Enregistrement..." : "Enregistrer mon profil"}
        </button>
      </form>
    </div>
  );
}