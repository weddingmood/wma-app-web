"use client"
import { useState } from "react"
import { Save, Eye, Palette, MapPin, Utensils, Heart, Calendar, Upload } from "lucide-react"

export default function CarteInvitationPage() {
  const [photo, setPhoto] = useState("https://images.unsplash.com/photo-1519741497674-611481863552?w=800")
  const [couple, setCouple] = useState("Yves & Rapha")
  const [date, setDate] = useState("Samedi 15 Novembre 2025")
  const [lieu, setLieu] = useState("Hôtel Président, Yamoussoukro")

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b sticky top-0 z-10 px-4 md:px-6 py-4 flex justify-between items-center rounded-b-[20px]">
        <div>
          <h1 className="font-serif font-bold text-lg">Carte d'invitation</h1>
          <p className="text-xs text-gray-500">Faire-part numérique</p>
        </div>
        <button className="px-5 py-2.5 rounded-full bg-[#C05638] text-white text-sm font-bold flex items-center gap-2">
          <Save className="w-4 h-4"/> Enregistrer
        </button>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6 p-4 md:p-6">
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border p-5">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-4"><Palette className="w-4 h-4 text-[#C05638]"/> Visuel</h3>
            <div className="rounded-[20px] overflow-hidden border-2 border-dashed relative">
              <img src={photo} className="w-full h-[260px] object-cover"/>
              <label className="absolute bottom-3 right-3 bg-white px-4 py-2 rounded-full text-xs font-bold shadow cursor-pointer">
                <Upload className="w-4 h-4 inline mr-1"/> Modifier
                <input type="file" className="hidden" onChange={e=>{ if(e.target.files?.[0]) setPhoto(URL.createObjectURL(e.target.files[0])) }}/>
              </label>
            </div>
          </div>
          <div className="bg-white rounded-[24px] border p-5 space-y-3">
            <h3 className="font-bold text-sm"><Heart className="w-4 h-4 inline mr-2"/>Infos</h3>
            <input value={couple} onChange={e=>setCouple(e.target.value)} className="w-full p-3.5 rounded-xl bg-gray-50 border text-sm" placeholder="Couple"/>
            <input value={date} onChange={e=>setDate(e.target.value)} className="w-full p-3.5 rounded-xl bg-gray-50 border text-sm" placeholder="Date"/>
            <input value={lieu} onChange={e=>setLieu(e.target.value)} className="w-full p-3.5 rounded-xl bg-gray-50 border text-sm" placeholder="Lieu"/>
          </div>
          <div className="bg-white rounded-[24px] border p-5 space-y-3">
            <h3 className="font-bold text-sm"><Utensils className="w-4 h-4 inline mr-2"/>Menu</h3>
            <input className="w-full p-3 rounded-xl bg-gray-50 border text-sm" placeholder="Entrée"/>
            <input className="w-full p-3 rounded-xl bg-gray-50 border text-sm" placeholder="Plat principal"/>
            <input className="w-full p-3 rounded-xl bg-gray-50 border text-sm" placeholder="Dessert"/>
            <label className="flex gap-2 text-xs pt-2"><input type="checkbox" defaultChecked/> Demander allergies</label>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border p-6 md:p-8 h-fit">
          <span className="text-[10px] uppercase tracking-widest font-bold bg-stone-100 px-3 py-1.5 rounded-full">Aperçu direct</span>
          <div className="mt-6 rounded-[24px] overflow-hidden"><img src={photo} className="w-full h-[380px] object-cover"/></div>
          <h2 className="font-serif text-3xl font-bold mt-6 text-center">{couple}</h2>
          <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-2"><Calendar className="w-4 h-4"/>{date}</p>
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2"><MapPin className="w-4 h-4"/>{lieu}</p>
        </div>
      </div>
    </div>
  )
}