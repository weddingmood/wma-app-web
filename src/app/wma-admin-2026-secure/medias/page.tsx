"use client"; import { useEffect, useState } from "react"; import FileUpload from "@/components/admin/FileUpload";
const TYPES=["chanson","danses","videos_mariage","videos_ceremonie"];
export default function Page(){
  const [list,setList]=useState<any[]>([]); const [form,setForm]=useState<any>({type:"chanson",title:"",description:"",youtube_url:"",storage_url:"",thumbnail_url:"",country_ids:[],order_index:0,is_active:true});
  async function load(){ const r=await fetch("/api/admin/medias"); const j=await r.json(); setList(j.medias||[]); }
  useEffect(()=>{load();},[]);
  async function save(){ await fetch("/api/admin/medias",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); setForm({type:"chanson",title:"",description:"",youtube_url:"",storage_url:"",thumbnail_url:"",country_ids:[],order_index:0,is_active:true}); load(); }
  return (<div className="p-6 space-y-6">
    <div><h1 className="text-2xl font-bold text-[#800020]">Médias YouTube & Bibliothèque</h1><p className="text-sm text-gray-500 mt-1">Ajoutez vos chansons et vidéos. Le système limite à <b>8 par pays</b> automatiquement. Utilisez YouTube pour les vidéos publiques, et Storage pour vos fichiers privés.</p></div>
    <div className="bg-white p-4 rounded-xl border space-y-4">
      <div><label className="text-xs font-semibold">Type de média *</label><select className="w-full border p-2 rounded mt-1" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select><p className="text-[11px] text-gray-400 mt-1">Choisissez la catégorie. Ex: chanson = entrée des mariés, danses = ballet.</p></div>
      <div className="grid grid-cols-2 gap-2"><div><input className="w-full border p-2 rounded" placeholder="Titre - ex: Entrée Traditionnelle" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><p className="text-[11px] text-gray-400">Titre visible par les couples.</p></div><input type="number" className="border p-2 rounded" placeholder="Ordre 0 = premier" value={form.order_index} onChange={e=>setForm({...form,order_index:Number(e.target.value)})}/></div>
      <div><textarea className="w-full border p-2 rounded" placeholder="Description courte" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><p className="text-[11px] text-gray-400">Petite description pour guider le couple.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><input className="w-full border p-2 rounded" placeholder="Lien YouTube - ex: https://youtu.be/..." value={form.youtube_url} onChange={e=>setForm({...form,youtube_url:e.target.value})}/><p className="text-[11px] text-gray-400 mt-1">Collez le lien YouTube si vidéo publique. Laisser vide si fichier privé.</p></div>
        <FileUpload label="OU Fichier depuis disque (Storage privé)" folder="medias" accept="video/*,audio/*" value={form.storage_url} onUploaded={url=>setForm({...form,storage_url:url})}/>
      </div>
      <FileUpload label="Miniature / Thumbnail (image disque)" folder="medias/thumbs" accept="image/*" value={form.thumbnail_url} onUploaded={url=>setForm({...form,thumbnail_url:url})}/>
      <button onClick={save} className="bg-[#D4AF37] text-white px-6 py-2 rounded font-bold">Ajouter Média</button>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{list.map((m:any)=><div key={m.id} className="bg-white border rounded-xl overflow-hidden"><img src={m.thumbnail_url} className="h-24 w-full object-cover bg-gray-100"/><div className="p-2 text-xs"><b>{m.title}</b><br/>{m.type}</div></div>)}</div>
  </div>);
}