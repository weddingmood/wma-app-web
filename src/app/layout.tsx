import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeContext";
import { CallModal } from "@/components/CallModal";
import { PwaRegister } from "@/components/PwaRegister";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

export const metadata: Metadata = {
  title: {
    default: "WEDDING MOOD - Préparation au Mariage Chrétien en Côte d'Ivoire",
    template: "%s • Wedding Mood",
  },
  description: "Application premium d'accompagnement au mariage pour jeunes couples chrétiens en Côte d'Ivoire.",
  manifest: "/manifest.webmanifest",
  applicationName: "Wedding Mood",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Wedding Mood" },
  formatDetection: { telephone: true },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#C05638",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-[#F8FAFC] text-stone-900 antialiased min-h-screen">
        <ThemeProvider>
          <PwaRegister />
          {children}
          <PwaInstallPrompt />
          <CallModal />
        </ThemeProvider>
      </body>
    </html>
  );
}