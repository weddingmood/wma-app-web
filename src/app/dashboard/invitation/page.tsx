"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Image as ImageIcon, Loader2, Save, Sparkles, Upload } from "lucide-react";
import { INVITATION_TEMPLATES_20, PHOTO_FRAMES_20 } from "@/lib/invitation-presets";

type InvitationRecord = Record<string, any>;

type EditorState = {
  heroTitle: string;
  subTitle: string;
  weddingDate: string;
  weddingTime: string;
  venueName: string;
  venueAddress: string;
  venueMapUrl: string;
  customVerse: string;
  introText: string;
  loveStory: string;
  finalMessage: string;
  rsvpDeadline: string;
  heroImageUrl: string;
  hasPhoto: boolean;
  cardTemplate: string;
  photoLayout: string;
  photoZoom: number;
  photoPositionX: number;
  photoPositionY: number;
  showCountdown: boolean;
  showStory: boolean;
  showProgramme: boolean;
  showLocations: boolean;
  showVerse: boolean;
  showRsvp: boolean;
  showCagnotte: boolean;
  showQrCode: boolean;
  cagnotteEnabled: boolean;
  cagnotteTitle: string;
  cagnotteDescription: string;
  cagnottePaymentMethod: string;
  cagnottePaymentUrl: string;
  cagnotteButtonText: string;
};

const EMPTY: EditorState = {
  heroTitle: "Invitation au mariage",
  subTitle: "Nous nous marions",
  weddingDate: "",
  weddingTime: "10:00",
  venueName: "",
  venueAddress: "",
  venueMapUrl: "",
  customVerse: "",
  introText: "Nous avons la joie de vous inviter à célébrer avec nous le début de notre foyer.",
  loveStory: "",
  finalMessage: "Merci de partager notre joie.",
  rsvpDeadline: "",
  heroImageUrl: "",
  hasPhoto: false,
  cardTemplate: "terracotta_or",
  photoLayout: "arche",
  photoZoom: 100,
  photoPositionX: 50,
  photoPositionY: 50,
  showCountdown: true,
  showStory: true,
  showProgramme: true,
  showLocations: true,
  showVerse: true,
  showRsvp: true,
  showCagnotte: true,
  showQrCode: true,
  cagnotteEnabled: true,
  cagnotteTitle: "Notre cagnotte de mariage",
  cagnotteDescription: "Votre présence est le plus beau des cadeaux.",
  cagnottePaymentMethod: "wave",
  cagnottePaymentUrl: "",
  cagnotteButtonText: "Contribuer au foyer",
};

function fromInvitation(inv: InvitationRecord | null, couple?: InvitationRecord | null): EditorState {
  const source = inv || {};
  return {
    ...EMPTY,
    heroTitle: source.heroTitle || `${couple?.partner1Name || ""}${couple?.partner2Name ? ` & ${couple.partner2Name}` : ""}` || EMPTY.heroTitle,
    subTitle: source.subTitle || EMPTY.subTitle,
    weddingDate: source.weddingDate || couple?.weddingDate || "",
    weddingTime: source.weddingTime || EMPTY.weddingTime,
    venueName: source.venueName || couple?.venue || "",
    venueAddress: source.venueAddress || (couple?.city ? `${couple.city}, Côte d'Ivoire` : ""),
    venueMapUrl: source.venueMapUrl || "",
    customVerse: source.customVerse || couple?.bibleVerse || "",
    introText: source.introText || EMPTY.introText,
    loveStory: source.loveStory || "",
    finalMessage: source.finalMessage || EMPTY.finalMessage,
    rsvpDeadline: source.rsvpDeadline || "",
    heroImageUrl: source.heroImageUrl || source.coverPhotoUrl || "",
    hasPhoto: source.hasPhoto !== false && Boolean(source.heroImageUrl || source.coverPhotoUrl),
    cardTemplate: source.cardTemplate || EMPTY.cardTemplate,
    photoLayout: source.photoLayout || EMPTY.photoLayout,
    photoZoom: Number(source.photoZoom || 100),
    photoPositionX: Number(source.photoPositionX ?? 50),
    photoPositionY: Number(source.photoPositionY ?? 50),
    showCountdown: source.showCountdown !== false,
    showStory: source.showStory !== false,
    showProgramme: source.showProgramme !== false,
    showLocations: source.showLocations !== false,
    showVerse: source.showVerse !== false,
    showRsvp: source.showRsvp !== false,
    showCagnotte: source.showCagnotte !== false,
    showQrCode: source.showQrCode !== false,
    cagnotteEnabled: source.cagnotteEnabled !== false,
    cagnotteTitle: source.cagnotteTitle || EMPTY.cagnotteTitle,
    cagnotteDescription: source.cagnotteDescription || EMPTY.cagnotteDescription,
    cagnottePaymentMethod: source.cagnottePaymentMethod || EMPTY.cagnottePaymentMethod,
    cagnottePaymentUrl: source.cagnottePaymentUrl || "",
    cagnotteButtonText: source.cagnotteButtonText || EMPTY.cagnotteButtonText,
  };
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Veuillez choisir une image."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture de l'image impossible."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Image invalide."));
      image.onload = () => {
        const max = 1400;
        const ratio = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Aperçu de l'image impossible."));
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

export default function InvitationDashboardPage() {
  const [form, setForm] = useState<EditorState>(EMPTY);
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const response = await fetch("/api/invitations", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Invitation inaccessible.");
        if (!actif) return;
        setSlug(String(data.invitation?.slug || data.couple?.slug || ""));
        setForm(fromInvitation(data.invitation, data.couple));
      } catch (e: any) {
        if (actif) setError(e?.message || "Impossible de charger votre invitation.");
      } finally {
        if (actif) setLoading(false);
      }
    })();
    return () => { actif = false; };
  }, []);

  const update = <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setForm(current => ({ ...current, [key]: value }));
    setSaved(false);
  };

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const dataUrl = await compressImage(file);
      update("heroImageUrl", dataUrl);
      update("hasPhoto", true);
    } catch (e: any) {
      setError(e?.message || "Cette image ne peut pas être utilisée.");
    } finally {
      event.target.value = "";
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const response = await fetch("/api/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Enregistrement impossible.");
      setSlug(String(data.invitation?.slug || slug));
      setForm(fromInvitation(data.invitation, data.couple));
      setSaved(true);
    } catch (e: any) {
      setError(e?.message || "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  const template = useMemo(
    () => INVITATION_TEMPLATES_20.find(item => item.id === form.cardTemplate) || INVITATION_TEMPLATES_20[2],
    [form.cardTemplate]
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-stone-500">Chargement de votre éditeur...</div>;
  }

  return (
    <main className="min-h-screen bg-[#F8FAF9] px-4 py-6 sm:px-6 lg:px-8">
      <form onSubmit={save} className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--wm-primary)]">Votre invitation</p>
            <h1 className="mt-1 font-serif text-2xl font-bold text-stone-900 sm:text-3xl">Créez votre faire-part numérique</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">Choisissez un modèle, ajoutez votre image depuis votre téléphone et préparez la page que vos invités verront.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {slug && <Link href={`/invitation/${encodeURIComponent(slug)}`} target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"><ExternalLink className="size-4" />Aperçu public</Link>}
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--wm-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--wm-primary-hover)] disabled:opacity-60"><Save className="size-4" />{saving ? "Enregistrement..." : "Enregistrer"}</button>
          </div>
        </header>

        {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
        {saved && <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check className="size-4" />Votre invitation a été enregistrée.</div>}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start justify-between gap-4"><div><h2 className="font-serif text-xl font-bold text-stone-900">Votre image principale</h2><p className="mt-1 text-sm text-stone-500">Depuis la galerie de votre téléphone ou votre appareil photo.</p></div><Sparkles className="size-5 text-[#C9A86A]" /></div>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-5 block w-full rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-3 text-left transition hover:border-[var(--wm-primary)]">
                {form.heroImageUrl ? <img src={form.heroImageUrl} alt="Aperçu de votre invitation" className="h-64 w-full rounded-xl object-cover sm:h-80" /> : <span className="flex min-h-56 flex-col items-center justify-center gap-3 text-center"><ImageIcon className="size-10 text-stone-400" /><span className="text-sm font-semibold text-stone-700">Appuyez pour importer une image</span><span className="text-xs text-stone-400">JPG, PNG ou photo prise avec le téléphone</span></span>}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
              {form.heroImageUrl && <button type="button" onClick={() => { update("heroImageUrl", ""); update("hasPhoto", false); }} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-stone-500 underline underline-offset-4">Retirer l’image</button>}
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="font-serif text-xl font-bold text-stone-900">Le style de votre carte</h2><p className="mt-1 text-sm text-stone-500">Choisissez l’ambiance qui sera visible par vos invités.</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{INVITATION_TEMPLATES_20.map(item => <button key={item.id} type="button" onClick={() => update("cardTemplate", item.id)} className={`rounded-2xl border p-3 text-left transition ${form.cardTemplate === item.id ? "border-[var(--wm-primary)] bg-[var(--wm-primary)]/5 ring-2 ring-[var(--wm-primary)]/20" : "border-stone-200 hover:border-stone-300"}`}><span className="block h-10 rounded-xl" style={{ background: `linear-gradient(135deg, ${item.primary}, ${item.accent})` }} /><span className="mt-2 block text-xs font-bold text-stone-800">{item.name}</span><span className="mt-1 block text-[10px] leading-snug text-stone-500">{item.category}</span></button>)}</div></section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="font-serif text-xl font-bold text-stone-900">Cadre de la photo</h2><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{PHOTO_FRAMES_20.map(item => <button key={item.id} type="button" onClick={() => update("photoLayout", item.id)} className={`rounded-xl border px-3 py-3 text-left text-xs transition ${form.photoLayout === item.id ? "border-[var(--wm-primary)] bg-[var(--wm-primary)]/5 font-semibold text-[var(--wm-primary)]" : "border-stone-200 text-stone-600 hover:border-stone-300"}`}>{item.name}</button>)}</div>{form.heroImageUrl && <div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="text-xs font-semibold text-stone-600">Zoom<input type="range" min="100" max="180" value={form.photoZoom} onChange={e => update("photoZoom", Number(e.target.value))} className="mt-2 w-full accent-[var(--wm-primary)]" /></label><label className="text-xs font-semibold text-stone-600">Position horizontale<input type="range" min="0" max="100" value={form.photoPositionX} onChange={e => update("photoPositionX", Number(e.target.value))} className="mt-2 w-full accent-[var(--wm-primary)]" /></label><label className="text-xs font-semibold text-stone-600">Position verticale<input type="range" min="0" max="100" value={form.photoPositionY} onChange={e => update("photoPositionY", Number(e.target.value))} className="mt-2 w-full accent-[var(--wm-primary)]" /></label></div>}</section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="font-serif text-xl font-bold text-stone-900">Les informations affichées</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Titre" value={form.heroTitle} onChange={v => update("heroTitle", v)} /><Field label="Sous-titre" value={form.subTitle} onChange={v => update("subTitle", v)} /><Field label="Date" type="date" value={form.weddingDate} onChange={v => update("weddingDate", v)} /><Field label="Heure" type="time" value={form.weddingTime} onChange={v => update("weddingTime", v)} /><Field label="Lieu" value={form.venueName} onChange={v => update("venueName", v)} /><Field label="Adresse" value={form.venueAddress} onChange={v => update("venueAddress", v)} /><Field label="Lien Google Maps" value={form.venueMapUrl} onChange={v => update("venueMapUrl", v)} /><Field label="Date limite RSVP" value={form.rsvpDeadline} onChange={v => update("rsvpDeadline", v)} /></div><TextField label="Introduction" value={form.introText} onChange={v => update("introText", v)} /><TextField label="Notre histoire" value={form.loveStory} onChange={v => update("loveStory", v)} /><TextField label="Verset ou phrase d’alliance" value={form.customVerse} onChange={v => update("customVerse", v)} /><TextField label="Message final" value={form.finalMessage} onChange={v => update("finalMessage", v)} /></section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="font-serif text-xl font-bold text-stone-900">Sections de la carte</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{([ ["showCountdown", "Compte à rebours"], ["showStory", "Notre histoire"], ["showProgramme", "Programme"], ["showLocations", "Lieux et itinéraire"], ["showVerse", "Verset"], ["showRsvp", "Confirmation RSVP"], ["showCagnotte", "Cagnotte"], ["showQrCode", "QR code"] ] as const).map(([key, label]) => <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-700"><span>{label}</span><input type="checkbox" checked={form[key]} onChange={e => update(key, e.target.checked)} className="size-4 accent-[var(--wm-primary)]" /></label>)}</div></section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="font-serif text-xl font-bold text-stone-900">Cagnotte</h2><div className="mt-4 space-y-4"><Field label="Titre de la cagnotte" value={form.cagnotteTitle} onChange={v => update("cagnotteTitle", v)} /><TextField label="Message" value={form.cagnotteDescription} onChange={v => update("cagnotteDescription", v)} /><Field label="Lien de paiement Wave, si nécessaire" value={form.cagnottePaymentUrl} onChange={v => update("cagnottePaymentUrl", v)} /><Field label="Texte du bouton" value={form.cagnotteButtonText} onChange={v => update("cagnotteButtonText", v)} /></div></section>
          </div>
        </section>

        <footer className="flex flex-col items-stretch justify-between gap-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"><p className="text-xs text-stone-500">Modèle actif : <span className="font-semibold text-stone-800">{template.name}</span></p><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--wm-primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--wm-primary-hover)] disabled:opacity-60"><Save className="size-4" />{saving ? "Enregistrement..." : "Enregistrer mon invitation"}</button></footer>
      </form>
    </main>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block text-sm text-stone-700"><span className="mb-1.5 block text-xs font-semibold">{label}</span><input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--wm-primary)] focus:ring-2 focus:ring-[var(--wm-primary)]/15" /></label>;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="mt-4 block text-sm text-stone-700"><span className="mb-1.5 block text-xs font-semibold">{label}</span><textarea rows={3} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm leading-relaxed outline-none transition focus:border-[var(--wm-primary)] focus:ring-2 focus:ring-[var(--wm-primary)]/15" /></label>;
}
