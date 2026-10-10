"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";

const SMALL = 4 * 1024 * 1024;

export default function FileUpload({ label, accept, folder, value, onUploaded }: { label: string; accept?: string; folder: string; value?: string; onUploaded: (url: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setPreview(value || ""); }, [value]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setLoading(true);
    setErr(null);
    try {
      let url = "";
      if (file.size <= SMALL) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const j = await res.json().catch(() => null);
        if (!res.ok || !j || !j.success) throw new Error((j && j.message) || "Envoi impossible (" + res.status + ")");
        url = j.url;
      } else {
        const r = await upload(folder + "/" + Date.now() + "-" + file.name.replace(/[^A-Za-z0-9._-]/g, "_"), file, {
          access: "public",
          handleUploadUrl: "/api/admin/library/upload",
          contentType: file.type || undefined,
        });
        url = r.url;
      }
      setPreview(url);
      onUploaded(url);
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Envoi impossible");
    } finally {
      setLoading(false);
      input.value = "";
    }
  }

  return (
    <div className="border border-dashed p-3 rounded-xl bg-gray-50 space-y-2">
      <p className="text-xs font-semibold">{label}</p>
      <input type="file" accept={accept || "*/*"} onChange={handleFile} className="w-full text-xs border p-1 rounded bg-white" />
      {loading && <p className="text-[11px] text-orange-600">{"Envoi en cours..."}</p>}
      {err && <p className="text-[11px] text-red-700 font-semibold">{err}</p>}
      {preview && (/\.(mp4|webm|mov)$/i.test(preview)
        ? <video src={preview} className="h-28 rounded" controls />
        : /\.(jpg|jpeg|png|webp|gif)$/i.test(preview)
          ? <img src={preview} alt="" className="h-28 object-contain rounded border bg-white" />
          : <a href={preview} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 break-all">{preview}</a>)}
    </div>
  );
}