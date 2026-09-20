"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Tag,
  Heart,
} from "lucide-react";

export default function CalendarPage() {
  const { couple, activeTheme } = useTheme();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const [form, setForm] = useState({
    title: "",
    description: "",
    eventDate: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "12:00",
    location: "Abidjan",
    category: "rendez_vous",
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/calendar");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEvents(data.events || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.eventDate) return;

    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({
          title: "",
          description: "",
          eventDate: new Date().toISOString().split("T")[0],
          startTime: "10:00",
          endTime: "12:00",
          location: "Abidjan",
          category: "rendez_vous",
        });
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  // Month navigation helpers
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Month grid calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  // Map events to date strings
  const eventsByDate = new Map<string, any[]>();
  events.forEach((ev) => {
    const list = eventsByDate.get(ev.eventDate) || [];
    list.push(ev);
    eventsByDate.set(ev.eventDate, list);
  });

  const selectedDateEvents = eventsByDate.get(selectedDate) || [];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner with White Glass */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100 mb-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Agenda Synchronisé du Couple</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Calendrier Interactif des Préparatifs
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-1">
            Connecté à vos tâches, entretiens pastoraux, séances de répétition, dégustations et rendez-vous d'état civil.
          </p>
        </div>

        <button
          onClick={() => {
            setForm((prev) => ({ ...prev, eventDate: selectedDate }));
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
          style={{ backgroundColor: activeTheme.primary }}
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Événement</span>
        </button>
      </div>

      {/* Main Interactive Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Month View Grid */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-6">
          
          {/* Calendar Header with Controls */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h2 className="font-serif font-bold text-stone-900 text-xl sm:text-2xl">
              {monthNames[month]} {year}
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 cursor-pointer transition-colors"
                title="Mois précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelectedDate(today.toISOString().split("T")[0]);
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-700 cursor-pointer"
              >
                Aujourd'hui
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 cursor-pointer transition-colors"
                title="Mois suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-stone-400 uppercase">
            <span>Dim</span>
            <span>Lun</span>
            <span>Mar</span>
            <span>Mer</span>
            <span>Jeu</span>
            <span>Ven</span>
            <span>Sam</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Blank cells before month starts */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-20 sm:h-24 rounded-2xl bg-stone-50/40 opacity-40"></div>
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, dIdx) => {
              const dayNum = dIdx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const dayEvents = eventsByDate.get(dateStr) || [];
              const isSelected = selectedDate === dateStr;
              const isWeddingDay = couple?.weddingDate === dateStr;
              const isToday = new Date().toISOString().split("T")[0] === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-[#C05638] bg-[#FCFAF7] border-[#C05638] shadow-xs"
                      : isWeddingDay
                      ? "bg-amber-50/80 border-amber-300 shadow-2xs"
                      : "bg-white/80 hover:bg-white border-stone-200"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? "bg-[#C05638] text-white"
                          : isWeddingDay
                          ? "bg-amber-600 text-white"
                          : "text-stone-800"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isWeddingDay && (
                      <Heart className="w-3.5 h-3.5 text-amber-600 fill-current" />
                    )}
                  </div>

                  {/* Day Events Pills */}
                  <div className="w-full space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev: any, eIdx: number) => (
                      <div
                        key={eIdx}
                        className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium ${
                          ev.isTaskLinked
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-orange-50 text-[#C05638] border border-orange-200"
                        }`}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-stone-400 font-bold px-1">
                        +{dayEvents.length - 2} autre(s)
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Wedding date reminder */}
          {couple?.weddingDate && (
            <div className="p-3.5 rounded-2xl glass-card-warm border border-amber-200/80 flex items-center gap-3 text-xs text-amber-950">
              <Heart className="w-5 h-5 text-amber-600 shrink-0 fill-current" />
              <div>
                <strong>Célébration du Mariage :</strong> Prévue le {couple.weddingDate}. Cet événement est automatiquement mis en avant sur votre calendrier.
              </div>
            </div>
          )}

        </div>

        {/* Selected Date Side Panel (Details & Events) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-4">
            
            <div className="border-b border-stone-100 pb-3">
              <span className="text-[10px] uppercase font-bold text-stone-400">Date sélectionnée</span>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                {selectedDate}
              </h3>
            </div>

            {/* Event list for selected date */}
            <div className="space-y-3 max-h-[450px] overflow-y-auto">
              {selectedDateEvents.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <CalendarIcon className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-xs text-stone-500">Aucun rendez-vous pour ce jour.</p>
                  <button
                    onClick={() => {
                      setForm((prev) => ({ ...prev, eventDate: selectedDate }));
                      setIsModalOpen(true);
                    }}
                    className="text-xs text-[#C05638] font-bold hover:underline cursor-pointer"
                  >
                    + Ajouter sur cette date
                  </button>
                </div>
              ) : (
                selectedDateEvents.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl glass-card-warm border border-[#EAE2D5] space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif font-bold text-stone-900 text-sm">
                        {ev.title}
                      </h4>
                      {!ev.isTaskLinked && (
                        <button
                          onClick={() => handleDelete(ev.id)}
                          className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {ev.description && (
                      <p className="text-stone-600 leading-relaxed text-[11px]">{ev.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-500 pt-1">
                      {ev.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {ev.startTime}
                        </span>
                      )}
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {ev.location}
                        </span>
                      )}
                      {ev.isTaskLinked && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          Tâche connectée
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setForm((prev) => ({ ...prev, eventDate: selectedDate }));
                setIsModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-[#C05638] transition-colors cursor-pointer"
            >
              + Ajouter un Rendez-vous
            </button>

          </div>
        </div>

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">Planifier un Événement</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Titre de l'événement *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Entretien prénuptial N°5 avec le Pasteur"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Détails, documents à apporter..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Heure de début</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Lieu</label>
                <input
                  type="text"
                  placeholder="Ex: Bureau Pastoral - Riviera / Espace Golf"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
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
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

