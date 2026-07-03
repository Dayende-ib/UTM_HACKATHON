'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, WifiOff } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { CommerceList } from '@/components/commerces/commerce-list';
import { useFavorites } from '@/hooks/useFavorites';
import { useOffline } from '@/hooks/useOffline';
import { commerceService } from '@/services/commerce.service';
import type { Commerce } from '@/types/commerce';

export default function DashboardFavorisPage() {
  const { favoris } = useFavorites();
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
          {commerces.length} artisan{commerces.length !== 1 ? 's' : ''} favori{commerces.length !== 1 ? 's' : ''}
          {isOffline && !loading && (
            <span className="inline-flex items-center gap-1 text-primary-600">
              <WifiOff className="h-3 w-3" />
              données en cache - hors ligne
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
        <CommerceList commerces={commerces} loading={loading} />
      )}
    </div>
  );
}
