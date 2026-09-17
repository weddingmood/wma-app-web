"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import { BookMarked, BookOpen, Clock, ChevronRight, CheckCircle2, Bookmark, ArrowLeft } from "lucide-react";

export default function LibraryPage() {
  const { activeTheme } = useTheme();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/library");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBooks(data.books || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleOpenBook = (b: any) => {
    setSelectedBook(b);
    setCurrentChapterIdx((b.userProgress?.currentChapter || 1) - 1);
  };

  const handleUpdateProgress = async (chapIdx: number) => {
    if (!selectedBook) return;
    const totalChaps = selectedBook.chapters?.length || 3;
    const pct = Math.round(((chapIdx + 1) / totalChaps) * 100);

    try {
      await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: selectedBook.id,
          currentChapter: chapIdx + 1,
          progressPercent: pct,
        }),
      });
      fetchBooks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100">
          <BookMarked className="w-3.5 h-3.5" />
          <span>Bibliothèque & Ouvrages Pastoraux</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Livres Recommandés pour Bâtir Votre Foyer
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Lectures chrétiennes sélectionnées sur la communication, les finances, la pureté et la prière avec lecteur intégré et reprise automatique.
        </p>
      </div>

      {/* Reader Modal View */}
      {selectedBook ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-6 animate-in fade-in">
          
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <button
              onClick={() => setSelectedBook(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à la Bibliothèque</span>
            </button>

            <span className="text-xs font-semibold text-stone-500">
              Chapitre {currentChapterIdx + 1} sur {selectedBook.chapters?.length || 1}
            </span>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <span className="text-xs font-bold text-[#C05638] uppercase tracking-wider">{selectedBook.category}</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                {selectedBook.title}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Auteur : {selectedBook.author} • Édition : {selectedBook.pastor || "Pastoral"}
              </p>
            </div>

            {/* Chapter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 pb-3">
              {selectedBook.chapters?.map((ch: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentChapterIdx(idx);
                    handleUpdateProgress(idx);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    currentChapterIdx === idx
                      ? "bg-[#C05638] text-white font-bold"
                      : "bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200"
                  }`}
                  style={currentChapterIdx === idx ? { backgroundColor: activeTheme.primary } : {}}
                >
                  {ch.title.split(":")[0]}
                </button>
              ))}
            </div>

            {/* Active Chapter Reading Stage */}
            {selectedBook.chapters?.[currentChapterIdx] && (
              <div className="space-y-4 font-serif leading-relaxed text-stone-800 text-sm sm:text-base bg-[#FCFAF7] p-6 sm:p-8 rounded-3xl border border-[#EAE2D5]">
                <h3 className="font-bold text-xl text-stone-900">
                  {selectedBook.chapters[currentChapterIdx].title}
                </h3>
                <p className="whitespace-pre-line text-stone-700 leading-loose">
                  {selectedBook.chapters[currentChapterIdx].content}
                </p>
              </div>
            )}

            {/* Next Chapter Button */}
            <div className="flex items-center justify-between pt-4">
              <button
                disabled={currentChapterIdx === 0}
                onClick={() => {
                  const prev = currentChapterIdx - 1;
                  setCurrentChapterIdx(prev);
                  handleUpdateProgress(prev);
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 disabled:opacity-40 text-stone-700 text-xs font-semibold"
              >
                Chapitre précédent
              </button>

              <button
                disabled={currentChapterIdx >= (selectedBook.chapters?.length || 1) - 1}
                onClick={() => {
                  const nxt = currentChapterIdx + 1;
                  setCurrentChapterIdx(nxt);
                  handleUpdateProgress(nxt);
                }}
                className="px-5 py-2 rounded-xl bg-stone-900 disabled:opacity-40 text-white text-xs font-bold hover:bg-stone-800"
              >
                Chapitre suivant
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* Books Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((b) => {
            const prog = b.userProgress?.progressPercent || 0;
            return (
              <div
                key={b.id}
                className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group hover:border-[#D4AF37]/50"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-[#C05638] text-[10px] font-bold uppercase">
                      {b.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-stone-400">
                      <Clock className="w-3.5 h-3.5" />
                      {b.readTimeMin || 25} min
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-stone-900 text-lg leading-snug">
                    {b.title}
                  </h3>

                  <p className="text-xs text-stone-500">{b.author}</p>

                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                    {b.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>Progression</span>
                      <span className="font-bold">{prog} %</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C05638] rounded-full"
                        style={{ width: `${prog}%`, backgroundColor: activeTheme.primary }}
                      ></div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBook(b)}
                    className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-[#C05638] transition-colors flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{prog > 0 ? "Reprendre la Lecture" : "Commencer la Lecture"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
