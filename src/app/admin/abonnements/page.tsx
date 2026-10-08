"use client";
import { useEffect, useState } from "react";
export default function AbonnementsPage(){
  const [list,setList]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [links,setLinks]=useState<Record<string,string>>({});

  const load = async()=>{
    try{
      const r = await fetch("/api/admin/stats",{cache:"no-store"});
      const j = await r.json();
      setList(j.recentCouples || j.couples || []);
    }catch{} finally{ setLoading(false); }
  };
  useEffect(()=>{ load(); },[]);

  const fix5ans = async()=>{
    if(!confirm("Passer tous les actifs en 5 ans (3000F = 5 ans) ?")) return;
    const r = await fetch("/api/admin/subscriptions/fix-5ans", {method:"POST"});
    const j = await r.json();
    alert(j.message || "Fait"); location.reload();
  };

  const genReset = async(userId:number, email:string)=>{
    if(!confirm(`Générer lien reset chiffré 24h pour ${email} ?`)) return;
    const r = await fetch("/api/admin/users/reset-login",{method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({userId, action:"generate"})});
    const j = await r.json();
    if(j.success){
      const fullLink = window.location.origin + j.link;
      setLinks(prev=>({...prev, [userId]: fullLink}));
      navigator.clipboard.writeText(fullLink).catch(()=>{});
      alert("Lien copié: "+fullLink);
    } else alert(j.message);
  };

  if(loading) return <main style={{padding:24}}>Chargement abonnements...</main>;
  return (
    <main style={{maxWidth:900, margin:"0 auto", padding:"24px 16px"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap"}}>
        <h1 style={{fontSize:20,fontWeight:800}}>Abonnements - 5 ans (3000F unique)</h1>
        <button onClick={fix5ans} style={{padding:"10px 14px", background:"#16a34a", color:"#fff", borderRadius:10, border:0, fontWeight:700, fontSize:13}}>Corriger tout en 5 ans</button>
      </div>
      <div style={{marginTop:12, fontSize:13, color:"#57534e", padding:10, background:"#FFFBEB", borderRadius:10, border:"1px solid #D4AF37"}}>
        1 utilisateur = 1 code unique (mail + nom + contact). 3000F = 5 ans. Reset connexion = autorisation chiffrée AES-256 valable 24h.
      </div>
      <div style={{marginTop:16, display:"grid", gap:10}}>
        {list.map((c:any,i:number)=>{
          const exp = c.expires_at ? new Date(c.expires_at) : null;
          const isActive = c.status==="active" || c.subscription_status==="active";
          const uid = c.id || c.user_id;
          return (
            <div key={i} style={{padding:12, border:"1px solid #e7e5e4", borderRadius:12, background:"#fff", display:"grid", gap:8}}>
              <div style={{display:"flex", justifyContent:"space-between", gap:8}}>
                <div>
                  <div style={{fontWeight:700, fontSize:13}}>{c.couple_name || c.email} - {c.email}</div>
                  <div style={{fontSize:11, color:"#78716c"}}>{c.phone || c.contact} • Code: {c.code_unique || c.id}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700, fontSize:12, color: isActive ? "#15803d" : "#dc2626"}}>{isActive ? "Actif 5 ans" : c.status}</div>
                  <div style={{fontSize:11}}>{exp ? "Jusqu'au "+exp.toLocaleDateString("fr-FR") : "Pas de date"}</div>
                </div>
              </div>
              <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                <button onClick={()=>genReset(Number(uid), c.email)} style={{padding:"8px 10px", background:"#000", color:"#fff", borderRadius:8, border:0, fontSize:12, fontWeight:600}}>🔐 Générer lien reset</button>
                {links[uid] && <div style={{fontSize:11, background:"#F0FDF4", padding:"6px 8px", borderRadius:6, wordBreak:"break-all", flex:1}}>{links[uid]}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}