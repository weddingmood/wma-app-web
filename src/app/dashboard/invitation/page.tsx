"use client";

import React, { useState, useRef } from "react";
import { useTheme } from "@/components/ThemeContext";
import { Upload, Sparkles, Check, Image as ImageIcon } from "lucide-react";

export default function InvitationDashboardPage() {
  const { couple, updateCoupleProfile } = useTheme();
  
  // État local pour l'image d'invitation/fond
  const [invitationImage, setInvitationImage] = useState(couple?.coverPhoto || "");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload local par FileReader (Zéro URL, Zéro Saisie texte)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setInvitationImage(compressedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCoupleProfile({ coverPhoto: invitationImage });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 text-xs">
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-serif font-bold text-stone-900">Visuel de la Carte d'Invitation</h1>
            <p className="text-stone-500 text-[11px]">Personnalisez l'image principale de votre faire-part numérique.</p>
          </div>
          <Sparkles className="w-5 h-5 text-amber-600" />
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-600" /> Visuel mis à jour avec succès !
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Zone de preview et d'upload direct */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer group rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#C05638] overflow-hidden bg-stone-50 p-4 flex flex-col items-center justify-center transition min-h-[220px]"
          >
            {invitationImage ? (
              <div className="relative w-full h-48">
                <img 
                  src={invitationImage} 
                  alt="Aperçu de l'invitation" 
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
                  <span className="text-white text-xs font-bold flex items-center gap-1.5">
                    <Upload className="w-4 h-4" /> Changer l'image depuis la galerie
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <ImageIcon className="w-10 h-10 text-stone-400 mx-auto" />
                <p className="text-xs font-bold text-stone-700">
                  Appuyez pour importer une image depuis votre appareil
                </p>
                <p className="text-[10px] text-stone-400">
                  Formats acceptés : JPG, PNG (Stockage interne / Galerie)
                </p>
              </div>
            )}

            {/* INPUT FILE RÉEL - AUCUN CHAMP URL TEXTE */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-[#C05638] text-white font-bold rounded-xl shadow-md hover:bg-[#A84429] transition cursor-pointer"
            >
              Enregistrer le visuel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}