"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";

type Book = { id: number; title: string; author: string; category: string; fileUrl: string | null };

const CATEGORIES = [
  { v: "mariage", l: "Mariage" },
  { v: "communication", l: "Communication" },
  { v: "finances", l: "Finances" },
  { v: "purete", l: "Puret\u00e9" },
  { v: "priere", l: "Pri\u00e8re" },
  { v: "documents", l: "Documents pratiques" },
];

export default function AdminBibliothequePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("mariage");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/library", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) setBooks(data.books as Book[]);
      else setMsg(data.message || "Connectez-vous d'abord \u00e0 l'espace admin.");
    } catch {
      setMsg("Connexion indisponible.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!title.trim() || !author.trim() || !description.trim() || !file) {
      setMsg("Titre, auteur, description et fichier sont obligatoires.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const main = await upload("library/" + file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/library/upload",
      });
      let coverUrl = "";
      if (cover) {
        const c = await upload("library/covers/" + cover.name, cover, {
          access: "public",
          handleUploadUrl: "/api/admin/library/upload",
        });
        coverUrl = c.url;
      }
      const res = await fetch("/api/admin/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, category, description, fileUrl: main.url, coverUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "\u00c9chec de l'enregistrement.");
      setTitle("");
      setAuthor("");
      setDescription("");
      setFile(null);
      setCover(null);
      setMsg("Document ajout\u00e9 \u2714");
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "\u00c9chec de l'envoi.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Supprimer ce document ?")) return;
    const res = await fetch("/api/admin/library?id=" + id, { method: "DELETE" });
    if (res.ok) load();
    else setMsg("Suppression impossible.");
  };

  const box = { padding: 16, border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff", display: "grid", gap: 12 } as const;
  const input = { width: "100%", padding: "8px 10px", border: "1px solid #d6d3d1", borderRadius: 10, fontSize: 14 } as const;
  const lab = { fontSize: 12, fontWeight: 600, display: "grid", gap: 4 } as const;

  return (
    <div style={{ display: "grid", gap: 16, padding: 16, paddingBottom: 64, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{"Biblioth\u00e8que : d\u00e9poser un livre ou un document"}</h1>

      <div style={box}>
        <label style={lab}>{"Titre"}<input style={input} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label style={lab}>{"Auteur"}<input style={input} value={author} onChange={(e) => setAuthor(e.target.value)} /></label>
        <label style={lab}>
          {"Cat\u00e9gorie"}
          <select style={input} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.v} value={c.v}>{c.l}</option>
            ))}
          </select>
        </label>
        <label style={lab}>
          {"Description"}
          <textarea style={{ ...input, minHeight: 90 }} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label style={lab}>
          {"Fichier (PDF, EPUB, Word)"}
          <input type="file" accept=".pdf,.epub,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <label style={lab}>
          {"Couverture (facultatif, image)"}
          <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          style={{ padding: "10px 16px", borderRadius: 12, border: 0, color: "#fff", background: "#C05638", cursor: "pointer", fontWeight: 700 }}
        >
          {busy ? "Envoi en cours..." : "Ajouter \u00e0 la biblioth\u00e8que"}
        </button>
        {msg && <p style={{ fontSize: 13 }}>{msg}</p>}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700 }}>{"Documents d\u00e9j\u00e0 en ligne (" + books.length + ")"}</h2>
      {books.map((b) => (
        <div key={b.id} style={{ ...box, gridTemplateColumns: "1fr auto", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{b.title}</div>
            <div style={{ fontSize: 12, color: "#78716c" }}>{b.author + " \u2022 " + b.category}</div>
          </div>
          <button type="button" onClick={() => remove(b.id)} style={{ border: 0, background: "transparent", color: "#dc2626", cursor: "pointer" }}>
            {"Supprimer"}
          </button>
        </div>
      ))}
    </div>
  );
}