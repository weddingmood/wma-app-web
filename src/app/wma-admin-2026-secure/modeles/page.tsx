"use client"; import { useEffect, useState } from "react";
const TYPES=["traditionnel","moderne","petit-budget","grand-standing","mixte","royal"];
export default function Page(){
  const [list,setList]=useState<any[]>([]); const [form,setForm]=useState<any>({type:"traditionnel",title:"",description:"",cover_image:"",video_entree_url:"",video_ballet_url:"",order_index:0,checklist:[],musiques:[]});
  const [checkInput,setCheckInput]=useState(""); const [musiqueInput,setMusiqueInput]=useState("");
  async function load(){ const r=await fetch("/api/admin/modeles"); const j=await r.json(); setList(j.modeles||[]); }
  useEffect(()=>{load();},[]);
  async function save(){ await fetch("/api/admin/modeles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); setForm({type:"traditionnel",title:"",description:"",cover_image:"",video_entree_url:"",video_ballet_url:"",order_index:0,checklist:[],musiques:[]}); load(); }
  return (<div className="p-6 space-y-6"><h1 className="text-2xl font-bold text-[#800020]">Modèles Mariage - 6 types</h1>
  <div className="bg-white p-4 rounded-xl border space-y-3">
    <div className="grid grid-cols-2 gap-2"><select className="border p-2 rounded" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select><input type="number" className="border p-2 rounded" placeholder="Ordre" value={form.order_index} onChange={e=>setForm({...form,order_index:Number(e.target.value)})}/></div>
    <input className="w-full border p-2 rounded" placeholder="Titre modèle" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
    <textarea className="w-full border p-2 rounded" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
    <input className="w-full border p-2 rounded" placeholder="Cover Image URL Storage" value={form.cover_image} onChange={e=>setForm({...form,cover_image:e.target.value})}/>
    <div className="grid grid-cols-2 gap-2"><input className="border p-2 rounded" placeholder="Vidéo Entrée YouTube" value={form.video_entree_url} onChange={e=>setForm({...form,video_entree_url:e.target.value})}/><input className="border p-2 rounded" placeholder="Vidéo Ballet YouTube" value={form.video_ballet_url} onChange={e=>setForm({...form,video_ballet_url:e.target.value})}/></div>
    <div className="border p-2 rounded space-y-2"><p className="font-semibold">Checklist</p><div className="flex gap-2"><input className="flex-1 border p-2 rounded" value={checkInput} onChange={e=>setCheckInput(e.target.value)} placeholder="Ajouter item"/><button onClick={()=>{setForm({...form,checklist:[...form.checklist,checkInput]}); setCheckInput("");}} className="bg-gray-200 px-3 rounded">+</button></div><p className="text-xs">{form.checklist.join(", ")}</p></div>
    <div className="border p-2 rounded space-y-2"><p className="font-semibold">Musiques (YouTube ou titre)</p><div className="flex gap-2"><input className="flex-1 border p-2 rounded" value={musiqueInput} onChange={e=>setMusiqueInput(e.target.value)} placeholder="Ajouter musique"/><button onClick={()=>{setForm({...form,musiques:[...form.musiques,musiqueInput]}); setMusiqueInput("");}} className="bg-gray-200 px-3 rounded">+</button></div><p className="text-xs">{form.musiques.join(", ")}</p></div>
    <button onClick={save} className="bg-[#D4AF37] text-white px-6 py-2 rounded">Ajouter Modèle</button>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{list.map(m=><div key={m.id} className="bg-white border rounded-xl overflow-hidden"><img src={m.cover_image} className="h-40 w-full object-cover"/><div className="p-2"><b>{m.title}</b><br/><span className="text-xs bg-[#800020] text-white px-2 py-0.5 rounded">{m.type}</span></div></div>)}</div></div>);
}