"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Phone, MessageCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui";
import { CommercePhoto } from "@/components/commerces/commerce-photo";
import { useFavorites } from "@/hooks/useFavorites";
import { genererLienWhatsApp } from "@/utils/phone";
import { formaterDistance } from "@/utils/distance";
import { ROUTES } from "@/constants";
import type { Commerce } from "@/types";

interface CommerceCardProps {
  commerce: Commerce;
  distance?: number | null;
}

export function CommerceCard({ commerce, distance }: CommerceCardProps) {
  const [imgError, setImgError] = useState(false);
  const { isFavori, toggleFavori } = useFavorites();
  const favori = isFavori(commerce.id);

  const photoUrl =
    commerce.photos.length > 0 && !imgError ? commerce.photos[0] : "";

  // Dérive un index stable depuis l'id pour varier les photos Pexels par carte
  const pexelsIndex = commerce.id
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0) % 4;

  return (
    <Link
      href={ROUTES.COMMERCE(commerce.id)}
      className="group block rounded-lg border border-stone-200 bg-white transition-colors hover:border-stone-400"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-stone-100">
        <CommercePhoto
          categorieSlug={commerce.categorie?.slug}
          fallbackSrc={photoUrl}
          alt={commerce.nom}
          index={pexelsIndex}
          className="h-full w-full"
          onError={() => setImgError(true)}
        />

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavori(commerce.id);
          }}
          className={[
            "absolute right-2.5 top-2.5 rounded-md p-2 transition-colors",
            favori
              ? "bg-error-500 text-white"
              : "bg-white/90 text-stone-500 hover:text-error-500",
          ].join(" ")}
          aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart className="h-4 w-4" fill={favori ? "currentColor" : "none"} />
        </button>

        {distance != null && distance > 0 && (
          <div className="absolute bottom-2.5 left-2.5 rounded-md bg-stone-900/80 px-2.5 py-1 text-xs font-medium text-white">
            {formaterDistance(distance)}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-base font-medium text-stone-900 group-hover:underline line-clamp-1">
            {commerce.nom}
          </h3>
          {commerce.categorie && (
            <Badge variant="warm" size="sm">
              {commerce.categorie.nom}
            </Badge>
          )}
        </div>

        <div className="mb-2.5 flex items-center gap-1">
          <Star className="h-4 w-4 fill-primary-600 text-primary-600" />
          <span className="text-sm font-medium text-stone-700">
            {commerce.note.toFixed(1)}
          </span>
          <span className="text-xs text-stone-400">({commerce.nombreAvis})</span>
        </div>

        <div className="mb-3.5 flex items-center gap-1.5 text-sm text-stone-500">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{commerce.adresse}</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${commerce.telephone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-900"
          >
            <Phone className="h-3.5 w-3.5" />
            Appeler
          </a>
          <a
            href={genererLienWhatsApp(commerce.whatsapp ?? commerce.telephone)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 rounded-md bg-success-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-success-700"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
        </div>
      </div>
    </Link>
  );
}
