'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, ArrowUpRight, Star, MapPin, Phone, Mic, Loader2, Square } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { commerceService } from '@/services/commerce.service';
import { categorieService } from '@/services/categorie.service';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { useToast } from '@/components/ui/toast';
import { CommercePhoto } from '@/components/commerces/commerce-photo';
import type { Commerce, Categorie } from '@/types/commerce';
import { resolveCategoryId } from '@/utils/voice-search';

// Indexé par slug (stable, présent en base) plutôt que par id.
const categoryIcons: Record<string, string> = {
  'mecanicien': '🔧',
  'couturier': '✂️',
  'menuisier': '🪚',
  'soudeur': '🔥',
  'electricien': '⚡',
  'plombier': '🚿',
  'coiffeur': '💇',
  'reparateur-telephones': '📱',
  'frigoriste': '❄️',
  'jardinage': '🌿',
  'maconnerie': '🧱',
  'peinture': '🎨',
  'photographie': '📷',
  'restauration': '🍽️',
};

const popularSearches = ['Mécanicien', 'Couturier', 'Électricien', 'Plombier', 'Coiffeur'];

const steps = [
  {
    num: '01',
    title: 'Recherchez',
    desc: "Filtrez par catégorie, ville ou note pour trouver l'artisan qu'il vous faut.",
    icon: Search,
  },
  {
    num: '02',
    title: 'Contactez',
    desc: 'Appelez ou écrivez sur WhatsApp en un clic, directement depuis la fiche.',
    icon: Phone,
  },
  {
    num: '03',
    title: 'Évaluez',
    desc: 'Laissez un avis après la prestation pour guider les prochains clients.',
    icon: Star,
  },
];

function PreviewCard({ commerces }: { commerces: Commerce[] }) {
  const sample = commerces.slice(0, 3);
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-2">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-stone-100">
        <span className="text-xs font-medium text-stone-500">Près de vous · Ouagadougou</span>
        <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
      </div>
      <div className="divide-y divide-stone-100">
        {sample.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-3 py-3">
            <div className="h-10 w-10 rounded-md bg-stone-900 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {c.nom.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 truncate">{c.nom}</p>
              <p className="text-xs text-stone-500 truncate">{c.ville} · {(0.5 + Number(c.id.slice(-1) || 1)).toFixed(1)} km</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-stone-700 shrink-0">
              <Star className="h-3.5 w-3.5 fill-primary-600 text-primary-600" />
              {c.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const { toast } = useToast();
  const { isRecording, isProcessing, error, result, startRecording, stopRecording, reset } = useVoiceSearch();

  useEffect(() => {
    commerceService.getAll().then(setCommerces).catch(console.error);
    categorieService.getAll().then(setCategories).catch(console.error);
  }, []);

  const featuredCommerces = commerces.slice(0, 6);

  useEffect(() => {
    if (!result) return;

    if (result.intention === 'commentaire') {
      toast('warning', 'La commande vocale a compris un commentaire. Essayez plutôt une recherche d’artisan.');
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
    } else {
      router.push(`${ROUTES.ANNUAIRE}${params.toString() ? `?${params.toString()}` : ''}`);
    }

    toast('success', result.urgence ? 'Recherche urgente détectée.' : 'Recherche vocale prise en compte.');
    reset();
  }, [categories, reset, result, router, toast]);

  const handleVoiceClick = async () => {
    if (isProcessing) return;
    if (isRecording) {
      stopRecording();
      return;
    }

    await startRecording();
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    router.push(`${ROUTES.ANNUAIRE}${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative border-b border-stone-200 overflow-hidden">
        <Image
          src="/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/70 to-stone-950/50" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-stone-300 mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                Annuaire national des artisans
              </div>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white text-balance leading-[1.05]">
                Trouvez l&apos;artisan de confiance,{' '}
                <span className="text-primary-400">près de chez vous.</span>
              </h1>
              <p className="text-lg text-stone-300 mt-5 max-w-lg leading-relaxed">
                Mécaniciens, couturiers, électriciens, plombiers, des milliers de
                professionnels référencés et notés, partout au Burkina Faso.
              </p>

              <form onSubmit={handleSearch} className="mt-8 flex max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Un métier, un nom, une ville..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-10 pr-3 text-sm border border-stone-300 rounded-l-md bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVoiceClick}
                  disabled={isProcessing}
                  className={`h-12 px-4 border-y border-stone-300 bg-white text-sm transition-colors -ml-px ${
                    isRecording ? 'text-error-600' : 'text-stone-500 hover:text-stone-900'
                  } disabled:opacity-50`}
                  aria-label={isRecording ? 'Arrêter la recherche vocale' : 'Lancer la recherche vocale'}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isRecording ? (
                    <Square className="h-4 w-4 fill-current" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="submit"
                  className="h-12 px-5 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-r-md transition-colors -ml-px"
                >
                  Rechercher
                </button>
              </form>

              {error && <p className="mt-2 text-sm text-error-400 max-w-md">{error}</p>}
              {isRecording && <p className="mt-2 text-sm text-stone-300 max-w-md">Parlez maintenant: métier, quartier ou urgence.</p>}

              <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1.5 text-sm">
                <span className="text-stone-400">Populaire :</span>
                {popularSearches.map((term, i) => (
                  <span key={term} className="text-stone-300">
                    <Link href={`${ROUTES.ANNUAIRE}?q=${term}`} className="hover:text-white hover:underline">
                      {term}
                    </Link>
                    {i < popularSearches.length - 1 && <span className="text-stone-500">,</span>}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-8">
                <Link href={ROUTES.URGENCE} className="inline-flex items-center gap-1.5 text-sm font-medium text-error-400 hover:text-error-300">
                  J&apos;ai une urgence
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <Link href={ROUTES.ANNUAIRE} className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-200 hover:text-white">
                  Voir l&apos;annuaire complet
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <PreviewCard commerces={commerces} />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap divide-x divide-stone-200">
            {[
              { value: '1 000+', label: 'artisans référencés' },
              { value: '5', label: 'villes couvertes' },
              { value: '4,5/5', label: 'note moyenne' },
              { value: '< 2 s', label: 'temps de recherche' },
            ].map((stat) => (
              <div key={stat.label} className="flex-1 min-w-[140px] px-6 first:pl-0">
                <p className="text-3xl font-semibold text-stone-900 tracking-tight">{stat.value}</p>
                <p className="text-sm text-stone-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">Catégories populaires</h2>
              <p className="text-stone-500 mt-1.5 text-sm">Explorez nos spécialités les plus demandées</p>
            </div>
            <Link href={ROUTES.ANNUAIRE} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900">
              Tout voir <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`${ROUTES.ANNUAIRE}?categorie=${cat.id}`}
                className="group rounded-lg border border-stone-200 p-4 hover:border-stone-900 transition-colors"
              >
                <span className="text-2xl block mb-3">{categoryIcons[cat.slug] || '🔧'}</span>
                <h3 className="font-medium text-stone-900 text-sm flex items-center justify-between">
                  {cat.nom}
                  <ArrowRight className="h-3.5 w-3.5 text-stone-300 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-stone-400 mt-1">{cat.nombreCommerces} artisans</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-stone-50 border-y border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-stone-900 tracking-tight mb-12">
            Comment ça marche
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step) => (
              <div key={step.num} className="relative pl-14">
                <span className="absolute left-0 top-0 text-4xl font-bold text-stone-200 tracking-tight leading-none">
                  {step.num}
                </span>
                <step.icon className="h-5 w-5 text-primary-600 mb-3" />
                <h3 className="text-base font-semibold text-stone-900 mb-1.5">{step.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured commerces */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">Artisans en vedette</h2>
              <p className="text-stone-500 mt-1.5 text-sm">Les mieux notés par la communauté</p>
            </div>
            <Link href={ROUTES.ANNUAIRE} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900">
              Tout voir <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredCommerces.map((commerce) => (
              <Link
                key={commerce.id}
                href={ROUTES.COMMERCE(commerce.id)}
                className="group rounded-lg border border-stone-200 overflow-hidden hover:border-stone-400 transition-colors"
              >
                <div className="relative h-44 bg-stone-100 overflow-hidden">
                  <CommercePhoto
                    categorieSlug={commerce.categorie?.slug}
                    fallbackSrc={commerce.photos[0]}
                    alt={commerce.nom}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                    {categories.find((c) => c.id === commerce.categorieId)?.nom}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <h3 className="font-medium text-stone-900 group-hover:underline">{commerce.nom}</h3>
                    <span className="flex items-center gap-1 text-sm font-medium text-stone-700 shrink-0">
                      <Star className="h-3.5 w-3.5 fill-primary-600 text-primary-600" />
                      {commerce.note}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-stone-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{commerce.ville}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Vous êtes artisan ?
            </h2>
            <p className="text-stone-400 mt-2 max-w-md">
              Créez votre espace professionnel gratuitement et soyez visible auprès de milliers de clients.
            </p>
          </div>
          <Link
            href={ROUTES.INSCRIPTION}
            className="inline-flex items-center gap-2 px-6 h-12 bg-white text-stone-900 font-medium rounded-md hover:bg-stone-100 transition-colors shrink-0"
          >
            Rejoindre la plateforme
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
