import type { Metadata, Viewport } from "next";
import TrackingLoader from "@/components/TrackingLoader";
import DesktopModeNotice from "@/components/DesktopModeNotice";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeContext";
import { CallModal } from "@/components/CallModal";
import { PwaRegister } from "@/components/PwaRegister";
import VisitTracker from "@/components/VisitTracker";
import WhatsappSync from "@/components/WhatsappSync";
import DiscoveryTour from "@/components/DiscoveryTour";
import TermsGate from "@/components/TermsGate";
import InvitationPromo from "@/components/InvitationPromo";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

export const metadata: Metadata = {
  title: {
    default: "WEDDING MOOD - Préparation au Mariage Chrétien en Côte d'Ivoire",
    template: "%s • Wedding Mood",
  },
  description:
    "Application premium d'accompagnement au mariage pour jeunes couples chrétiens en Côte d'Ivoire. Dot, Mairie, Église, Budget FCFA, 7 Thèmes Bibliques, Invités, Synchronisation et Jour J.",
  metadataBase: new URL("https://www.weddingmood.site"),
  openGraph: {
    type: "website",
    siteName: "Wedding Mood",
    locale: "fr_CI",
    title: "Wedding Mood, pr\u00e9parez votre mariage \u00e0 deux",
    description: "Budget en FCFA, invit\u00e9s, t\u00e2ches, carte d'invitation num\u00e9rique, prestataires et espace spirituel pour pr\u00e9parer votre mariage en C\u00f4te d'Ivoire.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Wedding Mood" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wedding Mood, pr\u00e9parez votre mariage \u00e0 deux",
    description: "Budget en FCFA, invit\u00e9s, t\u00e2ches, carte d'invitation num\u00e9rique et prestataires.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.webmanifest",
  applicationName: "Wedding Mood",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wedding Mood",
  },
  formatDetection: { telephone: true },
  icons: {
    icon: [
      { url: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico?v=2" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#C05638",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="bg-[#F8FAFC] text-stone-900 antialiased min-h-screen">
        <TrackingLoader />
        <DesktopModeNotice />
        <ThemeProvider>
          <PwaRegister />
          <VisitTracker />
          <WhatsappSync />
          <DiscoveryTour />
          <TermsGate />
          <InvitationPromo />
          {children}
          <PwaInstallPrompt />
          <CallModal />
        </ThemeProvider>
      </body>
    </html>
  );
}

