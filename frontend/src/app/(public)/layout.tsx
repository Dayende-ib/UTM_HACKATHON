"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNav from "@/components/layout/mobile-nav";
import OfflineBanner from "@/components/layout/offline-banner";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/constants/routes";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push(ROUTES.HOME);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} onLogout={handleLogout} />
      <OfflineBanner />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <MobileNav />
      <Footer />
    </div>
  );
}
