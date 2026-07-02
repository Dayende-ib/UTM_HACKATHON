'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { commentaireService } from '@/services/commentaire.service';
import { useToast } from '@/components/ui/toast';
import { ROUTES } from '@/constants/routes';
import { Star, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import type { Commentaire } from '@/types/commentaire';

export default function MesAvisPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [avis, setAvis] = useState<Commentaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'artisan') {
      router.push(ROUTES.DASHBOARD);
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.id) return;
    let annule = false;
    commentaireService
      .getByUserId(user.id)
      .then((list) => !annule && setAvis(list))
      .catch(() => !annule && toast('error', 'Erreur de chargement de vos avis.'))
      .finally(() => !annule && setLoading(false));
    return () => {
      annule = true;
    };
  }, [user?.id, toast]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet avis ?')) return;
    setDeletingId(id);
    try {
      await commentaireService.delete(id);
      setAvis((prev) => prev.filter((a) => a.id !== id));
      toast('success', 'Avis supprimé.');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  if (user && user.role === 'artisan') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Mes avis</h1>
        <p className="text-stone-500 text-sm mt-1.5 flex items-center gap-1.5">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {avis.length} avis publié{avis.length !== 1 ? 's' : ''}
        </p>
      </div>

      {!loading && avis.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center">
          <MessageSquare className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-stone-900 mb-1">Aucun avis pour le moment</h3>
          <p className="text-stone-500 text-sm mb-4">
            Vos avis sur les artisans apparaîtront ici.
          </p>
          <Link
            href={ROUTES.ANNUAIRE}
            className="inline-flex items-center gap-2 h-9 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-md text-sm transition-colors"
          >
            Parcourir l&apos;annuaire
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {avis.map((a) => (
            <div key={a.id} className="rounded-lg border border-stone-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {a.commerce?.nom ? (
                      <Link
                        href={ROUTES.COMMERCE(a.commerceId)}
                        className="font-medium text-stone-900 hover:underline"
                      >
                        {a.commerce.nom}
                      </Link>
                    ) : (
                      <span className="font-medium text-stone-900">Commerce</span>
                    )}
                    {a.commerce?.ville && (
                      <span className="text-xs text-stone-400">{a.commerce.ville}</span>
                    )}
                    <span className="text-xs text-stone-400">
                      {new Date(a.dateCreation).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < a.note ? 'fill-primary-600 text-primary-600' : 'text-stone-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">{a.texte}</p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  className="p-2 text-stone-400 hover:text-error-600 hover:bg-error-50 rounded-md transition-colors disabled:opacity-50 shrink-0"
                  aria-label="Supprimer l'avis"
                >
                  {deletingId === a.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
