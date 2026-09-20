"use client";

import { useState, useTransition } from "react";
import { updateCoupleProfile } from "@/app/actions/profile";
import { fileToCompressedDataUrl } from "@/lib/image-upload";

interface ProfileFormProps {
  initialData: {
    id: string;
    partner1Name?: string | null;
    partner2Name?: string | null;
    weddingDate?: string | null;
    partner1Photo?: string | null;
    partner2Photo?: string | null;
  };
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    partner1Name: initialData.partner1Name || "",
    partner2Name: initialData.partner2Name || "",
    weddingDate: initialData.weddingDate ? initialData.weddingDate.split("T")[0] : "",
    partner1Photo: initialData.partner1Photo || "",
    partner2Photo: initialData.partner2Photo || "",
  });

  const handlePhotoChange =
    (field: "partner1Photo" | "partner2Photo") =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await fileToCompressedDataUrl(file, { maxSize: 512, quality: 0.8 });
        setFormData((prev) => ({ ...prev, [field]: dataUrl }));
      } catch {
        setMessage({ type: "error", text: "Impossible de lire cette image." });
      } finally {
        e.target.value = "";
      }
    };

  const photoPicker = (label: string, field: "partner1Photo" | "partner2Photo") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        {formData[field] ? (
          <img src={formData[field]} alt={label} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200" />
        )}
        <label className="px-3 py-2 rounded-md border border-dashed border-purple-400 text-purple-700 text-sm cursor-pointer hover:bg-purple-50">
          Choisir dans la galerie
          <input type="file" accept="image/*" onChange={handlePhotoChange(field)} className="hidden" />
        </label>
      </div>
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await updateCoupleProfile(initialData.id, formData);
      if (result.success) {
        setMessage({ type: "success", text: "Profil mis à jour avec succès !" });
      } else {
        setMessage({ type: "error", text: result.error || "Erreur lors de la mise à jour." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Profil du Couple</h2>

      {message && (
        <div className={`p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Partenaire 1</label>
        <input
          type="text"
          value={formData.partner1Name}
          onChange={(e) => setFormData({ ...formData, partner1Name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Nom / Prénom"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Partenaire 2</label>
        <input
          type="text"
          value={formData.partner2Name}
          onChange={(e) => setFormData({ ...formData, partner2Name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Nom / Prénom"
        />
      </div>

      {photoPicker("Photo du partenaire 1", "partner1Photo")}
      {photoPicker("Photo du partenaire 2", "partner2Photo")}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date du Mariage</label>
        <input
          type="date"
          value={formData.weddingDate}
          onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition duration-150 disabled:opacity-50"
      >
        {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
    </form>
  );
}

