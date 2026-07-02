'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Star, MapPin, Loader2 } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { commerceService } from '@/services/commerce.service';
import { CommercePhoto } from '@/components/commerces/commerce-photo';
import { CategoryFilter } from '@/components/commerces/category-filter';
import { filterCommerces } from '@/utils/filter-commerces';
import type { Commerce } from '@/types/commerce';

export default function DashboardAnnuairePage() {
  const [query, setQuery] = useState('');
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    commerceService
      .getAll()
      .then(setCommerces)
      .catch(() => setCommerces([]))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(
    () => filterCommerces(commerces, { recherche: query, categorieId }),
    [commerces, query, categorieId]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Rechercher un artisan</h1>
        <p className="text-stone-500 text-sm mt-1.5 flex items-center gap-1.5">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {results.length} résultat{results.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Un métier, un nom, une ville..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-3 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
        />
      </div>

      <CategoryFilter value={categorieId} onChange={setCategorieId} />

      {!loading && results.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center">
          <Search className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-stone-900 mb-1">Aucun résultat</h3>
          <p className="text-stone-500 text-sm">Essayez un autre métier, nom ou ville.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((commerce) => (
            <Link
              key={commerce.id}
              href={ROUTES.COMMERCE(commerce.id)}
              className="group rounded-lg border border-stone-200 overflow-hidden hover:border-stone-400 transition-colors"
            >
              <div className="relative h-40 bg-stone-100">
                <CommercePhoto
                  categorieSlug={commerce.categorie?.slug}
                  fallbackSrc={commerce.photos[0]}
                  alt={commerce.nom}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{commerce.categorie?.nom}</p>
                <div className="flex items-center justify-between mt-1 gap-2">
                  <h3 className="font-medium text-stone-900 group-hover:underline truncate">{commerce.nom}</h3>
                  <span className="flex items-center gap-1 text-sm font-medium text-stone-700 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-primary-600 text-primary-600" />
                    {commerce.note}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-sm text-stone-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{commerce.ville}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
