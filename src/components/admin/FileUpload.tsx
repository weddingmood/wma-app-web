"use client"; import { useState } from "react";
export default function FileUpload({ label, accept, folder, value, onUploaded }:{label:string, accept?:string, folder:string, value?:string, onUploaded:(url:string)=>void}){
  const [loading,setLoading]=useState(false); const [preview,setPreview]=useState(value||"");
  async function handleFile(e:any){
    const file=e.target.files?.[0]; if(!file) return;
    setLoading(true);
    const fd=new FormData(); fd.append("file",file); fd.append("folder",folder);
    const res=await fetch("/api/admin/upload",{method:"POST",body:fd});
    const j=await res.json();
    if(j.success){ setPreview(j.url); onUploaded(j.url); } else { alert(j.message||"Upload échoué"); }
    setLoading(false);
  }
  return (
    <div className="border border-dashed p-3 rounded-xl bg-gray-50 space-y-2">
      <p className="text-xs font-semibold">{label}</p>
      <input type="file" accept={accept||"*/*"} onChange={handleFile} className="w-full text-xs border p-1 rounded bg-white" />
      {loading && <p className="text-[11px] text-orange-600">Upload en cours...</p>}
      {preview && (preview.match(/\.(mp4|webm|mov)$/i)? <video src={preview} className="h-28 rounded" controls/> : preview.match(/\.(jpg|jpeg|png|webp|gif)$/i)? <img src={preview} className="h-28 object-contain rounded border bg-white"/> : <a href={preview} target="_blank" className="text-[11px] text-blue-600 break-all">{preview}</a>)}
    </div>
  );
}