export default function PaymentLogos({ title = "Moyens de paiement" }: { title?: string }) {
  const items = ["Wave", "Orange Money", "MTN Money", "Moov Money"];
  return (
    <div className="text-center space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{title}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {items.map((n) => (<span key={n} className="px-3 py-1 rounded-lg text-xs font-semibold border border-stone-300">{n}</span>))}
      </div>
      <p className="text-[11px] text-stone-500">Paiement 100% securise via Paiement Pro / XPaye & Wave</p>
    </div>
  )
}
