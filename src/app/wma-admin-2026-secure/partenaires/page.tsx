"use client"; import { useEffect, useState } from "react";
export default function Page(){
  const [list,setList]=useState<any[]>([]); const [form,setForm]=useState({name:"",logo_url:"",website:"",order_index:0});
  async function load(){ const r=await fetch("/api/admin/partenaires"); const j=await r.json(); setList(j.partenaires||[]); }
  useEffect(()=>{load();},[]);
  async function save(){ await fetch("/api/admin/partenaires",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); setForm({name:"",logo_url:"",website:"",order_index:0}); load(); }
  return (<div className="p-6 space-y-6"><h1 className="text-2xl font-bold text-[#800020]">Partenaires - Barre logos</h1>
  <div className="bg-white p-4 rounded-xl border space-y-2"><input className="w-full border p-2 rounded" placeholder="Nom" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input className="w-full border p-2 rounded" placeholder="Logo URL Storage" value={form.logo_url} onChange={e=>setForm({...form,logo_url:e.target.value})}/><input className="w-full border p-2 rounded" placeholder="Site web" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/><div className="flex gap-2"><input type="number" className="border p-2 rounded" value={form.order_index} onChange={e=>setForm({...form,order_index:Number(e.target.value)})}/><button onClick={save} className="bg-[#D4AF37] px-4 py-2 rounded text-white">Ajouter</button></div></div>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{list.map(p=><div key={p.id} className="bg-white border p-3 rounded-xl"><img src={p.logo_url} className="h-12 object-contain"/><p className="text-sm mt-2">{p.name}</p></div>)}</div></div>);
}