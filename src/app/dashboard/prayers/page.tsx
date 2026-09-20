"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  BookMarked,
  Plus,
  Heart,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react";

export default function PrayersPage() {
  const { couple, activePartner, partnerName, activeTheme } = useTheme();
  const [prayers, setPrayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    prayerText: "",
    category: "couple",
    prayerDate: new Date().toISOString().split("T")[0],
  });

  const [testimonyModal, setTestimonyModal] = useState<{ id: number; text: string } | null>(null);

  const fetchPrayers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/prayers");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPrayers(data.prayers || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.prayerText) return;

    try {
      const res = await fetch("/api/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({
          title: "",
          prayerText: "",
          category: "couple",
          prayerDate: new Date().toISOString().split("T")[0],
        });
        fetchPrayers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePrayed = async (id: number) => {
    try {
      await fetch("/api/prayers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "toggle-partner-pray" }),
      });
      fetchPrayers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTestimony = async () => {
    if (!testimonyModal) return;
    try {
      await fetch("/api/prayers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: testimonyModal.id,
          isAnswered: true,
          testimony: testimonyModal.text,
        }),
      });
      setTestimonyModal(null);
      fetchPrayers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/prayers?id=${id}`, { method: "DELETE" });
      fetchPrayers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100 mb-2">
            <BookMarked className="w-3.5 h-3.5" />
            <span>Sanctuaire Spirituel du Couple</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Journal Privé d'Intercession & Prières
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-1">
            Déposez vos sujets de prière à deux et célébrez les grâces accordées à votre futur foyer.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
          style={{ backgroundColor: activeTheme.primary }}
        >
          <Plus className="w-4 h-4" />
          <span>Écrire une Prière</span>
        </button>
      </div>

      {/* Prayers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-stone-500 text-xs">Chargement du journal...</div>
        ) : prayers.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
            <BookMarked className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="font-serif font-bold text-stone-800 text-base">Votre journal est vierge</h3>
            <p className="text-xs text-stone-500">Consignez ici votre première prière de couple.</p>
          </div>
        ) : (
          prayers.map((p) => {
            const isP1 = activePartner === "partner1";
            const myPrayed = isP1 ? p.partner1Prayed : p.partner2Prayed;

            return (
              <div
                key={p.id}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                  p.isAnswered
                    ? "glass-card-warm border-emerald-200 shadow-2xs"
                    : "glass-panel border-stone-200 hover:shadow-md"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase mb-1">
                        <span>{p.category}</span>
                        <span>,</span>
                        <span>{p.prayerDate}</span>
                      </div>
                      <h3 className="font-serif font-bold text-stone-900 text-lg">{p.title}</h3>
                    </div>

                    {p.isAnswered && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                        Prière Exaucée
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-700 font-serif italic leading-relaxed whitespace-pre-line">
                    « {p.prayerText} »
                  </p>

                  {/* Testimony Box if answered */}
                  {p.isAnswered && p.testimony && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                      <strong className="block font-bold">Témoignage :</strong>
                      <p className="leading-relaxed">{p.testimony}</p>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => handleTogglePrayed(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                      myPrayed
                        ? "bg-purple-100 text-purple-800 font-bold"
                        : "bg-white/80 text-stone-600 hover:bg-white border border-stone-200"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${myPrayed ? "fill-current" : ""}`} />
                    <span>{myPrayed ? "J'ai prié pour ce sujet" : "Je prie maintenant"}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {!p.isAnswered && (
                      <button
                        onClick={() => setTestimonyModal({ id: p.id, text: "" })}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold cursor-pointer"
                      >
                        Exaucé
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal New Prayer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">Écrire une Prière de Couple</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Titre ou Sujet de Prière *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Paix et entente cordiale entre nos familles"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Notre Prière *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Seigneur Jésus, nous remettons entre Tes mains..."
                  value={form.prayerText}
                  onChange={(e) => setForm({ ...form, prayerText: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Catégorie</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  >
                    <option value="couple">Vie de Couple</option>
                    <option value="famille">Famille & Belle-Famille</option>
                    <option value="finances">Finances & Logement</option>
                    <option value="intimite">Pureté & Intimité</option>
                    <option value="jour_j">Jour J & Célébration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Date</label>
                  <input
                    type="date"
                    value={form.prayerDate}
                    onChange={(e) => setForm({ ...form, prayerDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C05638] text-white font-bold cursor-pointer hover:bg-[#A84429]"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Déposer la Prière
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Testimony Modal */}
      {testimonyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 text-xs">
            <h3 className="font-serif font-bold text-stone-900 text-base">Témoignage de Grâce</h3>
            <p className="text-stone-600">Partagez la réponse apportée à votre sujet de prière :</p>
            <textarea
              rows={3}
              placeholder="La situation a trouvé son dénouement dans la paix..."
              value={testimonyModal.text}
              onChange={(e) => setTestimonyModal({ ...testimonyModal, text: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
            ></textarea>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTestimonyModal(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={handleSaveTestimony}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer hover:bg-emerald-700"
              >
                Enregistrer le témoignage
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

