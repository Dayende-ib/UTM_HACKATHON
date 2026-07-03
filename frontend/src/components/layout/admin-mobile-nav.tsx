'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Store, MessageSquare, MoreHorizontal } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

interface AdminMobileNavProps {
  onMore: () => void;
}

const links = [
  { href: ROUTES.ADMIN, icon: LayoutDashboard, label: 'Accueil' },
  { href: ROUTES.ADMIN_UTILISATEURS, icon: Users, label: 'Utilisateurs' },
  { href: ROUTES.ADMIN_COMMERCES, icon: Store, label: 'Commerces' },
  { href: ROUTES.ADMIN_COMMENTAIRES, icon: MessageSquare, label: 'Avis' },
];

export default function AdminMobileNav({ onMore }: AdminMobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-16">
        {links.map((link) => {
          const isActive = link.href === ROUTES.ADMIN
            ? pathname === ROUTES.ADMIN
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-error-600' : 'text-stone-400'
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium truncate px-1">{link.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMore}
          className="flex flex-col items-center justify-center gap-1 text-stone-400 transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">Plus</span>
        </button>
      </div>
    </nav>
  );
}
