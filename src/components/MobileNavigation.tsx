"use client";
import { Store as PrestatairesIcon } from "lucide-react";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";
import {
  Home,
  CheckSquare,
  Heart,
  Wallet,
  Menu as MenuIcon,
  X,
  Calendar,
  Users,
  Send,
  BookOpen,
  BookMarked,
  ScrollText,
  HelpCircle,
  Gamepad2,
  MessageSquare,
  Sparkles,
  Sliders,
  CreditCard,
  HeartHandshake,
  Clock,
  Scale,
  Smartphone,
} from "lucide-react";

export function MobileNavigation() {
  const pathname = usePathname();
  const { activeTheme } = useTheme();
  const [isFullMenuOpen, setIsFullMenuOpen] = useState(false);

  const bottomNavItems = [
    { href: "/dashboard", label: "Accueil", icon: Home },
    { href: "/dashboard/tasks", label: "Préparatifs", icon: CheckSquare },
    { href: "/dashboard/devotions", label: "Nous deux", icon: Heart },
    { href: "/dashboard/budget", label: "Budget", icon: Wallet },
  ];

  const fullDrawerLinks = [
    { title: "NOTRE MARIAGE", items: [
      { href: "/dashboard/notre-mariage", label: "Vue Cérémonies", icon: HeartHandshake },
      { href: "/dashboard/chronogramme", label: "Chronogramme J-90", icon: Clock },
      { href: "/dashboard/calendar", label: "Calendrier Partagé", icon: Calendar },
      { href: "/dashboard/decisions", label: "Décisions du Couple", icon: Scale },
    ]},
    { title: "SPIRITUALITÉ & COMPLICITÉ", items: [
      { href: "/dashboard/prayers", label: "Journal de Prière", icon: BookMarked },
      { href: "/dashboard/commandments", label: "Les 10 Commandements", icon: ScrollText },
      { href: "/dashboard/quizzes", label: "Quiz de Couple", icon: HelpCircle },
      { href: "/dashboard/jeux", label: "Jeux & Awalé", icon: Gamepad2 },
      { href: "/dashboard/chat", label: "Messagerie Privée", icon: MessageSquare },
    ]},
    { title: "INVITÉS & GRAND JOUR", items: [
      { href: "/dashboard/guests", label: "Gestion des Invités", icon: Users },
      { href: "/dashboard/invitation", label: "Carte d'Invitation & RSVP", icon: Send },
      { href: "/dashboard/cagnotte", label: "Cagnotte Premier Loyer", icon: Wallet },
      { href: "/dashboard/jour-j", label: "Espace Jour J", icon: Sparkles },
    ]},
    { title: "RESSOURCES & COMPTE", items: [
      { href: "/dashboard/articles", label: "Guides & Lois CI", icon: BookOpen },
      { href: "/dashboard/library", label: "Bibliothèque", icon: BookMarked },
      { href: "/dashboard/prestataires", label: "Prestataires", icon: PrestatairesIcon },
      { href: "/dashboard/preferences", label: "Personnalisation & Thèmes", icon: Sliders },
      { href: "/dashboard/subscription", label: "Abonnement Wave", icon: CreditCard },
      { href: "/telechargement", label: "Application Mobile & APK", icon: Smartphone },
    ]},
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200/90 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur lg:hidden"
        style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
        aria-label="Navigation mobile"
      >
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 flex-col items-center justify-center rounded-2xl p-1.5 transition-all ${isActive ? "font-bold text-[#C05638]" : "text-stone-500 hover:text-stone-900"}`}
                style={isActive ? { color: activeTheme.primary } : {}}
              >
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="mt-0.5 max-w-20 truncate text-[10px]">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setIsFullMenuOpen(true)}
            className="flex min-w-0 flex-col items-center justify-center rounded-2xl p-1.5 text-stone-500 hover:text-stone-900"
            aria-label="Ouvrir toutes les sections"
          >
            <MenuIcon className="h-5 w-5" />
            <span className="mt-0.5 text-[10px]">Plus</span>
          </button>
        </div>
      </nav>

      {isFullMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Toutes les sections">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Fermer le menu" onClick={() => setIsFullMenuOpen(false)} />
          <div className="relative max-h-[85vh] space-y-6 overflow-y-auto rounded-t-3xl border-t border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">Toutes les sections</h3>
              <button type="button" onClick={() => setIsFullMenuOpen(false)} className="rounded-xl p-1 text-stone-400 hover:text-stone-700" aria-label="Fermer le menu"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-6">
              {fullDrawerLinks.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{section.title}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setIsFullMenuOpen(false)} className={`flex min-w-0 items-center gap-2.5 rounded-2xl border p-3 text-xs font-semibold transition-all ${isActive ? "border-[#C05638] bg-[#C05638] text-white" : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"}`} style={isActive ? { backgroundColor: activeTheme.primary } : {}}>
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
