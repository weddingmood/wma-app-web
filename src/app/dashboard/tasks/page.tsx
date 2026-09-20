"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  CheckSquare,
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  AlertCircle,
  Clock,
  Trash2,
  CheckCircle2,
  Edit2,
  X,
} from "lucide-react";

export default function TasksPage() {
  const { couple, activePartner, partnerName, activeTheme } = useTheme();
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    assignee: "both",
    dueDate: "",
    priority: "medium",
    budgetEstimated: 0,
    budgetActual: 0,
    comments: "",
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTasksList(data.tasks || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          title: "",
          description: "",
          category: "general",
          assignee: "both",
          dueDate: "",
          priority: "medium",
          budgetEstimated: 0,
          budgetActual: 0,
          comments: "",
        });
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (task: any) => {
    const nextStatus = task.status === "completed" ? "todo" : "completed";
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm("Voulez-vous supprimer cette tâche ?")) return;
    try {
      await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasksList.filter((t) => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (assigneeFilter !== "all" && t.assignee !== assigneeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
    }
    return true;
  });

  const completedCount = tasksList.filter((t) => t.status === "completed").length;
  const progressPercent = tasksList.length > 0 ? Math.round((completedCount / tasksList.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100 mb-2">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Organisation & Actions du Couple</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Tâches & Préparatifs du Mariage
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-1">
            {completedCount} sur {tasksList.length} tâches terminées ({progressPercent} %)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C05638] hover:bg-[#A84429] text-white text-xs font-bold shadow-md transition-all shrink-0"
          style={{ backgroundColor: activeTheme.primary }}
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une Tâche</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none"
        >
          <option value="all">Toutes Catégories</option>
          <option value="dot">Dot Traditionnelle</option>
          <option value="civil">Mariage Civil</option>
          <option value="spirituel">Spirituel & Église</option>
          <option value="reception">Réception & Salle</option>
          <option value="traiteur">Traiteur & Repas</option>
          <option value="tenues">Tenues & Alliances</option>
          <option value="photo_video">Photo & Vidéo</option>
          <option value="musique">Musique & Chantres</option>
          <option value="logistique">Logistique & Transport</option>
          <option value="general">Général</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none"
        >
          <option value="all">Tous Responsables</option>
          <option value="both">Nous deux</option>
          <option value="him">Époux (Lui)</option>
          <option value="her">Épouse (Elle)</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none"
        >
          <option value="all">Tous Statuts</option>
          <option value="todo">À faire</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminé</option>
          <option value="delayed">En retard</option>
        </select>

      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="text-center py-12 text-stone-500 text-xs">Chargement des tâches...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
          <CheckSquare className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-serif font-bold text-stone-800 text-base">Aucune tâche trouvée</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Ajoutez votre première tâche pour coordonner les préparatifs avec votre fiancé(e).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((t) => {
            const isDone = t.status === "completed";
            return (
              <div
                key={t.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isDone
                    ? "bg-[#FCFAF7] border-emerald-200/80 opacity-80"
                    : "bg-white border-stone-200 hover:shadow-md hover:border-[#D4AF37]/50"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => handleToggleStatus(t)}
                      className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                        isDone
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-stone-300 hover:border-emerald-600 text-transparent"
                      }`}
                      title={isDone ? "Marquer à faire" : "Marquer terminé"}
                    >
                      <CheckCircle2 className="w-4 h-4 fill-current" />
                    </button>

                    <div className="flex-1">
                      <h4
                        className={`font-serif font-bold text-sm ${
                          isDone ? "line-through text-stone-400" : "text-stone-900"
                        }`}
                      >
                        {t.title}
                      </h4>
                      {t.description && (
                        <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata tags */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium capitalize">
                      {t.category.replace("_", " ")}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md font-medium ${
                        t.priority === "urgent"
                          ? "bg-red-50 text-red-700 border border-red-200 font-bold"
                          : t.priority === "high"
                          ? "bg-orange-50 text-orange-700 border border-orange-200"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {t.priority === "urgent" ? "Urgent" : t.priority === "high" ? "Haute" : "Normale"}
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
                      {t.assignee === "both"
                        ? "Nous deux"
                        : t.assignee === "him"
                        ? "Époux (Lui)"
                        : "Épouse (Elle)"}
                    </span>
                  </div>
                </div>

                {/* Footer info & Delete */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100 text-[11px] text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t.dueDate || "Sans échéance"}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                    title="Supprimer la tâche"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 overflow-y-auto max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                Nouvelle Tâche de Préparation
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-stone-700 font-bold mb-1">Titre de la tâche *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Confirmer la commande des pagnes kita"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Description & Détails</label>
                <textarea
                  rows={2}
                  placeholder="Instructions particulières, lieu, contacts..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-stone-400"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none"
                  >
                    <option value="dot">Dot Traditionnelle</option>
                    <option value="civil">Mariage Civil</option>
                    <option value="spirituel">Spirituel & Église</option>
                    <option value="reception">Réception & Salle</option>
                    <option value="traiteur">Traiteur & Repas</option>
                    <option value="tenues">Tenues & Alliances</option>
                    <option value="photo_video">Photo & Vidéo</option>
                    <option value="musique">Musique & Chantres</option>
                    <option value="logistique">Logistique & Transport</option>
                    <option value="general">Général</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Responsable</label>
                  <select
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none"
                  >
                    <option value="both">Nous deux</option>
                    <option value="him">Époux (Lui)</option>
                    <option value="her">Épouse (Elle)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Date d'échéance</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Priorité</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-semibold hover:bg-stone-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C05638] text-white font-bold hover:bg-[#A84429] shadow-sm"
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

