"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import {
  HelpCircle,
  Award,
  Flame,
  ArrowRight,
  Gift,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
  MapPin,
  MessageCircle,
} from "lucide-react";

export default function QuizzesPage() {
  const { couple, activePartner, partnerName, activeTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<"connaissance" | "situation_reelle" | "discussion_couple">("connaissance");
  const [questions, setQuestions] = useState<any[]>([]);
  const [scoreData, setScoreData] = useState<any>({ complicityScore: 88, totalAttempts: 0, hasSevenDayReward: false });
  const [loading, setLoading] = useState(true);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quizzes?category=${activeCategory}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setQuestions(data.questions || []);
          setScoreData(data.score || { complicityScore: 88, totalAttempts: 0 });
          setCurrentIdx(0);
          setSelectedOption(null);
          setIsAnswered(false);
          setResultData(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [activeCategory]);

  const currentQ = questions[currentIdx];

  const handleSubmitAnswer = async () => {
    if (selectedOption === null || !currentQ) return;
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          chosenOption: selectedOption,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsAnswered(true);
          setResultData(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setResultData(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#C05638] text-xs font-semibold border border-orange-100">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Quiz Bibliques & Connexion du Couple</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Complicité Biblique & Situations de Couple
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Testez vos connaissances de l'Écriture, confrontez vos réactions face aux situations réalistes de mariage en Côte d'Ivoire et approfondissez vos échanges.
        </p>

        {/* Category Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          <button
            onClick={() => setActiveCategory("connaissance")}
            className={`p-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
              activeCategory === "connaissance"
                ? "bg-[#C05638] text-white shadow-md"
                : "bg-white/80 hover:bg-white text-stone-700 border border-stone-200"
            }`}
            style={activeCategory === "connaissance" ? { backgroundColor: activeTheme.primary } : {}}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>1. Connaissance Biblique (5 par jour)</span>
          </button>

          <button
            onClick={() => setActiveCategory("situation_reelle")}
            className={`p-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
              activeCategory === "situation_reelle"
                ? "bg-[#C05638] text-white shadow-md"
                : "bg-white/80 hover:bg-white text-stone-700 border border-stone-200"
            }`}
            style={activeCategory === "situation_reelle" ? { backgroundColor: activeTheme.primary } : {}}
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span>2. Situations Réelles en Côte d'Ivoire (3 par jour)</span>
          </button>

          <button
            onClick={() => setActiveCategory("discussion_couple")}
            className={`p-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
              activeCategory === "discussion_couple"
                ? "bg-[#C05638] text-white shadow-md"
                : "bg-white/80 hover:bg-white text-stone-700 border border-stone-200"
            }`}
            style={activeCategory === "discussion_couple" ? { backgroundColor: activeTheme.primary } : {}}
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>3. Questions de Couple (5 par jour)</span>
          </button>
        </div>
      </div>

      {/* Complicity Score & Reward Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-3xl glass-panel border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase">Score de Complicité</span>
            <div className="text-3xl font-serif font-extrabold text-[#C05638] mt-0.5">
              {scoreData.complicityScore} %
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-orange-50 text-[#C05638]">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase">Questions Répondues</span>
            <div className="text-2xl font-serif font-bold text-stone-900 mt-0.5">
              {scoreData.totalAttempts} sessions
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card-warm border border-[#EAE2D5] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase">Engagement 7 Jours</span>
            <div className="text-xs font-serif font-bold text-stone-800 mt-1">
              {scoreData.hasSevenDayReward ? "Objectif franchi avec succès" : "7 jours consécutifs requis"}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-800">
            <Gift className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Quiz Card Stage */}
      {loading ? (
        <div className="text-center py-12 text-stone-500 text-xs">Chargement des questions...</div>
      ) : !currentQ ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-stone-200">
          <p className="text-stone-600 text-xs">Aucune question disponible dans cette catégorie.</p>
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-stone-200 shadow-sm space-y-6">
          
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 text-xs">
            <span className="text-[#C05638] font-bold uppercase tracking-wider">
              Question {currentIdx + 1} sur {questions.length}
            </span>
            <span className="text-stone-500">
              Tour de réponse : <strong>{partnerName}</strong>
            </span>
          </div>

          <h2 className="font-serif text-lg sm:text-2xl font-bold text-stone-900 leading-relaxed">
            {currentQ.question}
          </h2>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options?.map((opt: string, idx: number) => {
              const isSelected = selectedOption === idx;
              let btnClass = "bg-white/80 hover:bg-white border-stone-200 text-stone-800";

              if (isAnswered) {
                if (idx === currentQ.correctOptionIndex) {
                  btnClass = "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold";
                } else if (isSelected && !resultData?.isCorrect) {
                  btnClass = "bg-red-50 border-red-300 text-red-950";
                }
              } else if (isSelected) {
                btnClass = "bg-[#C05638]/10 border-[#C05638] text-[#C05638] font-bold";
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => setSelectedOption(idx)}
                  className={`w-full p-4 rounded-2xl border text-xs text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${btnClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center font-bold text-[11px] shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-relaxed">{opt}</span>
                  </div>

                  {isAnswered && idx === currentQ.correctOptionIndex && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {isAnswered && isSelected && !resultData?.isCorrect && (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Answer Explanation */}
          {isAnswered && (
            <div className="p-4 rounded-2xl glass-card-warm border border-[#EAE2D5] text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <Sparkles className="w-4 h-4 text-[#C05638]" />
                <span>Éclairage pastoral :</span>
              </div>
              <p className="text-stone-700 leading-relaxed">{resultData?.explanation}</p>
              {resultData?.bibleRef && (
                <span className="text-[11px] font-bold text-[#C05638]">Référence : {resultData.bibleRef}</span>
              )}
            </div>
          )}

          {/* Submit / Next Button */}
          <div className="pt-2 flex justify-end">
            {!isAnswered ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className="px-6 py-2.5 rounded-xl bg-[#C05638] disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer hover:bg-[#A84429]"
                style={{ backgroundColor: activeTheme.primary }}
              >
                Valider ma réponse
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 cursor-pointer"
              >
                <span>Question suivante</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

