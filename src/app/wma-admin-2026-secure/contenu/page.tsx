"use client"; import { useEffect, useState } from "react"; import FileUpload from "@/components/admin/FileUpload";
export default function Page(){
  const [contents,setContents]=useState<any[]>([]); const [form,setForm]=useState<any>({key:"header_video",title:"",content:"",media_url:"",is_active:true});
  async function load(){
    try{ const r=await fetch("/api/admin/site-contents"); const j=await r.json(); setContents(j.contents||j||[]); }
    catch{ const r2=await fetch("/api/site-contents"); const j2=await r2.json().catch(()=>({})); setContents(j2.contents||j2||[]); }
  }
  useEffect(()=>{load();},[]);
  async function save(){
    try{ await fetch("/api/admin/site-contents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); }
    catch{ await fetch("/api/site-contents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); }
    load();
  }
  return (<div className="p-6 space-y-6">
    <div><h1 className="text-2xl font-bold text-[#800020]">Contenu & Footer</h1><p className="text-sm text-gray-500 mt-1">Gérez la <b>vidéo d&apos;en-tête (loop)</b> de la page d&apos;accueil et les textes du footer. Choisissez le fichier depuis votre disque.</p></div>
    <div className="bg-white p-4 rounded-xl border space-y-4">
      <div><label className="text-xs font-semibold">Clé *</label><select className="w-full border p-2 rounded mt-1" value={form.key} onChange={e=>setForm({...form,key:e.target.value})}><option value="header_video">Vidéo En-tête (loop accueil)</option><option value="footer_about">Footer - À propos</option><option value="footer_contact">Footer - Contact</option><option value="footer_legal">Footer - Mentions légales</option><option value="footer_social">Footer - Réseaux sociaux</option></select><p className="text-[11px] text-gray-400 mt-1">header_video = vidéo qui tourne en boucle en haut de la landing page.</p></div>
      <div><input className="w-full border p-2 rounded" placeholder="Titre" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><p className="text-[11px] text-gray-400">Titre interne.</p></div>
      <div><textarea className="w-full border p-2 rounded h-24" placeholder="Texte / contenu HTML" value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/><p className="text-[11px] text-gray-400">Pour le footer, écrivez le texte qui s&apos;affichera.</p></div>
      <FileUpload label="Média - Vidéo ou Image depuis disque (pour header_video)" folder="contenu" accept="video/*,image/*" value={form.media_url} onUploaded={url=>setForm({...form,media_url:url})}/>
      <button onClick={save} className="bg-[#D4AF37] text-white px-6 py-2 rounded font-bold">Enregistrer Contenu</button>
    </div>
    <div className="space-y-2">{contents.map((c:any)=><div key={c.id||c.key} className="bg-white border rounded p-2 text-sm"><b>{c.key}</b> - {c.title}</div>)}</div>
  </div>);
}