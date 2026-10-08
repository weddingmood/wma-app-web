"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Store, Gamepad2, BookMarked, Star, Handshake, Video, Building2, FileText, Crown, UtensilsCrossed, Wallet, History, Settings } from "lucide-react";

const MENU = [
  { href: "/wma-admin-2026-secure", label: "Tableau de Bord", Icon: LayoutDashboard, exact: true },
  { href: "/wma-admin-2026-secure", label: "Couples & Premium", Icon: Users, tab: "couples" },
  { href: "/wma-admin-2026-secure", label: "Paiements Wave", Icon: CreditCard, tab: "payments" },
  { href: "/wma-admin-2026-secure", label: "Prestataires", Icon: Store, tab: "providers" },
  { href: "/wma-admin-2026-secure", label: "Jeux & Activités", Icon: Gamepad2, tab: "games" },
  { href: "/wma-admin-2026-secure/bibliotheque", label: "Bibliothèque", Icon: BookMarked },
  { href: "/wma-admin-2026-secure/temoignages", label: "Témoignages", Icon: Star },
  { href: "/wma-admin-2026-secure/ambassadeurs", label: "Ambassadeurs", Icon: Handshake },
  { href: "/wma-admin-2026-secure/medias", label: "Médias YouTube", Icon: Video },
  { href: "/wma-admin-2026-secure/partenaires", label: "Partenaires", Icon: Building2 },
  { href: "/wma-admin-2026-secure/contenu", label: "Contenu & Footer", Icon: FileText },
  { href: "/wma-admin-2026-secure/modeles", label: "Modèles Mariage", Icon: Crown },
  { href: "/wma-admin-2026-secure/menus", label: "Menus Africains", Icon: UtensilsCrossed },
  { href: "/wma-admin-2026-secure/payouts", label: "Payouts Ambassadeur", Icon: Wallet },
  { href: "/wma-admin-2026-secure", label: "Journal d'audit", Icon: History, tab: "audit" },
  { href: "/wma-admin-2026-secure", label: "Paramètres", Icon: Settings, tab: "settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }){
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-[#800020] text-white p-4 space-y-1 overflow-y-auto">
        <h2 className="text-xl font-bold mb-6 tracking-wide">WMA Admin</h2>
        {MENU.map(m=>{
          const active = m.exact ? pathname===m.href : pathname.startsWith(m.href) && !m.tab;
          const href = (m as any).tab ? `${m.href}?tab=${(m as any).tab}` : m.href;
          const Icon = m.Icon;
          return (
            <Link key={m.label+m.href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-white/10 transition ${active?'bg-white/15 font-semibold':''}`}>
              <Icon size={18} /> {m.label}
            </Link>
          );
        })}
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}