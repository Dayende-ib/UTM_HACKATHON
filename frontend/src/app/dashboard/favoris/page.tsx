'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Star, MapPin, Trash2, Loader2, WifiOff } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { CommercePhoto } from '@/components/commerces/commerce-photo';
import { useFavorites } from '@/hooks/useFavorites';
import { useOffline } from '@/hooks/useOffline';
import { commerceService } from '@/services/commerce.service';
import type { Commerce } from '@/types/commerce';

export default function DashboardFavorisPage() {
  const { favoris, toggleFavori } = useFavorites();
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const isOffline = useOffline();

  useEffect(() => {
    let annule = false;
    // Reset du chargement quand la liste de favoris change : volontaire.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.allSettled(favoris.map((id) => commerceService.getById(id)))
      .then((results) => {
        if (annule) return;
        const list = results
          .map((r) => (r.status === 'fulfilled' ? r.value : undefined))
          .filter((c): c is Commerce => Boolean(c));
        setCommerces(list);
      })
      .finally(() => !annule && setLoading(false));
    return () => {
      annule = true;
    };
  }, [favoris]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Mes favoris</h1>
        <p className="text-stone-500 text-sm mt-1.5 flex items-center gap-1.5">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {commerces.length} artisan{commerces.length !== 1 ? 's' : ''} favori{commerces.length !== 1 ? 's' : ''}
          {isOffline && !loading && (
            <span className="inline-flex items-center gap-1 text-primary-600">
              <WifiOff className="h-3 w-3" />
              données en cache — hors ligne
            </span>
          )}
        </p>
      </div>

      {!loading && commerces.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center">
          <Heart className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-stone-900 mb-1">Aucun favori pour le moment</h3>
          <p className="text-stone-500 text-sm mb-4">
            Parcourez l&apos;annuaire et ajoutez vos artisans préférés pour les retrouver ici.
          </p>
          <Link
            href={ROUTES.DASHBOARD_ANNUAIRE}
            className="inline-flex items-center gap-2 h-9 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-md text-sm transition-colors"
          >
            Rechercher un artisan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {commerces.map((commerce) => (
            <div key={commerce.id} className="rounded-lg border border-stone-200 overflow-hidden group hover:border-stone-400 transition-colors">
              <Link href={ROUTES.COMMERCE(commerce.id)}>
                <div className="relative h-40 bg-stone-100">
                  <CommercePhoto
                    categorieSlug={commerce.categorie?.slug}
                    fallbackSrc={commerce.photos[0]}
                    alt={commerce.nom}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{commerce.categorie?.nom}</p>
                <div className="flex items-start justify-between mt-1 gap-2">
                  <Link href={ROUTES.COMMERCE(commerce.id)} className="min-w-0">
                    <h3 className="font-medium text-stone-900 group-hover:underline truncate">{commerce.nom}</h3>
                  </Link>
                  <button
                    onClick={() => toggleFavori(commerce.id)}
                    className="p-1.5 text-stone-400 hover:text-error-500 rounded-md transition-colors shrink-0"
                    title="Retirer des favoris"
                    aria-label="Retirer des favoris"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <Star className="h-4 w-4 fill-primary-600 text-primary-600" />
                  <span className="text-sm font-medium text-stone-700">{commerce.note}</span>
                  <span className="text-sm text-stone-400">({commerce.nombreAvis} avis)</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-sm text-stone-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{commerce.ville}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
