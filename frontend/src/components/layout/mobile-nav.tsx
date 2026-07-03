'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, AlertTriangle, Heart, User } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/auth.store';

export default function MobileNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const profilHref = user
    ? user.role === 'admin'
      ? ROUTES.ADMIN
      : ROUTES.DASHBOARD_PROFIL
    : ROUTES.CONNEXION;

  const navItems = [
    { href: ROUTES.HOME, icon: Home, label: 'Accueil' },
    { href: ROUTES.ANNUAIRE, icon: Search, label: 'Annuaire' },
    { href: ROUTES.URGENCE, icon: AlertTriangle, label: 'Urgence', urgent: true },
    { href: ROUTES.FAVORIS, icon: Heart, label: 'Favoris' },
    { href: profilHref, icon: User, label: user ? 'Profil' : 'Connexion' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? item.urgent
                    ? 'text-error-600'
                    : 'text-stone-900'
                  : 'text-stone-400'
              }`}
            >
              <item.icon className={`h-5 w-5 ${item.urgent && !isActive ? 'text-error-400' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
