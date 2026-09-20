"use client";

import Link from "next/link";
import { Users, Wallet, Calendar, CheckSquare, Gamepad2, AlertCircle, ArrowRight } from "lucide-react";

export default function DashboardHome() {
  const couplePhoto = "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&v=" + Date.now();

  return (
    <div className="w-full min-h-screen bg-slate-50 px-3 py-4 sm:px-6 max-w-md md:max-w-3xl mx-auto space-y-4 overflow-x-hidden pb-20">
      
      {/* 1. CARTE HERO: NOTRE ESPACE DE PRÉPARATION */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-md bg-stone-900 min-h-[260px] p-4 flex flex-col justify-end">
        <img
          src={couplePhoto}
          alt="YVES & Rapha"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1519741497674-611481863552?w=800";
          }}
        />
        
        <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-xl p-4 text-center space-y-2 border border-white/50 shadow-sm">
          <Link href="/dashboard/profile" className="inline-block text-[10px] font-bold uppercase tracking-wide text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-200 hover:bg-amber-200 transition">
            📷 Modifier la photo du couple
          </Link>

          <p className="text-[10px] font-semibold text-amber-700 tracking-wider uppercase">
            ✨ Notre Espace de Préparation
          </p>

          <h1 className="text-xl font-extrabold text-stone-900 leading-tight">
            YVES & Rapha
          </h1>

          <p className="text-[11px] italic text-stone-600 px-1">
            « Ecclésiaste 4:12 - La corde à trois fils ne se rompt pas facilement. »
          </p>
          
          <div className="grid grid-cols-2 gap-2 pt-2 text-left">
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-200 text-center">
              <span className="text-[9px] font-semibold text-stone-400 block uppercase">Compte à rebours</span>
              <span className="text-sm font-black text-amber-600">J-454</span>
            </div>
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-200 text-center">
              <span className="text-[9px] font-semibold text-stone-400 block uppercase">Date du mariage</span>
              <span className="text-xs font-bold text-stone-800 leading-5">2027-12-18</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROGRESSION DE PRÉPARATION */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-2">
        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
          OÙ EN SOMMES-NOUS ?
        </p>
        <h2 className="text-base font-extrabold text-stone-900">
          Votre mariage est préparé à <span className="text-amber-600">10 %</span>
        </h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          Calculé automatiquement à partir de vos tâches terminées, vos entretiens spirituels, vos confirmations RSVP et vos commandements validés.
        </p>
        
        <div className="pt-2">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-stone-600">Avancement</span>
            <span className="text-amber-600">10%</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div className="bg-amber-600 h-2 rounded-full w-[10%] transition-all duration-500"></div>
          </div>
        </div>
      </div>

      {/* 3. ACTION PRIORITAIRE RECOMMANDEE */}
      <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
              ACTION PRIORITAIRE RECOMMANDEE
            </p>
            <h3 className="text-sm font-bold text-stone-900">Fiançailles</h3>
          </div>
        </div>
        <p className="text-xs text-stone-600">
          Il doit se faire à Libreville au Gabon
        </p>
        <Link 
          href="/dashboard/tasks" 
          className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm"
        >
          Accéder aux Tâches <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4. RACCOURCIS MODULES DU DASHBOARD */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link href="/dashboard/tasks" className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm hover:border-amber-300 transition flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckSquare className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-stone-900 text-xs">Tâches</h3>
            <p className="text-[10px] text-stone-500">0 / 1 terminées</p>
          </div>
        </Link>

        <Link href="/dashboard/guests" className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm hover:border-amber-300 transition flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-stone-900 text-xs">Invités & RSVP</h3>
            <p className="text-[10px] text-stone-500">Liste & Présences</p>
          </div>
        </Link>

        <Link href="/dashboard/cagnotte" className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm hover:border-amber-300 transition flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg"><Wallet className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-stone-900 text-xs">Cagnotte</h3>
            <p className="text-[10px] text-stone-500">Gestion des dons</p>
          </div>
        </Link>

        <Link href="/dashboard/jeux" className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm hover:border-amber-300 transition flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg"><Gamepad2 className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-stone-900 text-xs">Jeux Duo & Invités</h3>
            <p className="text-[10px] text-stone-500">Espace partagé</p>
          </div>
        </Link>
      </div>

    </div>
  );
}

