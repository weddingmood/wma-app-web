import Sidebar from "@/components/dashboard/Sidebar";
import { MobileNavigation } from "@/components/MobileNavigation";
import TrialBanner from "@/components/TrialBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen min-w-0 bg-stone-50">
      {/* Navigation latérale uniquement sur écran large. */}
      <div className="hidden shrink-0 lg:block lg:w-64">
        <Sidebar />
      </div>

      {/* Sur smartphone, le contenu occupe toute la largeur. */}
      <main className="min-w-0 flex-1 w-full min-h-screen pb-20 lg:pb-0">
        <div className="mx-auto w-full max-w-7xl min-w-0 p-2 sm:p-4 lg:p-6">
          <TrialBanner />
          {children}
        </div>
      </main>

      {/* Barre de navigation mobile fixe, déjà prévue par l'application. */}
      <MobileNavigation />
    </div>
  );
}
