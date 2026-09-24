"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Heart, Users, Wallet, PiggyBank, Calendar, Clock, Mail, Send, CheckSquare, PartyPopper, Gamepad2, Settings, Menu, X } from "lucide-react"

const MENU = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/profils", label: "Profils & Mariage", icon: Heart },
  { href: "/invites", label: "Invités & RSVP", icon: Users },
  { href: "/cagnotte", label: "Cagnotte", icon: PiggyBank },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/planning", label: "Planning", icon: Clock },
  { href: "/calendrier", label: "Calendrier", icon: Calendar },
  { href: "/carte-invitation", label: "Carte d'invitation", icon: Mail },
  { href: "/whatsapp", label: "Transfert WhatsApp", icon: Send },
  { href: "/taches", label: "Tâches", icon: CheckSquare },
  { href: "/jour-j", label: "Jour J", icon: PartyPopper },
  { href: "/jeux", label: "Jeux Couple", icon: Gamepad2 },
  { href: "/profil", label: "Profil", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-[#fcfaf8] flex">
      <aside className={`fixed md:sticky top-0 z-40 h-screen w-[280px] bg-white border-r flex flex-col transition-transform duration-300 ${open? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-6 flex justify-between items-center border-b">
          <h1 className="font-serif font-bold text-lg">Wedding Mood</h1>
          <button onClick={()=>setOpen(false)} className="md:hidden"><X className="w-5 h-5"/></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {MENU.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={()=>setOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${active? "bg-[#f3e8ff] text-[#9333ea] font-bold" : "text-gray-600 hover:bg-gray-50"}`}>
                <item.icon className="w-5 h-5"/>{item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      {open && <div onClick={()=>setOpen(false)} className="fixed inset-0 bg-black/30 z-30 md:hidden"/>}
      <main className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 z-20 bg-white border-b p-4 flex items-center gap-3">
          <button onClick={()=>setOpen(true)} className="p-2 rounded-xl bg-gray-100"><Menu className="w-5 h-5"/></button>
          <span className="font-bold">Wedding Mood</span>
        </div>
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  )
}