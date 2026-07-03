import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import PwaRegister from "@/components/pwa-register";
import OfflineSync from "@/components/offline-sync";

export const metadata: Metadata = {
  title: "ArtisansBF - Le bon artisan près de chez vous",
  description: "Le premier annuaire intelligent des artisans du Burkina Faso. Mécaniciens, couturiers, électriciens et bien plus. Trouvez le bon artisan en un clic.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ArtisanBF",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Permet l'usage de env(safe-area-inset-*) pour respecter l'encoche /
  // la zone de gestes sur les téléphones (iPhone notch, Android gesture bar).
  viewportFit: "cover",
  themeColor: "#1c1917",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary font-sans antialiased scroll-smooth">
        <ToastProvider>{children}</ToastProvider>
        <PwaRegister />
        <OfflineSync />
      </body>
    </html>
  );
}
