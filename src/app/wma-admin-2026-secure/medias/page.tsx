"use client"; import { useEffect, useState } from "react";
type Media = {id:string,youtube_url:string,youtube_id:string,category:string,title:string,order_index:number,is_featured:boolean,is_active:boolean};
const CATS=["entree-maries","ballet-danse","chants-dansants","sortie-eglise","musique-ambiance","deco-salle","tenue-traditionnelle","photographie"];
export default function Page(){
  const [list,setList]=useState<Media[]>([]); const [form,setForm]=useState<any>({youtube_url:"",category:"ballet-danse",title:"",order_index:0,is_featured:false});
  async function load(){ const r=await fetch("/api/admin/medias"); const j=await r.json(); setList(j.medias||[]); }
  useEffect(()=>{load();},[]);
  async function save(){ await fetch("/api/admin/medias",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); setForm({youtube_url:"",category:"ballet-danse",title:"",order_index:0,is_featured:false}); load(); }
  return (<div className="p-6 space-y-6"><h1 className="text-2xl font-bold text-[#800020]">Médias YouTube - Lecture directe</h1>
  <div className="bg-white p-4 rounded-xl border space-y-3"><input className="w-full border p-2 rounded" placeholder="https://youtube.com/watch?v=..." value={form.youtube_url} onChange={e=>setForm({...form,youtube_url:e.target.value})}/>
  <div className="grid grid-cols-2 gap-2"><input className="border p-2 rounded" placeholder="Titre" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><select className="border p-2 rounded" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
  <div className="flex gap-2"><input type="number" className="border p-2 rounded" value={form.order_index} onChange={e=>setForm({...form,order_index:Number(e.target.value)})}/><label className="flex items-center gap-1"><input type="checkbox" checked={form.is_featured} onChange={e=>setForm({...form,is_featured:e.target.checked})}/> Featured</label><button onClick={save} className="bg-[#D4AF37] text-white px-4 py-2 rounded">Ajouter</button></div></div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{list.map(m=><div key={m.id} className="bg-white border rounded-xl overflow-hidden"><img src={`https://img.youtube.com/vi/${m.youtube_id}/mqdefault.jpg`} alt=""/><div className="p-2 text-sm"><b>{m.title||m.youtube_id}</b><br/>{m.category} #{m.order_index}</div></div>)}</div></div>);
}