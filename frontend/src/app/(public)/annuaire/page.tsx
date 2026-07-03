'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Map as MapIcon, List, Mic, Loader2, Square, SlidersHorizontal, X, WifiOff } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { commerceService } from '@/services/commerce.service';
import { categorieService } from '@/services/categorie.service';
import { CategoryFilter } from '@/components/commerces/category-filter';
import { CommerceList } from '@/components/commerces/commerce-list';
import MapLeaflet from '@/components/maps/map-leaflet';
import { filterCommerces } from '@/utils/filter-commerces';
import { resolveCategoryId } from '@/utils/voice-search';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { useToast } from '@/components/ui/toast';
import { useOffline } from '@/hooks/useOffline';
import type { Commerce, Categorie } from '@/types/commerce';

const cities = ['Toutes', 'Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya'];
const ratings = [0, 3, 3.5, 4, 4.5];
const ITEMS_PER_PAGE = 9;

export default function AnnuairePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState('Toutes');
  const [minRating, setMinRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMap, setShowMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isRecording, isProcessing, error, result, startRecording, stopRecording, reset } = useVoiceSearch();
  const isOffline = useOffline();

  useEffect(() => {
    commerceService.getAll().then(setCommerces).catch(console.error).finally(() => setLoading(false));
    categorieService.getAll().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setSearchQuery(q);
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;
    const categorieParam = new URLSearchParams(window.location.search).get('categorie');
    const categoryId = resolveCategoryId(categorieParam, categories);
    if (categoryId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCategory(categoryId);
      setCurrentPage(1);
    }
  }, [categories]);

  useEffect(() => {
    if (!result) return;
    if (result.intention === 'commentaire') {
      toast('warning', 'La voix a détecté un commentaire. Utilisez plutôt la recherche textuelle pour filtrer les artisans.');
      reset();
      return;
    }
    if (result.intention === 'incomprehensible') {
      toast('error', 'Commande vocale non comprise. Réessayez en citant un métier ou un quartier.');
      reset();
      return;
    }
    const categoryId = resolveCategoryId(result.categorie, categories);
    const params = new URLSearchParams();
    if (result.texte) params.set('q', result.texte);
    if (categoryId) params.set('categorie', categoryId);
    if (result.urgence) {
      router.push(`${ROUTES.URGENCE}${params.toString() ? `?${params.toString()}` : ''}`);
      toast('success', 'Urgence détectée, redirection vers le mode urgence.');
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(result.texte || searchQuery);
      setSelectedCategory(categoryId);
      setCurrentPage(1);
      toast('success', "Recherche vocale appliquée à l'annuaire.");
    }
    reset();
  }, [categories, reset, result, router, searchQuery, toast]);

  const handleVoiceClick = async () => {
    if (isProcessing) return;
    if (isRecording) { stopRecording(); return; }
    await startRecording();
  };

  const filtered = useMemo(
    () => filterCommerces(commerces, { recherche: searchQuery, categorieId: selectedCategory, ville: selectedCity, noteMin: minRating }),
    [commerces, searchQuery, selectedCategory, selectedCity, minRating]
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Pagination avec ellipsis
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | '...')[]>((acc, p, i, arr) => {
      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  const hasActiveFilters = Boolean(searchQuery || selectedCategory || selectedCity !== 'Toutes' || minRating > 0);
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedCity('Toutes');
    setMinRating(0);
    setCurrentPage(1);
  };

  const FilterPanel = () => (
    <div className="space-y-7">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Ville</h3>
        <div className="flex flex-wrap gap-1.5">
          {cities.map((city) => (
            <button key={city} onClick={() => { setSelectedCity(city); setCurrentPage(1); }}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${selectedCity === city ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-900'}`}>
              {city}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Note minimum</h3>
        <div className="flex flex-wrap gap-1.5">
          {ratings.map((r) => (
            <button key={r} onClick={() => { setMinRating(r); setCurrentPage(1); }}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${minRating === r ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-900'}`}>
              {r === 0 ? 'Toutes' : `${r}+`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight mb-5">
            Annuaire des artisans
          </h1>
          <div className="relative max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <div className="flex">
              <input
                type="text"
                placeholder="Rechercher un artisan, un service, une ville..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full h-11 pl-10 pr-3 text-sm border border-stone-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
              />
              <button
                type="button"
                onClick={handleVoiceClick}
                disabled={isProcessing}
                className={`h-11 px-3 border-t border-b border-r border-stone-300 bg-white text-sm transition-colors ${isRecording ? 'text-error-600' : 'text-stone-500 hover:text-stone-900'} disabled:opacity-50`}
                aria-label={isRecording ? 'Arrêter la recherche vocale' : 'Lancer la recherche vocale'}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-error-600">{error}</p>}
            {isRecording && <p className="mt-2 text-sm text-stone-500">Parlez maintenant: métier, quartier ou urgence.</p>}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-5 flex items-center gap-3">
          <CategoryFilter value={selectedCategory} onChange={(id) => { setSelectedCategory(id); setCurrentPage(1); }} />
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden shrink-0 flex items-center gap-1.5 h-9 px-3 text-sm border border-stone-300 rounded-md text-stone-600 hover:border-stone-900 transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
            {(selectedCity !== 'Toutes' || minRating > 0) && (
              <span className="h-1.5 w-1.5 rounded-full bg-stone-900" />
            )}
          </button>
        </div>
      </div>

      {/* Drawer filtres mobile */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-stone-900/50" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-stone-900">Filtres</h2>
              <button onClick={() => setShowFilters(false)} className="p-1.5 text-stone-400 hover:text-stone-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterPanel />
            <button
              onClick={() => setShowFilters(false)}
              className="mt-6 w-full h-11 bg-stone-900 text-white font-medium rounded-md text-sm"
            >
              Voir les résultats ({filtered.length})
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[220px_1fr] gap-8">
          {/* Filter rail desktop uniquement */}
          <aside className="hidden lg:block space-y-7 sticky top-20 self-start">
            <FilterPanel />
          </aside>

          {/* Results */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-stone-500 flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-stone-900">{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''}
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="text-stone-900 underline underline-offset-2 hover:text-stone-600">
                    Réinitialiser les filtres
                  </button>
                )}
                {isOffline && (
                  <span className="inline-flex items-center gap-1 text-primary-600">
                    <WifiOff className="h-3 w-3" />
                    données en cache - hors ligne
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1 border border-stone-300 rounded-md p-0.5">
                <button onClick={() => setShowMap(false)} className={`p-1.5 rounded-sm transition-colors ${!showMap ? 'bg-stone-900 text-white' : 'text-stone-500'}`} aria-label="Liste">
                  <List className="h-4 w-4" />
                </button>
                <button onClick={() => setShowMap(true)} className={`p-1.5 rounded-sm transition-colors ${showMap ? 'bg-stone-900 text-white' : 'text-stone-500'}`} aria-label="Carte">
                  <MapIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {showMap ? (
              <MapLeaflet
                className="h-[560px] w-full"
                markers={filtered.map((c) => ({
                  id: c.id,
                  position: [c.latitude, c.longitude],
                  nom: c.nom,
                  categorie: categories.find((cat) => cat.id === c.categorieId)?.nom ?? c.categorie?.nom,
                  note: c.note,
                  adresse: c.adresse,
                  color: '#d97706',
                }))}
                onMarkerClick={(id) => router.push(ROUTES.COMMERCE(id))}
              />
            ) : (
              <CommerceList commerces={paginated} loading={loading} />
            )}

            {!showMap && totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9 w-9 flex items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageNumbers.map((page, i) =>
                  page === '...' ? (
                    <span key={`e-${i}`} className="h-9 w-9 flex items-center justify-center text-stone-400 text-sm">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`h-9 w-9 rounded-md text-sm font-medium transition-colors ${currentPage === page ? 'bg-stone-900 text-white' : 'border border-stone-300 text-stone-600 hover:bg-stone-50'}`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 w-9 flex items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
