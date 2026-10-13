import LegalDocument from "@/components/LegalDocument";
import { legalVars } from "@/lib/legal-vars";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentions légales" };

export default async function Page() {
  const l = await legalVars();
  return <LegalDocument doc="mentions" vars={l.vars} override={l.override} />;
}