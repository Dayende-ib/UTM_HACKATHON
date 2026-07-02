'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { commerceService } from '@/services/commerce.service';
import type { DayStats } from '@/services/commerce.service';
import { commentaireService } from '@/services/commentaire.service';
import { ROUTES } from '@/constants/routes';
import { Eye, Phone, MessageSquare, Star, Calendar, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import type { Commerce } from '@/types/commerce';
import type { Commentaire } from '@/types/commentaire';

const RANGE_DAYS: Record<string, number> = { '7j': 7, '30j': 30, '90j': 90 };

function mergeEvolution(perCommerce: DayStats[][]): DayStats[] {
  const byDate = new Map<string, DayStats>();
  for (const days of perCommerce) {
    for (const d of days) {
      const existing = byDate.get(d.date) ?? { date: d.date, vues: 0, appels: 0, whatsapp: 0 };
      existing.vues += d.vues;
      existing.appels += d.appels;
      existing.whatsapp += d.whatsapp;
      byDate.set(d.date, existing);
    }
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function EvolutionChart({ data, rangeDays }: { data: DayStats[]; rangeDays: number }) {
  const max = Math.max(...data.map((d) => d.vues), 1);
  // Au-delà de ~14 barres, n'affiche qu'un sous-ensemble de labels pour rester lisible.
  const labelEvery = Math.max(1, Math.ceil(rangeDays / 14));

  return (
    <div>
      <div className="flex items-end gap-[3px] h-40">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
            <div
              className="w-full bg-primary-500 rounded-t-sm hover:bg-primary-600 transition-colors min-h-[2px]"
              style={{ height: `${(d.vues / max) * 100}%` }}
            />
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-stone-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-10">
              {d.vues} vue{d.vues !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-[3px] mt-1.5">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i % labelEvery === 0 && (
              <span className="text-[10px] text-stone-400">
                {new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' })}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatistiquesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [reviews, setReviews] = useState<Commentaire[]>([]);
  const [evolution, setEvolution] = useState<DayStats[]>([]);
  const [dateRange, setDateRange] = useState('7j');
  const [loading, setLoading] = useState(true);
  const [loadingEvolution, setLoadingEvolution] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'artisan') {
      router.push(ROUTES.DASHBOARD);
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.id) return;
    let annule = false;
    commerceService
      .getAll({ artisanId: user.id })
      .then(async (list) => {
        if (annule) return;
        setCommerces(list);
        const all = await Promise.all(
          list.map((c) => commentaireService.getByCommerceId(c.id).catch(() => []))
        );
        if (!annule) setReviews(all.flat());
      })
      .catch(() => setCommerces([]))
      .finally(() => !annule && setLoading(false));
    return () => {
      annule = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (commerces.length === 0) {
      // Reset si l'artisan n'a plus de commerce (ou pas encore chargé) : volontaire.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEvolution([]);
      return;
    }
    let annule = false;
    const days = RANGE_DAYS[dateRange] ?? 7;
    setLoadingEvolution(true);
    Promise.all(commerces.map((c) => commerceService.getStatsEvolution(c.id, days).catch(() => [])))
      .then((perCommerce) => {
        if (!annule) setEvolution(mergeEvolution(perCommerce));
      })
      .finally(() => !annule && setLoadingEvolution(false));
    return () => {
      annule = true;
    };
  }, [commerces, dateRange]);

  if (user && user.role !== 'artisan') {
    return null;
  }

  const totalVues = commerces.reduce((sum, c) => sum + c.nombreVues, 0);
  const totalAppels = commerces.reduce((sum, c) => sum + c.nombreAppels, 0);
  const totalClics = commerces.reduce((sum, c) => sum + c.nombreClicsWhatsApp, 0);
  const avgNote = commerces.length
    ? (commerces.reduce((sum, c) => sum + c.note, 0) / commerces.length).toFixed(1)
    : '0';

  const topCommerce = [...commerces].sort((a, b) => b.nombreVues - a.nombreVues)[0];

  const stats = [
    { label: 'Vues totales', value: totalVues, icon: <Eye className="h-[18px] w-[18px]" />, variant: 'blue' as const },
    { label: 'Appels reçus', value: totalAppels, icon: <Phone className="h-[18px] w-[18px]" />, variant: 'green' as const },
    { label: 'Clics WhatsApp', value: totalClics, icon: <MessageSquare className="h-[18px] w-[18px]" />, variant: 'purple' as const },
    { label: 'Note moyenne', value: avgNote, icon: <Star className="h-[18px] w-[18px]" />, variant: 'amber' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Statistiques</h1>
          <p className="text-stone-500 text-sm mt-1.5 flex items-center gap-1.5">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Suivez les performances de vos commerces
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-stone-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-9 px-3 border border-stone-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
          >
            <option value="7j">7 derniers jours</option>
            <option value="30j">30 derniers jours</option>
            <option value="90j">90 derniers jours</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} variant={stat.variant} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-stone-200 p-6">
          <h2 className="text-base font-semibold text-stone-900 mb-4 flex items-center gap-2">
            Évolution des vues
            {loadingEvolution && <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-400" />}
          </h2>
          {evolution.length > 0 && evolution.some((d) => d.vues > 0) ? (
            <EvolutionChart data={evolution} rangeDays={RANGE_DAYS[dateRange] ?? 7} />
          ) : (
            <div className="h-40 flex items-center justify-center rounded-md border border-dashed border-stone-300">
              <p className="text-sm text-stone-400">Aucune vue enregistrée sur cette période</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-stone-200 p-6">
            <h2 className="text-base font-semibold text-stone-900 mb-4">Commerce le plus performant</h2>
            {topCommerce ? (
              <div className="text-center">
                <div className="h-12 w-12 rounded-full border border-primary-200 bg-primary-50 flex items-center justify-center mx-auto mb-3">
                  <Star className="h-5 w-5 text-primary-600" />
                </div>
                <p className="font-medium text-stone-900">{topCommerce.nombreVues} vues</p>
                <p className="text-sm text-stone-500 mt-1">{topCommerce.nom}</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className="h-3.5 w-3.5 fill-primary-600 text-primary-600" />
                  <span className="text-sm font-medium text-stone-800">{topCommerce.note.toFixed(1)}</span>
                  <span className="text-xs text-stone-400">({topCommerce.nombreAvis} avis)</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-400 text-center py-4">Aucun commerce</p>
            )}
          </div>

          <div className="rounded-lg border border-stone-200 p-6">
            <h2 className="text-base font-semibold text-stone-900 mb-4">Résumé des avis</h2>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Total avis</span>
                <span className="font-medium text-stone-900">{reviews.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Note moyenne</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-primary-600 text-primary-600" />
                  <span className="font-medium text-stone-900">{avgNote}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Avis 5 étoiles</span>
                <span className="font-medium text-stone-900">
                  {reviews.filter((r) => r.note === 5).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Avis 4 étoiles</span>
                <span className="font-medium text-stone-900">
                  {reviews.filter((r) => r.note === 4).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
