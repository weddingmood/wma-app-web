"use client";

import React, { useState } from "react";
import { useTheme } from "@/components/ThemeContext";
import { COLOR_THEMES, FONTS_LIST } from "@/lib/constants";
import { Palette, Type, Layout, Sliders, CheckCircle2, Sparkles, User, Save, RefreshCw } from "lucide-react";

export default function PreferencesPage() {
  const { preferences, updatePreferences, activeTheme, couple } = useTheme();
  const [selectedThemeId, setSelectedThemeId] = useState(preferences.themeId);
  const [selectedFont, setSelectedFont] = useState(preferences.fontFamily);
  const [selectedDisplayMode, setSelectedDisplayMode] = useState(preferences.displayMode);
  const [selectedDensity, setSelectedDensity] = useState(preferences.density);
  const [selectedFontSize, setSelectedFontSize] = useState(preferences.fontSize);
  const [saved, setSaved] = useState(false);

  const handleSavePreferences = async () => {
    await updatePreferences({
      themeId: selectedThemeId,
      fontFamily: selectedFont,
      displayMode: selectedDisplayMode,
      density: selectedDensity,
      fontSize: selectedFontSize,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const displayModes = [
    { id: "standard", name: "Mode Standard", desc: "Expérience complète, claire et équilibrée pour tous les préparatifs." },
    { id: "simplified", name: "Mode Simplifié", desc: "Interface épurée focalisée sur l'essentiel, les tâches et la prière." },
    { id: "organization", name: "Mode Organisation", desc: "Vue dense orientée budget, rétroplanning, calendrier et logistique." },
    { id: "elegant", name: "Mode Élégant", desc: "Présentation raffinée avec mise en valeur de la photographie et de l'espace." },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100">
          <Palette className="w-3.5 h-3.5" />
          <span>Personnalisation & Design Premium</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Thèmes de Couleurs & Expérience Visuelle
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Personnalisez votre espace avec les 20 palettes royales inspirées de Côte d'Ivoire. Chaque changement s'applique immédiatement à l'ensemble des titres, boutons, liens et cartes de votre application.
        </p>
      </div>

      {/* 20 Color Themes Stage */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="font-serif font-bold text-stone-900 text-lg">
            1. Choisissez Votre Thème (20 Palettes Royales)
          </h3>
          <span className="text-xs font-bold text-[#C05638]">
            Thème sélectionné : {COLOR_THEMES.find((t) => t.id === selectedThemeId)?.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {COLOR_THEMES.map((theme) => {
            const isSelected = selectedThemeId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  setSelectedThemeId(theme.id);
                  updatePreferences({ themeId: theme.id });
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                  isSelected
                    ? "border-stone-900 ring-2 ring-stone-900 glass-card-warm shadow-md"
                    : "border-stone-200 hover:border-stone-300 bg-white/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Thème {theme.id}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>

                <div>
                  <div className="font-serif font-bold text-xs text-stone-900 leading-tight">
                    {theme.name}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">{theme.category}</div>
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: theme.primary }}
                  ></span>
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: theme.secondary }}
                  ></span>
                  <span
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: theme.accent }}
                  ></span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Typography Selection (Affecte réellement tout le site) */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-stone-900 text-lg border-b border-stone-100 pb-3">
          2. Typographie & Polices d'Écriture (Application Globale)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FONTS_LIST.map((f) => {
            const isSelected = selectedFont === f.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFont(f.id);
                  updatePreferences({ fontFamily: f.id });
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-stone-900 ring-2 ring-stone-900 glass-card-warm"
                    : "border-stone-200 hover:border-stone-300 bg-white/80"
                }`}
              >
                <div className="text-xs font-bold text-stone-900">{f.name}</div>
                <div className={`text-base font-serif text-stone-700 mt-2 ${f.fontClass}`}>
                  « La corde à trois fils ne se rompt pas »
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Display Modes & Density */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-stone-900 text-lg border-b border-stone-100 pb-3">
          3. Modes d'Affichage & Taille des Textes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {displayModes.map((dm) => {
            const isSelected = selectedDisplayMode === dm.id;
            return (
              <button
                key={dm.id}
                onClick={() => {
                  setSelectedDisplayMode(dm.id as any);
                  updatePreferences({ displayMode: dm.id as any });
                }}
                className={`p-4 rounded-2xl border text-left transition-all space-y-1 cursor-pointer ${
                  isSelected
                    ? "border-stone-900 ring-2 ring-stone-900 glass-card-warm"
                    : "border-stone-200 hover:border-stone-300 bg-white/80"
                }`}
              >
                <div className="text-xs font-bold text-stone-900">{dm.name}</div>
                <p className="text-[11px] text-stone-500 leading-relaxed">{dm.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Taille des caractères (Mise à l'échelle globale)
            </label>
            <div className="flex gap-2">
              {[
                { id: "sm", label: "Compacte" },
                { id: "md", label: "Standard" },
                { id: "lg", label: "Confortable" },
              ].map((sz) => (
                <button
                  key={sz.id}
                  onClick={() => {
                    setSelectedFontSize(sz.id as any);
                    updatePreferences({ fontSize: sz.id as any });
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedFontSize === sz.id
                      ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Densité de l'interface
            </label>
            <div className="flex gap-2">
              {[
                { id: "compact", label: "Dense" },
                { id: "normal", label: "Normale" },
                { id: "spacious", label: "Aérée" },
              ].map((den) => (
                <button
                  key={den.id}
                  onClick={() => {
                    setSelectedDensity(den.id as any);
                    updatePreferences({ density: den.id as any });
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedDensity === den.id
                      ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {den.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between p-4 glass-panel rounded-3xl border border-stone-200 shadow-sm">
        {saved ? (
          <span className="text-emerald-700 font-bold text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Préférences appliquées avec succès sur l'ensemble de vos écrans.
          </span>
        ) : (
          <span className="text-xs text-stone-500">
            Les réglages s'enregistrent en direct et sont partagés avec votre conjoint.
          </span>
        )}

        <button
          onClick={handleSavePreferences}
          className="px-6 py-3 rounded-2xl bg-[#C05638] text-white font-bold text-xs shadow-md hover:bg-[#A84429] transition-all flex items-center gap-2 cursor-pointer"
          style={{ backgroundColor: activeTheme.primary }}
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer les Préférences</span>
        </button>
      </div>

    </div>
  );
}
