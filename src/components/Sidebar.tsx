"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeContext";
import {
  LayoutDashboard,
  HeartHandshake,
  CheckSquare,
  Clock,
  Calendar,
  Wallet,
  Scale,
  BookOpen,
  BookMarked,
  ScrollText,
  HelpCircle,
  Gamepad2,
  Users,
  Send,
  Sparkles,
  MessageSquare,
  Palette,
  Shield,
  CreditCard,
  Smartphone,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { couple, activeTheme } = useTheme();

  const navGroups = [
    {
      title: "VUE GÉNÉRALE",
      items: [
        { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      ],
    },
    {
      title: "NOTRE MARIAGE (Que préparer ?)",
      items: [
        { href: "/dashboard/notre-mariage", label: "Vue Cérémonies (Dot, Mairie)", icon: HeartHandshake },
        { href: "/dashboard/tasks", label: "Tâches & Préparatifs", icon: CheckSquare },
        { href: "/dashboard/chronogramme", label: "Chronogramme J-90", icon: Clock },
        { href: "/dashboard/calendar", label: "Calendrier Partagé", icon: Calendar },
        { href: "/dashboard/budget", label: "Budget & Dépenses (Dès 50K)", icon: Wallet },
        { href: "/dashboard/decisions", label: "Décisions du Couple", icon: Scale },
      ],
    },
    {
      title: "NOUS DEUX & DIEU (Grandir ensemble)",
      items: [
        { href: "/dashboard/devotions", label: "7 Thèmes Bibliques", icon: BookOpen },
        { href: "/dashboard/prayers", label: "Journal de Prière", icon: BookMarked },
        { href: "/dashboard/commandments", label: "Les 10 Commandements", icon: ScrollText },
        { href: "/dashboard/quizzes", label: "Quiz & Complicité", icon: HelpCircle },
      ],
    },
    {
      title: "JEUX (Passer du temps à deux)",
      items: [
        { href: "/dashboard/jeux", label: "Espace Jeux (Awalé, Ludo)", icon: Gamepad2 },
      ],
    },
    {
      title: "BON À SAVOIR (Comprendre)",
      items: [
        { href: "/dashboard/articles", label: "Guides & Démarches CI", icon: BookOpen },
        { href: "/dashboard/library", label: "Bibliothèque Pastorale", icon: BookMarked },
      ],
    },
    {
      title: "INVITÉS & INVITATIONS",
      items: [
        { href: "/dashboard/guests", label: "Gestion des Invités & QR", icon: Users },
        { href: "/dashboard/invitation", label: "Site d'Invitation & RSVP", icon: Send },
        { href: "/dashboard/cagnotte", label: "Cagnotte Premier Loyer", icon: Wallet },
      ],
    },
    {
      title: "COMMUNICATION & JOUR J",
      items: [
        { href: "/dashboard/chat", label: "Messagerie Privée", icon: MessageSquare },
        { href: "/dashboard/jour-j", label: "Espace Spécial Jour J", icon: Sparkles },
      ],
    },
    {
      title: "EXPÉRIENCE & COMPTE",
      items: [
        { href: "/dashboard/preferences", label: "20 Thèmes & Affichage", icon: Palette },
        { href: "/dashboard/subscription", label: "Abonnement Wave (2 000 FCFA)", icon: CreditCard },
        { href: "/telechargement", label: "Application Mobile & APK", icon: Smartphone },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container with Glass styling */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 glass-panel border-r border-stone-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-30 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header inside sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100 lg:hidden">
          <span className="font-serif font-bold text-stone-900 text-base">Menu Wedding Mood</span>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Couple Status Card with glass warmth */}
        <div className="p-4 mx-3 my-3 rounded-2xl glass-card-warm border border-[#EAE2D5] shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C05638]">
              {couple?.status === "active"
                ? "Compte Actif"
                : couple?.status === "verification"
                ? "Paiement en Vérification"
                : "Période d'Essai (3 jours)"}
            </span>
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activeTheme.primary }}
            ></span>
          </div>
          <div className="text-xs font-serif font-bold text-stone-900 truncate">
            {couple?.partner1Name} & {couple?.partner2Name}
          </div>
          <div className="text-[11px] text-stone-500 truncate mt-0.5">
            {couple?.city || "Abidjan"} • {couple?.weddingDate || "Mariage 2025"}
          </div>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <h5 className="px-3 text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                {group.title}
              </h5>
              <div className="space-y-0.5 mt-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-[#C05638] text-white shadow-xs font-semibold"
                          : "text-stone-700 hover:bg-white/80 hover:text-stone-900"
                      }`}
                      style={isActive ? { backgroundColor: activeTheme.primary } : {}}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Admin Link */}
        <div className="p-3 border-t border-stone-100 bg-stone-50/60 flex flex-col gap-2">
          <Link
            href="/admin"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-stone-500" />
              Espace Administrateur
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-200 text-stone-700 font-bold">Gestion</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
