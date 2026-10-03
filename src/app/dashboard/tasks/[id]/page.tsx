"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Task = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  assignee: string | null;
  dueDate: string | null;
  priority: string | null;
  budgetEstimated: number | null;
  budgetActual: number | null;
  comments: string | null;
};

const LABELS: Record<string, string> = {
  both: "Les deux",
  partner1: "\u00c9poux (Lui)",
  partner2: "\u00c9pouse (Elle)",
  low: "Faible",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgent",
  general: "G\u00e9n\u00e9ral",
};

const label = (v: string) => LABELS[v] ?? v;

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const [all, setAll] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    assignee: "both",
    priority: "medium",
    dueDate: "",
    budgetEstimated: "0",
    budgetActual: "0",
    comments: "",
  });

  useEffect(() => {
    fetch("/api/tasks", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const list: Task[] = Array.isArray(d.tasks) ? d.tasks : [];
        setAll(list);
        const task = list.find((x) => x.id === id);
        if (task) {
          setFound(true);
          setForm({
            title: task.title || "",
            description: task.description || "",
            category: task.category || "general",
            assignee: task.assignee || "both",
            priority: task.priority || "medium",
            dueDate: (task.dueDate || "").slice(0, 10),
            budgetEstimated: String(task.budgetEstimated ?? 0),
            budgetActual: String(task.budgetActual ?? 0),
            comments: task.comments || "",
          });
        }
      })
      .catch(() => setMsg("Connexion indisponible."))
      .finally(() => setLoading(false));
  }, [id]);

  const optionsFor = (field: "category" | "assignee" | "priority", defaults: string[]) => {
    const set = new Set<string>(defaults);
    all.forEach((t) => {
      const v = t[field];
      if (v) set.add(v);
    });
    if (form[field]) set.add(form[field]);
    return Array.from(set);
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    if (!form.title.trim()) {
      setMsg("Le titre est obligatoire.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: form.title.trim(),
          description: form.description,
          category: form.category,
          assignee: form.assignee,
          priority: form.priority,
          dueDate: form.dueDate,
          budgetEstimated: Number(form.budgetEstimated) || 0,
          budgetActual: Number(form.budgetActual) || 0,
          comments: form.comments,
        }),
      });
      const data = await res.json();
      setMsg(res.ok && data.success && data.task ? "Enregistr\u00e9 \u2714" : data.message || "\u00c9chec de l'enregistrement.");
    } catch {
      setMsg("Connexion indisponible.");
    } finally {
      setBusy(false);
    }
  };

  const box = { padding: 16, border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff", display: "grid", gap: 12 } as const;
  const input = { width: "100%", padding: "8px 10px", border: "1px solid #d6d3d1", borderRadius: 10, fontSize: 14 } as const;
  const lab = { fontSize: 12, fontWeight: 600, display: "grid", gap: 4 } as const;

  if (loading) return <p style={{ padding: 16 }}>{"Chargement..."}</p>;
  if (!found)
    return (
      <div style={{ padding: 16, display: "grid", gap: 8 }}>
        <p>{"T\u00e2che introuvable."}</p>
        <Link href="/dashboard/tasks">{"\u2190 Retour aux t\u00e2ches"}</Link>
      </div>
    );

  return (
    <div style={{ display: "grid", gap: 16, paddingBottom: 64 }}>
      <Link href="/dashboard/tasks" style={{ fontSize: 13 }}>
        {"\u2190 Retour aux t\u00e2ches"}
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{"D\u00e9tail de la t\u00e2che"}</h1>

      <div style={box}>
        <label style={lab}>
          {"Titre"}
          <input style={input} value={form.title} onChange={set("title")} />
        </label>
        <label style={lab}>
          {"Description"}
          <textarea style={{ ...input, minHeight: 90 }} value={form.description} onChange={set("description")} />
        </label>
        <label style={lab}>
          {"Cat\u00e9gorie"}
          <select style={input} value={form.category} onChange={set("category")}>
            {optionsFor("category", ["general"]).map((v) => (
              <option key={v} value={v}>{label(v)}</option>
            ))}
          </select>
        </label>
        <label style={lab}>
          {"Responsable"}
          <select style={input} value={form.assignee} onChange={set("assignee")}>
            {optionsFor("assignee", ["both", "partner1", "partner2"]).map((v) => (
              <option key={v} value={v}>{label(v)}</option>
            ))}
          </select>
        </label>
        <label style={lab}>
          {"Priorit\u00e9"}
          <select style={input} value={form.priority} onChange={set("priority")}>
            {optionsFor("priority", ["low", "medium", "high"]).map((v) => (
              <option key={v} value={v}>{label(v)}</option>
            ))}
          </select>
        </label>
        <label style={lab}>
          {"\u00c9ch\u00e9ance"}
          <input style={input} type="date" value={form.dueDate} onChange={set("dueDate")} />
        </label>
        <label style={lab}>
          {"Budget estim\u00e9 (FCFA)"}
          <input style={input} type="number" min={0} value={form.budgetEstimated} onChange={set("budgetEstimated")} />
        </label>
        <label style={lab}>
          {"Budget r\u00e9el (FCFA)"}
          <input style={input} type="number" min={0} value={form.budgetActual} onChange={set("budgetActual")} />
        </label>
        <label style={lab}>
          {"Commentaires"}
          <textarea style={{ ...input, minHeight: 70 }} value={form.comments} onChange={set("comments")} />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={save}
          style={{ padding: "10px 16px", borderRadius: 12, border: 0, color: "#fff", background: "#C05638", cursor: "pointer", fontWeight: 700 }}
        >
          {busy ? "Enregistrement..." : "Enregistrer"}
        </button>
        {msg && <p style={{ fontSize: 13 }}>{msg}</p>}
      </div>
    </div>
  );
}