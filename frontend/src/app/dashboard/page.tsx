'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { commerceService } from '@/services/commerce.service';
import { commentaireService } from '@/services/commentaire.service';
import { useFavorites } from '@/hooks/useFavorites';
import { Store, Phone, Eye, Star, Plus, BarChart3, ArrowRight, Heart, Search, Loader2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { StatCard } from '@/components/shared/stat-card';
import type { Commerce } from '@/types/commerce';
import type { Commentaire } from '@/types/commentaire';

function CitoyenDashboard() {
  const { user } = useAuthStore();
  const { favoris } = useFavorites();

  const quickActions = [
    { href: ROUTES.DASHBOARD_ANNUAIRE, icon: Search, label: "Chercher un artisan" },
    { href: ROUTES.DASHBOARD_FAVORIS, icon: Heart, label: 'Mes favoris' },
    { href: ROUTES.DASHBOARD_PROFIL, icon: Star, label: 'Modifier mon profil' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
          Bonjour, {user?.prenom}
        </h1>
        <p className="text-stone-500 text-sm mt-1.5">Bienvenue sur votre espace ArtisanBF</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={<Heart className="h-[18px] w-[18px]" />}
          value={favoris.length}
          label="Artisans favoris"
          variant="purple"
        />
        <Link
          href={ROUTES.URGENCE}
          className="rounded-lg border border-error-200 bg-error-50 p-4 flex items-center gap-3 hover:border-error-300 transition-colors"
        >
          <div className="p-2 rounded-md bg-error-100">
            <Phone className="h-[18px] w-[18px] text-error-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-error-900">Besoin d&apos;un artisan en urgence ?</p>
            <p className="text-xs text-error-700">Trouvez le plus proche de vous</p>
          </div>
        </Link>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="text-base font-semibold text-stone-900 mb-4">Actions rapides</h2>
        <div className="space-y-1">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-2.5 rounded-md hover:bg-stone-50 transition-colors group"
            >
              <action.icon className="h-4 w-4 text-stone-400" />
              <span className="text-sm font-medium text-stone-700 flex-1">{action.label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArtisanDashboard() {
  const { user } = useAuthStore();
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [recentReviews, setRecentReviews] = useState<(Commentaire & { commerceNom: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let annule = false;
    commerceService
      .getAll({ artisanId: user.id })
      .then(async (list) => {
        if (annule) return;
        setCommerces(list);

        const reviewsByCommerce = await Promise.all(
          list.map((c) =>
            commentaireService
              .getByCommerceId(c.id)
              .then((avis) => avis.map((a) => ({ ...a, commerceNom: c.nom })))
              .catch(() => [])
          )
        );
        if (annule) return;
        const merged = reviewsByCommerce
          .flat()
          .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
          .slice(0, 5);
        setRecentReviews(merged);
      })
      .catch(() => setCommerces([]))
      .finally(() => !annule && setLoading(false));
    return () => {
      annule = true;
    };
  }, [user?.id]);

  const totalVues = commerces.reduce((sum, c) => sum + c.nombreVues, 0);
  const totalAppels = commerces.reduce((sum, c) => sum + c.nombreAppels, 0);
  const totalClics = commerces.reduce((sum, c) => sum + c.nombreClicsWhatsApp, 0);
  const avgNote = commerces.length
    ? (commerces.reduce((sum, c) => sum + c.note, 0) / commerces.length).toFixed(1)
    : '0';

  const stats = [
    { label: 'Vues', value: totalVues, icon: <Eye className="h-[18px] w-[18px]" />, variant: 'blue' as const },
    { label: 'Appels', value: totalAppels, icon: <Phone className="h-[18px] w-[18px]" />, variant: 'green' as const },
    { label: 'Clics WhatsApp', value: totalClics, icon: <MessageCircle className="h-[18px] w-[18px]" />, variant: 'purple' as const },
    { label: 'Note moyenne', value: avgNote, icon: <Star className="h-[18px] w-[18px]" />, variant: 'amber' as const },
  ];

  const quickActions = [
    { href: ROUTES.DASHBOARD_COMMERCES, icon: Plus, label: 'Ajouter un commerce' },
    { href: ROUTES.DASHBOARD_STATISTIQUES, icon: BarChart3, label: 'Voir les statistiques' },
    { href: ROUTES.DASHBOARD_PROFIL, icon: Star, label: 'Modifier mon profil' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
          Bonjour, {user?.prenom}
        </h1>
        <p className="text-stone-500 text-sm mt-1.5 flex items-center gap-1.5">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Voici un aperçu de votre activité
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} variant={stat.variant} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-stone-200 bg-white p-6">
          <h2 className="text-base font-semibold text-stone-900 mb-5">Mes commerces</h2>
          {commerces.length === 0 && !loading ? (
            <div className="text-center py-10">
              <Store className="h-7 w-7 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-400 text-sm mb-3">Vous n&apos;avez pas encore de commerce</p>
              <Link href={ROUTES.DASHBOARD_COMMERCES} className="text-sm font-medium text-stone-900 hover:underline">
                Ajouter mon premier commerce
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {commerces.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  href={ROUTES.DASHBOARD_COMMERCES}
                  className="flex items-center justify-between p-3 rounded-md border border-stone-200 hover:border-stone-400 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-900">{c.nom}</p>
                    <p className="text-xs text-stone-500">{c.ville}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-stone-600">
                    <Star className="h-3.5 w-3.5 fill-primary-600 text-primary-600" />
                    {c.note.toFixed(1)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <h2 className="text-base font-semibold text-stone-900 mb-4">Actions rapides</h2>
          <div className="space-y-1">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-2.5 rounded-md hover:bg-stone-50 transition-colors group"
              >
                <action.icon className="h-4 w-4 text-stone-400" />
                <span className="text-sm font-medium text-stone-700 flex-1">{action.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="text-base font-semibold text-stone-900 mb-4">Avis récents</h2>
        {recentReviews.length === 0 ? (
          <div className="text-center py-10">
            <Star className="h-7 w-7 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-400 text-sm">Aucun avis pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentReviews.map((review) => (
              <div key={review.id} className="flex items-start gap-3 p-3.5 rounded-md border border-stone-200">
                <div className="h-9 w-9 rounded-md bg-stone-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-white">
                    {(review.auteur?.nom || review.commerceNom).slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-stone-500">{review.commerceNom}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.note ? 'fill-primary-600 text-primary-600' : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-stone-400">
                      {new Date(review.dateCreation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm text-stone-700 mt-1.5 leading-relaxed">{review.texte}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (user?.role === 'citoyen') {
    return <CitoyenDashboard />;
  }

  return <ArtisanDashboard />;
}
