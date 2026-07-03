'use client';

import { useState, use, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Phone, MessageCircle, Heart, ArrowLeft, Send, Share2, Loader2, Sparkles, Mic, Square } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { usePexelsPhotos } from '@/hooks/usePexelsPhotos';
import { CATEGORY_PEXELS_QUERY } from '@/constants/pexels';
import { CommercePhoto } from '@/components/commerces/commerce-photo';
import MapLeaflet from '@/components/maps/map-leaflet';
import { commerceService } from '@/services/commerce.service';
import { commentaireService } from '@/services/commentaire.service';
import { groqService } from '@/services/groq.service';
import { useAuthStore } from '@/stores/auth.store';
import { useFavorites } from '@/hooks/useFavorites';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useToast } from '@/components/ui/toast';
import type { Commerce } from '@/types/commerce';
import type { Commentaire } from '@/types/commentaire';

const SENTIMENT_BADGE: Record<'positif' | 'neutre' | 'negatif', { label: string; cls: string }> = {
  positif: { label: 'Positif', cls: 'bg-success-50 text-success-700' },
  neutre: { label: 'Neutre', cls: 'bg-stone-100 text-stone-600' },
  negatif: { label: 'Négatif', cls: 'bg-error-50 text-error-700' },
};

function PhotoGallery({ photos: fallbackPhotos, name, categorieSlug }: { photos: string[]; name: string; categorieSlug?: string }) {
  const [selected, setSelected] = useState(0);
  const query = categorieSlug ? CATEGORY_PEXELS_QUERY[categorieSlug] ?? null : null;
  const { photos: pexelsPhotos } = usePexelsPhotos(query, 4);
  // Photos propres du commerce en priorité ; sinon Pexels (catégorie).
  const photos = fallbackPhotos.length > 0 ? fallbackPhotos : pexelsPhotos;

  if (photos.length === 0) {
    return <div className="h-64 sm:h-80 lg:h-96 bg-stone-100 rounded-lg" />;
  }

  return (
    <div className="space-y-2.5">
      <div className="relative h-64 sm:h-80 lg:h-96 bg-stone-100 rounded-lg overflow-hidden">
        <Image
          src={photos[selected] ?? photos[0]}
          alt={name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
          unoptimized
        />
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`relative h-16 w-24 rounded-md overflow-hidden border-2 transition-colors ${
                selected === i ? 'border-stone-900' : 'border-transparent'
              }`}
            >
              <Image src={photo} alt="" fill sizes="96px" className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommerceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useAuthStore((s) => s.user);
  const { toggleFavori, isFavori } = useFavorites();
  const { toast: notify } = useToast();

  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [reviews, setReviews] = useState<Commentaire[]>([]);
  const [related, setRelated] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isFavorite = isFavori(id);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [summary, setSummary] = useState<{ resume: string; points_forts: string[]; points_faibles: string[] } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Dictée vocale de l'avis (backend /api/ai/speech-to-text)
  const {
    isRecording: dictRecording,
    isProcessing: dictProcessing,
    text: dictText,
    error: dictError,
    startRecording: startDictation,
    stopRecording: stopDictation,
    reset: resetDictation,
  } = useSpeechToText();

  // Réponses IA de l'artisan aux avis (backend /api/ai/respond)
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  const handleGenerateReply = useCallback(
    async (review: Commentaire) => {
      setReplyingId(review.id);
      try {
        const reponse = await groqService.repondreAvis(review.texte, review.note);
        setReplies((prev) => ({ ...prev, [review.id]: reponse }));
      } catch (err) {
        notify('error', err instanceof Error ? err.message : 'Erreur lors de la génération.');
      } finally {
        setReplyingId(null);
      }
    },
    [notify]
  );

  useEffect(() => {
    let annule = false;
    // Reset de l'état de chargement quand l'id de route change : volontaire.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      const c = await commerceService.getById(id);
      if (annule) return;
      if (!c) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCommerce(c);
      setLoading(false);

      // Comptabilise une vue (best-effort, une fois par consultation).
      commerceService.incrementView(id);

      // Avis + commerces similaires (non bloquants)
      commentaireService.getByCommerceId(id).then((r) => !annule && setReviews(r)).catch(() => {});
      if (c.categorieId) {
        commerceService
          .getAll({ categorieId: c.categorieId })
          .then((list) => !annule && setRelated(list.filter((x) => x.id !== c.id).slice(0, 3)))
          .catch(() => {});
      }
    })().catch(() => {
      if (!annule) {
        setNotFound(true);
        setLoading(false);
      }
    });
    return () => {
      annule = true;
    };
  }, [id]);

  // Résumé IA des avis (backend /api/ai/summarize) — déclenché dès qu'il y a
  // assez de commentaires exploitables.
  useEffect(() => {
    const textes = reviews.map((r) => r.texte).filter((t) => t && t.trim().length >= 2);
    if (textes.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSummary(null);
      return;
    }
    let annule = false;
    setSummaryLoading(true);
    groqService
      .genererResume(textes)
      .then((res) => {
        if (!annule) setSummary(res);
      })
      .catch(() => {
        if (!annule) setSummary(null);
      })
      .finally(() => {
        if (!annule) setSummaryLoading(false);
      });
    return () => {
      annule = true;
    };
  }, [reviews]);

  // Injecte le texte dicté dans le champ d'avis dès qu'une transcription arrive.
  useEffect(() => {
    if (!dictText) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReviewText((prev) => (prev.trim() ? `${prev.trim()} ${dictText}` : dictText));
    resetDictation();
  }, [dictText, resetDictation]);

  // Signale une erreur de dictée à l'utilisateur.
  useEffect(() => {
    if (dictError) notify('error', dictError);
  }, [dictError, notify]);

  const handleSubmitReview = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (reviewText.trim().length < 10 || reviewRating === 0) return;
      setSubmitting(true);
      try {
        const created = await commentaireService.create({
          texte: reviewText.trim(),
          note: reviewRating,
          auteurId: user?.id ?? null,
          commerceId: id,
        });
        setReviews((prev) => [created, ...prev]);
        setReviewText('');
        setReviewRating(0);
        notify('success', 'Merci ! Votre avis a été publié.');
      } catch (err) {
        notify('error', err instanceof Error ? err.message : 'Erreur lors de la publication.');
      } finally {
        setSubmitting(false);
      }
    },
    [reviewText, reviewRating, user, id, notify]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (notFound || !commerce) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-stone-900 mb-2">Commerce introuvable</h1>
          <p className="text-stone-500 mb-6">Ce commerce n&apos;existe pas ou a été supprimé.</p>
          <Link href={ROUTES.ANNUAIRE} className="text-stone-900 font-medium hover:underline">
            Retour à l&apos;annuaire
          </Link>
        </div>
      </div>
    );
  }

  const categoryNom = commerce.categorie?.nom;
  const isOwner = !!user && !!commerce.artisanId && user.id === commerce.artisanId;

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Barre contact sticky mobile */}
      <div className="fixed bottom-16 left-0 right-0 z-40 lg:hidden bg-white border-t border-stone-200 px-4 py-3 flex gap-3">
        {commerce.telephone && (
          <a href={`tel:${commerce.telephone}`} onClick={() => commerceService.incrementCall(id)}
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-info-600 text-white font-medium rounded-md text-sm">
            <Phone className="h-4 w-4" /> Appeler
          </a>
        )}
        {commerce.whatsapp && (
          <a href={`https://wa.me/${commerce.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
            onClick={() => commerceService.incrementWhatsAppClick(id)}
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-success-600 text-white font-medium rounded-md text-sm">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
      </div>
      <div className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link
            href={ROUTES.ANNUAIRE}
            className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;annuaire
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            <PhotoGallery photos={commerce.photos} name={commerce.nom} categorieSlug={commerce.categorie?.slug} />

            <div className="rounded-lg border border-stone-200 p-6">
              <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-stone-400">
                    {categoryNom}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-1.5 tracking-tight">
                    {commerce.nom}
                  </h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleFavori(id)}
                    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    className={`p-2 rounded-md border transition-colors ${
                      isFavorite
                        ? 'bg-error-50 border-error-200 text-error-500'
                        : 'border-stone-300 text-stone-400 hover:text-error-500'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button aria-label="Partager" className="p-2 rounded-md border border-stone-300 text-stone-400 hover:text-stone-900 transition-colors">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Star className="h-4 w-4 fill-primary-600 text-primary-600" />
                <span className="font-medium text-stone-900">{commerce.note}</span>
                <span className="text-sm text-stone-500">({commerce.nombreAvis} avis)</span>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-stone-900">{commerce.adresse}</p>
                    <p className="text-stone-500">{commerce.ville}</p>
                  </div>
                </div>
                {commerce.telephone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-stone-400 shrink-0" />
                    <span className="text-stone-900">{commerce.telephone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 p-6">
              <h2 className="font-semibold text-stone-900 mb-3">Description</h2>
              <p className="text-stone-600 leading-relaxed">{commerce.description}</p>
            </div>

            {commerce.latitude != null && commerce.longitude != null && (
              <div className="rounded-lg border border-stone-200 overflow-hidden">
                <MapLeaflet
                  className="h-64 w-full"
                  center={[commerce.latitude, commerce.longitude]}
                  zoom={15}
                  markers={[
                    {
                      id: commerce.id,
                      position: [commerce.latitude, commerce.longitude],
                      nom: commerce.nom,
                      categorie: categoryNom,
                      note: commerce.note,
                      adresse: commerce.adresse,
                      color: '#1d4ed8',
                    },
                  ]}
                />
              </div>
            )}

            {(summaryLoading || summary) && (
              <div className="rounded-lg border border-stone-200 p-6 bg-primary-50/30">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary-600" />
                  <h2 className="font-semibold text-stone-900">Résumé des avis</h2>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-stone-500 border border-stone-300 rounded px-1.5 py-0.5">
                    IA
                  </span>
                </div>

                {summaryLoading ? (
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Génération du résumé…
                  </div>
                ) : summary ? (
                  <>
                    <p className="text-sm text-stone-700 leading-relaxed">{summary.resume}</p>
                    {(summary.points_forts.length > 0 || summary.points_faibles.length > 0) && (
                      <div className="grid sm:grid-cols-2 gap-5 mt-4">
                        {summary.points_forts.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-success-700 mb-2">
                              Points forts
                            </p>
                            <ul className="space-y-1.5">
                              {summary.points_forts.map((p, i) => (
                                <li key={i} className="text-sm text-stone-600 flex gap-1.5">
                                  <span className="text-success-600 font-semibold">+</span>
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {summary.points_faibles.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-error-700 mb-2">
                              Points faibles
                            </p>
                            <ul className="space-y-1.5">
                              {summary.points_faibles.map((p, i) => (
                                <li key={i} className="text-sm text-stone-600 flex gap-1.5">
                                  <span className="text-error-600 font-semibold">−</span>
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}

            <div className="rounded-lg border border-stone-200 p-6">
              <h2 className="font-semibold text-stone-900 mb-4">Avis ({reviews.length})</h2>

              <form onSubmit={handleSubmitReview} className="mb-6 border border-stone-200 rounded-md p-4">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-stone-800 mb-1.5">Votre note</label>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setReviewRating(star)} className="p-0.5" aria-label={`${star} étoile${star > 1 ? 's' : ''}`}>
                        <Star
                          className={`h-5 w-5 ${
                            star <= reviewRating ? 'fill-primary-600 text-primary-600' : 'fill-transparent text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Partagez votre expérience..."
                  rows={3}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 resize-none"
                />
                {reviewText.trim().length > 0 && reviewText.trim().length < 10 && (
                  <p className="mt-1 text-xs text-error-600">Votre avis doit contenir au moins 10 caractères.</p>
                )}
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={reviewText.trim().length < 10 || reviewRating === 0 || submitting}
                    className="inline-flex items-center gap-2 h-9 px-4 bg-stone-900 text-white text-sm font-medium rounded-md hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Envoyer
                  </button>
                  <button
                    type="button"
                    onClick={() => (dictRecording ? stopDictation() : startDictation())}
                    disabled={dictProcessing}
                    aria-label={dictRecording ? 'Arrêter la dictée' : 'Dicter au micro'}
                    className={`inline-flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-md border transition-colors disabled:opacity-50 ${
                      dictRecording
                        ? 'border-error-300 bg-error-50 text-error-700'
                        : 'border-stone-300 text-stone-600 hover:border-stone-400'
                    }`}
                  >
                    {dictProcessing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : dictRecording ? (
                      <Square className="h-3.5 w-3.5 fill-current" />
                    ) : (
                      <Mic className="h-3.5 w-3.5" />
                    )}
                    {dictProcessing ? 'Transcription…' : dictRecording ? 'Arrêter' : 'Dicter'}
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-stone-400 text-sm text-center py-8">Aucun avis pour le moment.</p>
                ) : (
                  reviews.map((review) => {
                    const nom = review.auteur?.nom || 'Anonyme';
                    return (
                      <div key={review.id} className="border-b border-stone-200 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-md bg-stone-900 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {nom.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-stone-900">{nom}</p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.note ? 'fill-primary-600 text-primary-600' : 'fill-transparent text-stone-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            {review.sentiment && (
                              <span
                                className={`text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded ${SENTIMENT_BADGE[review.sentiment].cls}`}
                                title="Sentiment détecté par l'IA"
                              >
                                {SENTIMENT_BADGE[review.sentiment].label}
                              </span>
                            )}
                            <span className="text-xs text-stone-400">
                              {new Date(review.dateCreation).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-stone-600 ml-11">{review.texte}</p>

                        {isOwner && (
                          <div className="ml-11 mt-2.5">
                            {replies[review.id] ? (
                              <div className="rounded-md border border-stone-200 bg-primary-50/40 p-3">
                                <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400 mb-1 flex items-center gap-1">
                                  <Sparkles className="h-3 w-3" /> Réponse suggérée
                                </p>
                                <p className="text-sm text-stone-700 leading-relaxed">{replies[review.id]}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => navigator.clipboard?.writeText(replies[review.id])}
                                    className="text-xs font-medium text-stone-600 hover:text-stone-900"
                                  >
                                    Copier
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleGenerateReply(review)}
                                    disabled={replyingId === review.id}
                                    className="text-xs font-medium text-stone-500 hover:text-stone-900 disabled:opacity-50"
                                  >
                                    Régénérer
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleGenerateReply(review)}
                                disabled={replyingId === review.id}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 disabled:opacity-50"
                              >
                                {replyingId === review.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3 w-3" />
                                )}
                                Répondre avec l&apos;IA
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="rounded-lg border border-stone-200 p-6 lg:sticky lg:top-20">
              <h2 className="font-semibold text-stone-900 mb-4">Contacter</h2>
              <div className="space-y-2.5">
                {commerce.telephone && (
                  <a
                    href={`tel:${commerce.telephone}`}
                    onClick={() => commerceService.incrementCall(id)}
                    className="flex items-center justify-center gap-2 w-full h-11 bg-info-600 text-white font-medium rounded-md hover:bg-info-700 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Appeler
                  </a>
                )}
                {commerce.whatsapp && (
                  <a
                    href={`https://wa.me/${commerce.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => commerceService.incrementWhatsAppClick(id)}
                    className="flex items-center justify-center gap-2 w-full h-11 bg-success-600 text-white font-medium rounded-md hover:bg-success-700 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-stone-200">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Statistiques</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Vues</span>
                    <span className="font-medium text-stone-900">{commerce.nombreVues}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Appels</span>
                    <span className="font-medium text-stone-900">{commerce.nombreAppels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">WhatsApp</span>
                    <span className="font-medium text-stone-900">{commerce.nombreClicsWhatsApp}</span>
                  </div>
                </div>
              </div>
            </div>

            {related.length > 0 && (
              <div className="rounded-lg border border-stone-200 p-6">
                <h2 className="font-semibold text-stone-900 mb-4">Artisans similaires</h2>
                <div className="space-y-3.5">
                  {related.map((r) => (
                    <Link key={r.id} href={ROUTES.COMMERCE(r.id)} className="flex items-center gap-3 group">
                      <CommercePhoto
                        categorieSlug={r.categorie?.slug}
                        fallbackSrc={r.photos[0]}
                        alt={r.nom}
                        className="w-12 h-12 rounded-md object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900 group-hover:underline truncate">{r.nom}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-primary-600 text-primary-600" />
                          <span className="text-xs text-stone-600">{r.note}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
