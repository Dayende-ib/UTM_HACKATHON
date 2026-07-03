'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, BarChart3, User, Search, Heart, Star } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

interface DashboardMobileNavProps {
  role: 'artisan' | 'citoyen';
}

export default function DashboardMobileNav({ role }: DashboardMobileNavProps) {
  const pathname = usePathname();

  const artisanLinks = [
    { href: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Accueil' },
    { href: ROUTES.DASHBOARD_COMMERCES, icon: Store, label: 'Commerces' },
    { href: ROUTES.DASHBOARD_STATISTIQUES, icon: BarChart3, label: 'Stats' },
    { href: ROUTES.DASHBOARD_PROFIL, icon: User, label: 'Profil' },
  ];

  const citoyenLinks = [
    { href: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Accueil' },
    { href: ROUTES.DASHBOARD_ANNUAIRE, icon: Search, label: 'Rechercher' },
    { href: ROUTES.DASHBOARD_FAVORIS, icon: Heart, label: 'Favoris' },
    { href: ROUTES.DASHBOARD_AVIS, icon: Star, label: 'Avis' },
    { href: ROUTES.DASHBOARD_PROFIL, icon: User, label: 'Profil' },
  ];

  const links = role === 'artisan' ? artisanLinks : citoyenLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className={`grid h-16 ${links.length === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
        {links.map((link) => {
          const isActive = link.href === ROUTES.DASHBOARD
            ? pathname === ROUTES.DASHBOARD
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-stone-900' : 'text-stone-400'
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium truncate px-1">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
