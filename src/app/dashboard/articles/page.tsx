"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import { BookOpen, Search, ExternalLink, ShieldCheck, ChevronRight, FileText } from "lucide-react";

export default function ArticlesPage() {
  const { activeTheme } = useTheme();
  const [articles, setArticles] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [artRes, courseRes] = await Promise.all([
          fetch("/api/articles"),
          fetch("/api/courses"),
        ]);
        if (artRes.ok) {
          const data = await artRes.json();
          setArticles(data.articles || []);
          if (data.articles?.length > 0) setSelectedArticle(data.articles[0]);
        }
        if (courseRes.ok) {
          const cData = await courseRes.json();
          setCoursesList(cData.courses || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredArticles = selectedCategory === "all"
    ? articles
    : articles.filter((a) => a.category === selectedCategory);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Bon à Savoir • Côte d'Ivoire</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Législation, Coutumes & Démarches Officielles
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Comprendre la loi ivoirienne de 2019 sur le mariage civil, les rites traditionnels de dot selon les ethnies (Akan, Krou, Mandé, Gour) et les règles de biens.
        </p>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {["all", "civil", "dot", "documents", "eglise"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-[#C05638] text-white font-bold"
                  : "bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200"
              }`}
              style={selectedCategory === cat ? { backgroundColor: activeTheme.primary } : {}}
            >
              {cat === "all" ? "Tous les Sujets" : cat === "civil" ? "Mariage Civil" : cat === "dot" ? "Dot Traditionnelle" : cat === "documents" ? "Pièces Administratives" : "Église & Pastorale"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Article Reader & Article List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Article Reader (Left) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedArticle ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-5">
              <div className="border-b border-stone-100 pb-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-bold text-[#C05638] uppercase">{selectedArticle.organism || "Source Officielle"}</span>
                  <span>Vérifié le {selectedArticle.verifiedAt || "Récemment"}</span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-stone-900">
                  {selectedArticle.title}
                </h2>
              </div>

              <div className="text-stone-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line space-y-4">
                {selectedArticle.content}
              </div>

              {selectedArticle.sourceUrl && (
                <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Source : {selectedArticle.source}</span>
                  <a
                    href={selectedArticle.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-semibold text-[#C05638] hover:underline"
                  >
                    <span>Consulter le texte de loi</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 text-xs text-stone-500">
              Sélectionnez un article pour lire le guide complet.
            </div>
          )}

          {/* Practical Courses & Guides */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              Parcours & Guides Méthodologiques
            </h3>
            <div className="space-y-4">
              {coursesList.map((course) => (
                <div key={course.id} className="p-5 rounded-2xl bg-[#FCFAF7] border border-[#EAE2D5] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-stone-900 text-base">{course.title}</h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-[#C05638] font-bold">
                      {course.momentIdeal}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{course.description}</p>
                  
                  {course.steps && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-stone-800 uppercase">Étapes clés :</span>
                      {course.steps.map((st: any, sIdx: number) => (
                        <div key={sIdx} className="text-xs text-stone-700 flex items-start gap-2">
                          <span className="font-bold text-[#C05638] shrink-0">{st.stepNumber}.</span>
                          <span><strong>{st.title} :</strong> {st.detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Articles Menu (Right) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-stone-900 text-lg border-b border-stone-100 pb-3">
              Fiches Pratiques Disponibles
            </h3>

            <div className="space-y-2">
              {filteredArticles.map((art) => {
                const isSelected = selectedArticle?.id === art.id;
                return (
                  <button
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className={`w-full p-3.5 rounded-2xl text-left text-xs transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? "bg-[#C05638] text-white shadow-md font-bold"
                        : "bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200"
                    }`}
                    style={isSelected ? { backgroundColor: activeTheme.primary } : {}}
                  >
                    <div className="space-y-0.5">
                      <span className={`text-[10px] uppercase font-bold ${isSelected ? "text-white/80" : "text-[#C05638]"}`}>
                        {art.category}
                      </span>
                      <div className="font-serif line-clamp-2 leading-tight">{art.title}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 mt-2" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

