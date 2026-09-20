"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  Users,
  Plus,
  Search,
  Upload,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  X,
  Phone,
  Mail,
} from "lucide-react";
import QRCode from "qrcode";

export default function GuestsPage() {
  const { couple, activeTheme } = useTheme();
  const [guests, setGuests] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalGuests: 0, confirmedCount: 0, totalWithPlusOnes: 0, checkedInCount: 0 });
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState("all");
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [qrModalGuest, setQrModalGuest] = useState<{ guest: any; qrDataUrl: string } | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    groupName: "famille",
    phone: "",
    email: "",
    plusOnesAllowed: "0",
    tableNumber: "",
    dietaryNeeds: "",
    notes: "",
  });

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/guests");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setGuests(data.guests || []);
          setStats(data.stats || { totalGuests: 0, confirmedCount: 0, totalWithPlusOnes: 0, checkedInCount: 0 });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName) return;

    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setForm({
          firstName: "",
          lastName: "",
          groupName: "famille",
          phone: "",
          email: "",
          plusOnesAllowed: "0",
          tableNumber: "",
          dietaryNeeds: "",
          notes: "",
        });
        fetchGuests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCheckIn = async (id: number) => {
    try {
      await fetch("/api/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "check-in" }),
      });
      fetchGuests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleShowQr = async (guest: any) => {
    const token = guest.qrCodeToken || `WM-${guest.id}-CHECKIN`;
    const dataUrl = await QRCode.toDataURL(token, { width: 260, margin: 2, color: { dark: "#143A2C", light: "#FAF6EE" } });
    setQrModalGuest({ guest, qrDataUrl: dataUrl });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous supprimer cet invité ?")) return;
    try {
      await fetch(`/api/guests?id=${id}`, { method: "DELETE" });
      fetchGuests();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredGuests = guests.filter((g) => {
    if (groupFilter !== "all" && g.groupName !== groupFilter) return false;
    if (rsvpFilter !== "all" && g.rsvpStatus !== rsvpFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        g.firstName.toLowerCase().includes(q) ||
        (g.lastName && g.lastName.toLowerCase().includes(q)) ||
        (g.phone && g.phone.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Gestion des Invités & Badges QR</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Liste des Invités & Suivi RSVP
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-1">
            Gérez les groupes (Famille, Jeunesse, Chorale, VIP), assignez les tables et générez les QR codes uniques de check-in.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white text-xs font-bold shadow-md transition-all shrink-0"
          style={{ backgroundColor: activeTheme.primary }}
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Invité</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Total Répertoriés</span>
          <div className="text-2xl font-serif font-bold text-stone-900 mt-0.5">{stats.totalGuests}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase">RSVP Confirmés</span>
          <div className="text-2xl font-serif font-bold text-emerald-700 mt-0.5">{stats.confirmedCount}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Couverts Prévus (+1)</span>
          <div className="text-2xl font-serif font-bold text-blue-700 mt-0.5">{stats.totalWithPlusOnes}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Check-in Jour J</span>
          <div className="text-2xl font-serif font-bold text-purple-700 mt-0.5">{stats.checkedInCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none"
          />
        </div>

        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800"
        >
          <option value="all">Tous les Groupes</option>
          <option value="famille">Famille</option>
          <option value="jeunesse">Jeunesse</option>
          <option value="chorale">Chorale</option>
          <option value="amis">Amis</option>
          <option value="collegues">Collègues</option>
          <option value="vip">VIP & Pasteurs</option>
        </select>

        <select
          value={rsvpFilter}
          onChange={(e) => setRsvpFilter(e.target.value)}
          className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800"
        >
          <option value="all">Tous les Statuts RSVP</option>
          <option value="confirmed">Confirmé</option>
          <option value="pending">En attente</option>
          <option value="declined">Absent</option>
        </select>
      </div>

      {/* Guests Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FCFAF7] border-b border-stone-100 text-[11px] text-stone-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Invité(e)</th>
                <th className="p-4">Groupe</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Table</th>
                <th className="p-4">RSVP</th>
                <th className="p-4">Check-in</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredGuests.map((g) => (
                <tr key={g.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="p-4">
                    <strong className="text-stone-900 block">{g.firstName} {g.lastName}</strong>
                    {g.plusOnesAllowed > 0 && (
                      <span className="text-[10px] text-stone-400">+{g.plusOnesConfirmed || g.plusOnesAllowed} accompagnant(s)</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium capitalize">
                      {g.groupName}
                    </span>
                  </td>
                  <td className="p-4 text-stone-500">
                    <div>{g.phone || "-"}</div>
                    <div className="text-[10px]">{g.email || ""}</div>
                  </td>
                  <td className="p-4 text-stone-800 font-medium">
                    {g.tableNumber || "Non assignée"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        g.rsvpStatus === "confirmed"
                          ? "bg-emerald-100 text-emerald-800"
                          : g.rsvpStatus === "declined"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {g.rsvpStatus === "confirmed" ? "Présent ?" : g.rsvpStatus === "declined" ? "Absent" : "En attente"}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleCheckIn(g.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                        g.isCheckedIn
                          ? "bg-emerald-600 text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {g.isCheckedIn ? "Présent Jour J ?" : "Scanner"}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleShowQr(g)}
                        className="p-1.5 text-stone-500 hover:text-[#C05638]"
                        title="Voir le QR Code d'entrée"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">Ajouter un Invité</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kouassi"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Nom</label>
                  <input
                    type="text"
                    placeholder="Ex: Jean"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Groupe</label>
                  <select
                    value={form.groupName}
                    onChange={(e) => setForm({ ...form, groupName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  >
                    <option value="famille">Famille</option>
                    <option value="jeunesse">Jeunesse</option>
                    <option value="chorale">Chorale</option>
                    <option value="amis">Amis</option>
                    <option value="collegues">Collègues</option>
                    <option value="vip">VIP & Pasteurs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Table</label>
                  <input
                    type="text"
                    placeholder="Ex: Table Famille"
                    value={form.tableNumber}
                    onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Téléphone (+225)</label>
                  <input
                    type="text"
                    placeholder="+225 07..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Accompagnants (+1)</label>
                  <input
                    type="number"
                    value={form.plusOnesAllowed}
                    onChange={(e) => setForm({ ...form, plusOnesAllowed: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C05638] text-white font-bold"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              Pass Invité VIP • {qrModalGuest.guest.firstName} {qrModalGuest.guest.lastName}
            </h3>
            <p className="text-xs text-stone-500">
              Présentez ce QR Code à l'entrée de la salle pour le check-in instantané.
            </p>
            <div className="flex justify-center p-4 bg-[#FCFAF7] rounded-2xl border border-[#EAE2D5]">
              <img src={qrModalGuest.qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-xl shadow-xs" />
            </div>
            <button
              onClick={() => setQrModalGuest(null)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

