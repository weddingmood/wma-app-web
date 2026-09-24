"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Heart, Users, Wallet, 
  Calendar, Mail, Send, ListChecks, BookHeart,
  MessageCircle, Gamepad2, Clock, Settings, CreditCard
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/notre-mariage", label: "Profils & Mariage", icon: Heart },
  { href: "/dashboard/guests", label: "Invités & RSVP", icon: Users },
  { href: "/dashboard/cagnotte", label: "Cagnotte", icon: Wallet },
  { href: "/dashboard/budget", label: "Budget", icon: CreditCard },
  { href: "/dashboard/chronogramme", label: "Planning", icon: Clock },
  { href: "/dashboard/calendar", label: "Calendrier", icon: Calendar },
  { href: "/dashboard/invitation", label: "Carte d'invitation", icon: Mail },
  { href: "/dashboard/chat", label: "Transfert WhatsApp", icon: Send },
  { href: "/dashboard/tasks", label: "Tâches", icon: ListChecks },
  { href: "/dashboard/jour-j", label: "Jour J", icon: BookHeart },
  { href: "/dashboard/jeux", label: "Jeux Couple", icon: Gamepad2 },
  { href: "/dashboard/profile", label: "Profil", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-white border-r min-h-screen p-3 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
            ${active ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100"}`}>
            <Icon size={18} /> {item.label}
          </Link>
        );
      })}
    </aside>
  );
}