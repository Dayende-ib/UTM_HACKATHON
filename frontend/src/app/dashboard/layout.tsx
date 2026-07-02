'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { ROUTES } from '@/constants/routes';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push(ROUTES.CONNEXION);
      return;
    }
    if (user.role === 'admin') {
      router.push(ROUTES.ADMIN);
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push(ROUTES.HOME);
  };

  if (!isAuthenticated || !user || user.role === 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 h-16 flex items-center px-4 lg:px-6">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-md mr-3 transition-colors"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center">
          <Image src="/logo_zoom.png" alt="ArtisanBF" width={36} height={36} className="h-9 w-9 object-contain" />
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-stone-900 flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {user.prenom[0]}{user.nom[0]}
            </span>
          </div>
          <span className="hidden sm:inline text-sm font-medium text-stone-700">{user.prenom}</span>
        </div>
      </header>

      <div className="flex">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-stone-900/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className={`fixed inset-y-0 left-0 z-40 lg:hidden transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="h-full">
            <Sidebar role={user.role === 'artisan' ? 'artisan' : 'citoyen'} user={user} onLogout={handleLogout} />
          </div>
        </div>

        <div className="hidden lg:block">
          <Sidebar role={user.role === 'artisan' ? 'artisan' : 'citoyen'} user={user} onLogout={handleLogout} />
        </div>

        <main className="flex-1 min-h-[calc(100vh-4rem)] p-6 lg:p-8 bg-stone-50 pb-24 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
