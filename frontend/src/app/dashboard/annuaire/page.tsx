'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { commerceService } from '@/services/commerce.service';
import { CategoryFilter } from '@/components/commerces/category-filter';
import { CommerceList } from '@/components/commerces/commerce-list';
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
        <p className="text-stone-500 text-sm mt-1.5">Parcourez l&apos;annuaire depuis votre tableau de bord</p>
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

      <CommerceList commerces={results} loading={loading} totalResults={results.length} />
    </div>
  );
}
