"use client";

function digitsOf(notes: unknown): string {
  const m = /Tel Wave : ([0-9+ ]+)/.exec(String(notes || ""));
  const d = m ? m[1].replace(/\D/g, "") : "";
  if (d.length === 10) return "225" + d;
  if (d.length === 13 && d.startsWith("225")) return d;
  return "";
}

export default function PaymentWhatsApp({ p }: { p: any }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const name = String(p.coupleName || "").trim() || "chers fianc\u00e9s";
  let text = "";
  let label = "";
  if (p.status === "verified") {
    label = "Pr\u00e9venir sur WhatsApp";
    text = "Bonjour " + name + ", votre paiement de " + Number(p.amount || 0).toLocaleString("fr-FR") + " FCFA est valid\u00e9. Votre espace Wedding Mood est actif : connectez-vous sur " + origin + " avec votre e-mail et le code d'acc\u00e8s " + (p.accessCode || "") + ". Merci de votre confiance.";
  } else if (p.status === "rejected" || p.status === "need_new_proof") {
    label = "Demander la preuve";
    text = "Bonjour " + name + ", nous n'avons pas pu v\u00e9rifier votre paiement Wave (r\u00e9f\u00e9rence " + (p.referenceNumber || "") + "). Pouvez-vous nous envoyer une capture de la transaction ? Merci.";
  } else {
    return <span className="text-stone-400">{"-"}</span>;
  }
  const num = digitsOf(p.adminNotes);
  const href = "https://wa.me/" + num + "?text=" + encodeURIComponent(text);
  return (
    <div className="space-y-1">
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-1.5 rounded-xl bg-green-600 text-white font-bold text-[11px] hover:bg-green-700">{label}</a>
      {!num && <p className="text-[10px] text-stone-500">{"Num\u00e9ro absent : choisissez le contact dans WhatsApp."}</p>}
    </div>
  );
}