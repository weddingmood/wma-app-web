"use client"; import { useEffect, useState } from "react"; import FileUpload from "@/components/admin/FileUpload";
export default function Page(){
  const [list,setList]=useState<any[]>([]); const [form,setForm]=useState<any>({name:"",logo_url:"",website_url:"",video_url:"",type:"logo",order_index:0,is_active:true});
  async function load(){ const r=await fetch("/api/admin/partenaires"); const j=await r.json(); setList(j.partenaires||[]); }
  useEffect(()=>{load();},[]);
  async function save(){ await fetch("/api/admin/partenaires",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); setForm({name:"",logo_url:"",website_url:"",video_url:"",type:"logo",order_index:0,is_active:true}); load(); }
  return (<div className="p-6 space-y-6">
    <div><h1 className="text-2xl font-bold text-[#800020]">Partenaires - Barre Logos Footer</h1><p className="text-sm text-gray-500 mt-1">Cette section alimente la <b>barre défilante des partenaires</b> visible en bas de l&apos;app. Ajoutez le logo depuis votre disque, pas besoin d&apos;URL.</p></div>
    <div className="bg-white p-4 rounded-xl border space-y-4">
      <div><input className="w-full border p-2 rounded" placeholder="Nom du partenaire - ex: Hôtel Ivoire" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><p className="text-[11px] text-gray-400">Nom interne pour vous repérer.</p></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-semibold">Type</label><select className="w-full border p-2 rounded mt-1" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{["logo","document","video"].map(t=><option key={t} value={t}>{t==="logo"?"Logo Image":t==="document"?"Document PDF/Image":"Vidéo YouTube"}</option>)}</select><p className="text-[11px] text-gray-400 mt-1">Logo = image, Document = PDF à afficher, Vidéo = lien YouTube.</p></div>
        <div><label className="text-xs font-semibold">Ordre d&apos;affichage</label><input className="w-full border p-2 rounded mt-1" type="number" value={form.order_index} onChange={e=>setForm({...form,order_index:Number(e.target.value)})}/><p className="text-[11px] text-gray-400 mt-1">0 = premier à gauche.</p></div>
      </div>
      {form.type!=="video"? <FileUpload label="Logo / Document - Cliquez pour choisir depuis disque" folder="partenaires" accept="image/*,.pdf,.doc,.docx" value={form.logo_url} onUploaded={url=>setForm({...form,logo_url:url})}/> : <div><input className="w-full border p-2 rounded" placeholder="Lien YouTube - ex: https://youtu.be/..." value={form.video_url} onChange={e=>setForm({...form,video_url:e.target.value})}/><p className="text-[11px] text-gray-400 mt-1">Uniquement si vous avez choisi Vidéo. Collez le lien YouTube.</p></div>}
      <div><input className="w-full border p-2 rounded" placeholder="Site web du partenaire (optionnel) - https://..." value={form.website_url} onChange={e=>setForm({...form,website_url:e.target.value})}/><p className="text-[11px] text-gray-400 mt-1">Si rempli, le logo sera cliquable vers ce site.</p></div>
      <button onClick={save} className="bg-[#D4AF37] text-white px-6 py-2 rounded font-bold">Ajouter Partenaire</button>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{list.map((p:any)=><div key={p.id} className="bg-white border rounded-xl p-2 text-center"><img src={p.logo_url||p.logo} className="h-16 mx-auto object-contain"/><p className="text-xs mt-1">{p.name}</p></div>)}</div>
  </div>);
}