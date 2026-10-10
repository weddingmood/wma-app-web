import Link from "next/link";

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px 80px" }}>
      <Link href="/" style={{ fontSize: 13, color: "var(--wm-text-faint, #78716c)" }}>
        {"\u2190 Retour \u00e0 l'accueil"}
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: "16px 0 20px", color: "var(--wm-primary, #C05638)" }}>{title}</h1>
      {children}
    </main>
  );
}