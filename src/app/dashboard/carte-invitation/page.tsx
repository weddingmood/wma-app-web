"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Copy, Check, ExternalLink, Users, CheckCircle2, Clock, XCircle, QrCode, Pencil } from "lucide-react";

interface InvitationData { slug: string; coverPhotoUrl?: string | null; }
interface GuestRow { id: number; name: string; rsvpStatus?: string | null; phone?: string | null; }

export default function CarteInvitationPage() {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const [invRes, guestsRes] = await Promise.all([fetch("/api/invitations"), fetch("/api/guests")]);
        const invData = await invRes.json();
        const guestsData = await guestsRes.json();
        if (annule) return;
        if (invData.success) setInvitation(invData.invitation);
        if (guestsData.success) setGuests(guestsData.guests || []);
      } catch (err) { console.error(err); } finally { if (!annule) setLoading(false); }
    })();
    return () => { annule = true; };
  }, []);

  const lienPublic = typeof window !== "undefined" && invitation?.slug ? window.location.origin + "/invitation/" + invitation.slug : "";

  useEffect(() => {
    if (!lienPublic) return;
    QRCode.toDataURL(lienPublic, { width: 220, margin: 1 }).then((url) => setQrDataUrl(url)).catch(() => setQrDataUrl(""));
  }, [lienPublic]);

  const copierLien = async () => {
    if (!lienPublic) return;
    try { await navigator.clipboard.writeText(lienPublic); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const confirmes = guests.filter((g) => g.rsvpStatus === "confirmed").length;
  const enAttente = guests.filter((g) => !g.rsvpStatus || g.rsvpStatus === "pending").length;
  const declines = guests.filter((g) => g.rsvpStatus === "declined").length;
  const ontRepondu = guests.filter((g) => g.rsvpStatus && g.rsvpStatus !== "pending");

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-sm text-stone-400 animate-pulse">Chargement de votre invitation...</p></div>;
  }
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Carte d'invitation</h1>
          <p className="text-xs text-stone-500 mt-0.5">Partagez le lien, suivez les reponses de vos invites.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/invitation" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition">
            <Pencil className="w-3.5 h-3.5" /> Modifier ma carte
          </Link>
          {lienPublic && (
            <a href={lienPublic} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition">
              <ExternalLink className="w-3.5 h-3.5" /> Apercu public
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-stone-100"><h2 className="font-serif font-bold text-stone-900 text-sm">Apercu de l'invitation</h2></div>
          <div className="p-5">
            <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 h-48 relative">
              {invitation?.coverPhotoUrl ? (
                <img src={invitation.coverPhotoUrl} alt="Apercu" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">Aucune photo pour l'instant</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-stone-100"><h2 className="font-serif font-bold text-stone-900 text-sm">Lien d'invitation</h2></div>
          <div className="p-5 flex flex-col sm:flex-row gap-4 items-center">
            {qrDataUrl && <img src={qrDataUrl} alt="QR code" className="w-28 h-28 rounded-xl border border-stone-200 shrink-0" />}
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                <QrCode className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="text-[11px] text-stone-600 truncate flex-1">{lienPublic || "Lien en cours de creation..."}</span>
              </div>
              <button onClick={copierLien} disabled={!lienPublic} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-40">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Lien copie !" : "Copier le lien"}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-serif font-bold text-stone-900 text-sm">Reponses RSVP</h2>
            <span className="text-[10px] text-stone-400">{guests.length} invites au total</span>
          </div>
          <div className="p-5 grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-emerald-700">{confirmes}</p>
              <p className="text-[10px] text-emerald-700 font-semibold">Confirmes</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-amber-50 border border-amber-100">
              <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-amber-700">{enAttente}</p>
              <p className="text-[10px] text-amber-700 font-semibold">En attente</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-red-50 border border-red-100">
              <XCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-600">{declines}</p>
              <p className="text-[10px] text-red-600 font-semibold">Declines</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-stone-400" />
            <h2 className="font-serif font-bold text-stone-900 text-sm">Invites ayant repondu</h2>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {ontRepondu.length === 0 ? (
              <p className="p-5 text-xs text-stone-400 text-center">Aucune reponse pour le moment.</p>
            ) : (
              <table className="w-full text-left">
                <tbody className="divide-y divide-stone-100">
                  {ontRepondu.map((g) => (
                    <tr key={g.id}>
                      <td className="px-5 py-2.5 text-xs font-semibold text-stone-800">{g.name}</td>
                      <td className="px-5 py-2.5 text-right">
                        <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold " + (g.rsvpStatus === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")}>
                          {g.rsvpStatus === "confirmed" ? "Confirme" : "Decline"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}