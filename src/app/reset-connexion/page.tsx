"use client";
import { useState } from "react";
export default function ResetPage(){
  const [pwd,setPwd]=useState(""); const [msg,setMsg]=useState("");
  const submit = async()=>{
    const auth = new URLSearchParams(window.location.search).get("auth");
    if(!auth) return setMsg("Lien invalide");
    const r = await fetch("/api/admin/users/reset-login",{method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action:"reset", token: decodeURIComponent(auth), newPassword: pwd})});
    const j = await r.json(); setMsg(j.message);
  };
  return (<main style={{maxWidth:420, margin:"0 auto", padding:"24px 16px", display:"grid", gap:12}}>
    <h1 style={{fontWeight:800}}>Reset connexion chiffré</h1>
    <div style={{fontSize:13, color:"var(--wm-text-soft)"}}>Lien généré par admin, chiffré AES-256, valable 24h.</div>
    <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Nouveau mot de passe" style={{padding:12, border:"1px solid #d6d3d1", borderRadius:10}} />
    <button onClick={submit} style={{padding:12, background:"#16a34a", color:"#fff", borderRadius:10, border:0, fontWeight:700}}>Réinitialiser</button>
    {msg && <div style={{padding:10, background:"#F0FDF4", borderRadius:8, fontSize:13}}>{msg}</div>}
  </main>);
}