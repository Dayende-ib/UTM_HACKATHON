'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  BarChart3,
  User,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  MessageSquare,
  Shield,
  Heart,
  Search,
  Star,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

interface SidebarProps {
  role: 'artisan' | 'admin' | 'citoyen';
  user?: {
    nom: string;
    prenom: string;
    avatar?: string;
    email: string;
  };
  onLogout?: () => void;
}

export default function Sidebar({ role, user, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const artisanLinks = [
    { href: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Tableau de bord' },
    { href: ROUTES.DASHBOARD_COMMERCES, icon: Store, label: 'Mes commerces' },
    { href: ROUTES.DASHBOARD_STATISTIQUES, icon: BarChart3, label: 'Statistiques' },
    { href: ROUTES.DASHBOARD_PROFIL, icon: User, label: 'Mon profil' },
  ];

  const citoyenLinks = [
    { href: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Tableau de bord' },
    { href: ROUTES.DASHBOARD_ANNUAIRE, icon: Search, label: 'Rechercher' },
    { href: ROUTES.DASHBOARD_FAVORIS, icon: Heart, label: 'Mes favoris' },
    { href: ROUTES.DASHBOARD_AVIS, icon: Star, label: 'Mes avis' },
    { href: ROUTES.DASHBOARD_PROFIL, icon: User, label: 'Mon profil' },
  ];

  const adminLinks = [
    { href: ROUTES.ADMIN, icon: LayoutDashboard, label: 'Tableau de bord' },
    { href: ROUTES.ADMIN_UTILISATEURS, icon: Users, label: 'Utilisateurs' },
    { href: ROUTES.ADMIN_COMMERCES, icon: Store, label: 'Commerces' },
    { href: ROUTES.ADMIN_COMMENTAIRES, icon: MessageSquare, label: 'Commentaires' },
    { href: ROUTES.ADMIN_CATEGORIES, icon: Settings, label: 'Catégories' },
    { href: ROUTES.ADMIN_SIGNALEMENTS, icon: Shield, label: 'Signalements' },
  ];

  const links = role === 'admin' ? adminLinks : role === 'citoyen' ? citoyenLinks : artisanLinks;

  return (
    <aside
      className={`hidden lg:flex flex-col bg-white border-r border-stone-200 h-[calc(100vh-4rem)] sticky top-16 transition-[width] duration-200 ${
        collapsed ? 'w-[64px]' : 'w-60'
      }`}
    >
      <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium border-l-2 transition-colors ${
                isActive
                  ? 'border-stone-900 bg-stone-50 text-stone-900'
                  : 'border-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-900'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? link.label : undefined}
            >
              <link.icon className="h-[18px] w-[18px] flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-200 p-3">
        {user && (
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            {user.avatar ? (
              <Image src={user.avatar} alt={user.prenom} width={36} height={36} className="h-9 w-9 rounded-md object-cover flex-shrink-0" unoptimized />
            ) : (
              <div className="h-9 w-9 rounded-md bg-stone-900 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-white">
                  {user.prenom[0]}{user.nom[0]}
                </span>
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">{user.prenom} {user.nom}</p>
                <p className="text-xs text-stone-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 mt-3">
          <button
            onClick={onLogout}
            className={`flex items-center gap-2 px-2.5 py-2 text-sm font-medium text-error-600 hover:bg-error-50 rounded-md transition-colors flex-1 ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Déconnexion' : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md hidden lg:block transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
