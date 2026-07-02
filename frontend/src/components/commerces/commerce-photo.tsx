'use client';

import Image from 'next/image';
import { usePexelsPhotos } from '@/hooks/usePexelsPhotos';
import { CATEGORY_PEXELS_QUERY } from '@/constants/pexels';

interface CommercePhotoProps {
  categorieSlug?: string;
  fallbackSrc: string;
  alt: string;
  index?: number;
  className?: string;
  onError?: () => void;
}

/**
 * Affiche la photo d'un commerce.
 * Priorité : la **photo propre** du commerce (`fallbackSrc`, ex. image
 * téléversée) si elle existe ; sinon une photo **Pexels** pertinente pour la
 * catégorie (via son slug). En dernier recours, un aplat gris.
 *
 * Rendu via `next/image` en mode `fill` : le `className` reçu (taille +
 * arrondis) est porté par le conteneur relatif, ce qui couvre aussi bien
 * les cartes plein-largeur que les vignettes de taille fixe.
 * `unoptimized` : les sources sont externes/variables (Pexels ou URLs DB),
 * on évite ainsi toute erreur de domaine non autorisé.
 */
export function CommercePhoto({
  categorieSlug,
  fallbackSrc,
  alt,
  index = 0,
  className,
  onError,
}: CommercePhotoProps) {
  const query = categorieSlug ? CATEGORY_PEXELS_QUERY[categorieSlug] ?? null : null;
  const { photos } = usePexelsPhotos(query, 4);
  const pexels = photos.length > 0 ? photos[index % photos.length] : undefined;
  const src = fallbackSrc || pexels;

  if (!src) {
    return (
      <span className={`flex items-center justify-center bg-stone-100 ${className ?? ''}`}>
        <span className="text-4xl font-bold text-stone-300" aria-hidden="true">
          {alt.charAt(0)}
        </span>
      </span>
    );
  }

  return (
    <span className={`relative block overflow-hidden ${className ?? ''}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, 400px"
        className="object-cover"
        onError={onError}
        unoptimized
      />
    </span>
  );
}
