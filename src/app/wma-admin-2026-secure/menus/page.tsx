"use client"; import { useEffect, useState } from "react";
const SERVINGS=[100,200,300,400,500,1000];
export default function Page(){
  const [list,setList]=useState<any[]>([]); const [countries,setCountries]=useState<any[]>([]);
  const [form,setForm]=useState<any>({name:"",servings:100,dishes:[],cover_image:"",country_id:"",currency:"XOF",order_index:0});
  const [dish,setDish]=useState({name:"",quantity:1,unit_price:0});
  async function load(){ const r=await fetch("/api/admin/menus"); const j=await r.json(); setList(j.menus||[]); const rc=await fetch("/api/admin/countries" as any).catch(()=>null); if(rc){ const jc=await rc.json().catch(()=>({})); setCountries(jc.countries||[]); } }
  useEffect(()=>{load();},[]);
  const total=form.dishes.reduce((s:number,d:any)=>s+d.quantity*d.unit_price,0);
  async function save(){ await fetch("/api/admin/menus",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form})}); setForm({name:"",servings:100,dishes:[],cover_image:"",country_id:"",currency:"XOF",order_index:0}); load(); }
  return (<div className="p-6 space-y-6"><h1 className="text-2xl font-bold text-[#800020]">Menus Africains - par 100 à 1000</h1>
  <div className="bg-white p-4 rounded-xl border space-y-3">
    <div className="grid grid-cols-3 gap-2"><input className="border p-2 rounded" placeholder="Nom menu" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><select className="border p-2 rounded" value={form.servings} onChange={e=>setForm({...form,servings:Number(e.target.value)})}>{SERVINGS.map(s=><option key={s} value={s}>{s} pers</option>)}</select><input className="border p-2 rounded" placeholder="Devise" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}/></div>
    <input className="w-full border p-2 rounded" placeholder="Cover Image Storage" value={form.cover_image} onChange={e=>setForm({...form,cover_image:e.target.value})}/>
    <div className="border p-3 rounded space-y-2"><p className="font-semibold">Plats / Dishes - total auto: {total} {form.currency}</p><div className="grid grid-cols-4 gap-2"><input className="border p-2 rounded" placeholder="Nom plat" value={dish.name} onChange={e=>setDish({...dish,name:e.target.value})}/><input type="number" className="border p-2 rounded" placeholder="Qté" value={dish.quantity} onChange={e=>setDish({...dish,quantity:Number(e.target.value)})}/><input type="number" className="border p-2 rounded" placeholder="Prix unit" value={dish.unit_price} onChange={e=>setDish({...dish,unit_price:Number(e.target.value)})}/><button onClick={()=>{setForm({...form,dishes:[...form.dishes,dish]}); setDish({name:"",quantity:1,unit_price:0});}} className="bg-gray-200 rounded">+ Ajouter</button></div><ul className="text-xs">{form.dishes.map((d:any,i:number)=><li key={i}>{d.name} x{d.quantity} @ {d.unit_price} = {d.quantity*d.unit_price}</li>)}</ul></div>
    <button onClick={save} className="bg-[#D4AF37] text-white px-6 py-2 rounded">Enregistrer Menu {total>0?`(${total} ${form.currency})`:""}</button>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{list.map(m=><div key={m.id} className="bg-white border rounded-xl overflow-hidden"><img src={m.cover_image} className="h-32 w-full object-cover"/><div className="p-2 text-sm"><b>{m.name}</b> - {m.servings} pers<br/>{m.total_price} {m.currency}</div></div>)}</div></div>);
}