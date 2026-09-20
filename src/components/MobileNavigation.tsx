"use client";

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

  // 5 Essential mobile bottom destinations
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
      { href: "/dashboard/preferences", label: "Personnalisation & Thèmes", icon: Sliders },
      { href: "/dashboard/subscription", label: "Abonnement Wave", icon: CreditCard },
      { href: "/telechargement", label: "Application Mobile & APK", icon: Smartphone },
    ]},
  ];

  return (
    <>
      {/* Fixed bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel border-t border-stone-200/90 py-1.5 px-3 shadow-lg">
        <div className="flex items-center justify-around">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all ${
                  isActive
                    ? "text-[#C05638] font-bold"
                    : "text-stone-500 hover:text-stone-900"
                }`}
                style={isActive ? { color: activeTheme.primary } : {}}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}

          {/* Plus / Menu Button */}
          <button
            onClick={() => setIsFullMenuOpen(true)}
            className="flex flex-col items-center justify-center p-1.5 rounded-2xl text-stone-500 hover:text-stone-900 cursor-pointer"
          >
            <MenuIcon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Plus</span>
          </button>
        </div>
      </nav>

      {/* Full Menu Drawer when clicking "Plus" */}
      {isFullMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-3xl border-t border-stone-200 p-6 max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-lg">Toutes les Sections</h3>
              <button
                onClick={() => setIsFullMenuOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {fullDrawerLinks.map((section, sIdx) => (
                <div key={sIdx} className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    {section.title}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsFullMenuOpen(false)}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-semibold border transition-all ${
                            isActive
                              ? "bg-[#C05638] text-white border-[#C05638]"
                              : "glass-card-warm border-stone-200 text-stone-700 hover:bg-stone-50"
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}

