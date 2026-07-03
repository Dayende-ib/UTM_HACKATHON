'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { commerceService } from '@/services/commerce.service';
import { CategoryFilter } from '@/components/commerces/category-filter';
import { CommerceList } from '@/components/commerces/commerce-list';
import type { Commerce } from '@/types/commerce';

const ITEMS_PER_PAGE = 9;

export default function DashboardAnnuairePage() {
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setQuery(queryInput), 300);
    return () => clearTimeout(t);
  }, [queryInput]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [query, categorieId]);

  useEffect(() => {
    let annule = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    commerceService
      .search({ search: query || undefined, categorieId: categorieId ?? undefined, page, limit: ITEMS_PER_PAGE })
      .then((res) => {
        if (annule) return;
        setCommerces(res.commerces);
        setTotal(res.total);
      })
      .catch(() => !annule && setCommerces([]))
      .finally(() => !annule && setLoading(false));
    return () => {
      annule = true;
    };
  }, [query, categorieId, page]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

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
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          className="w-full h-10 pl-10 pr-3 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
        />
      </div>

      <CategoryFilter value={categorieId} onChange={setCategorieId} />

      <CommerceList commerces={commerces} loading={loading} totalResults={total} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-9 w-9 flex items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-stone-500">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-9 w-9 flex items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
