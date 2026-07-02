"use client";

import "leaflet/dist/leaflet.css";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { useEffect, useRef } from "react";
import { OUAGADOUGOU_CENTER, DEFAULT_ZOOM } from "@/lib/leaflet";
import type { MapMarker } from "./map-types";

interface MapContentLoaderProps {
  markers?: MapMarker[];
  userLocation?: { latitude: number; longitude: number } | null;
  onMarkerClick?: (id: string) => void;
  /** Si fourni, un clic sur la carte renvoie ses coordonnées (sélection de position). */
  onMapClick?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

const PIN_COLOR = "#1c1917"; // stone-900
const USER_COLOR = "#2563eb";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pinSvg(color: string): string {
  return `
    <svg class="artisan-pin-svg" width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.27 21.73 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="5" fill="#ffffff"/>
    </svg>`;
}

function starSvg(): string {
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="#d97706" style="display:inline-block;vertical-align:-1px"><path d="M12 2l2.9 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17l-6.2 3.6 1.6-6.7L2.2 8.9l6.9-.6z"/></svg>`;
}

function formatDistance(distanceKm: number): string {
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;
}

function buildPopup(marker: MapMarker, onClick?: (id: string) => void): HTMLElement {
  const el = document.createElement("div");
  el.className = "artisan-popup w-60";

  const nom = marker.nom ?? marker.popup ?? "";
  const parts: string[] = [
    `<div class="artisan-popup__header">`,
    `<p class="artisan-popup__title">${escapeHtml(nom)}</p>`,
    `</div>`,
  ];
  if (marker.categorie) {
    parts.push(`<p class="artisan-popup__category">${escapeHtml(marker.categorie)}</p>`);
  }

  const meta: string[] = [];
  if (typeof marker.note === "number" && marker.note > 0) {
    meta.push(`<span class="artisan-popup__meta-item">${starSvg()} ${marker.note.toFixed(1)}</span>`);
  }
  if (typeof marker.distanceKm === "number") {
    meta.push(`<span class="artisan-popup__meta-item">${formatDistance(marker.distanceKm)}</span>`);
  }
  if (meta.length) {
    parts.push(`<div class="artisan-popup__meta">${meta.join('<span class="artisan-popup__meta-separator">·</span>')}</div>`);
  }
  if (marker.adresse) {
    parts.push(`<p class="artisan-popup__address">${escapeHtml(marker.adresse)}</p>`);
  }
  if (onClick) {
    parts.push(`<button type="button" class="artisan-popup__action">Voir la fiche</button>`);
  }

  el.innerHTML = parts.join("");
  const btn = el.querySelector("button");
  btn?.addEventListener("click", () => onClick?.(marker.id));
  return el;
}

export default function MapContentLoader({
  markers = [],
  userLocation,
  onMarkerClick,
  onMapClick,
  center = OUAGADOUGOU_CENTER,
  zoom = DEFAULT_ZOOM,
}: MapContentLoaderProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const fitBoundsRef = useRef<(() => void) | null>(null);
  // Ref plutôt que dépendance d'effet : évite de recréer la carte à chaque
  // nouvelle identité de fonction `onMapClick` passée par le parent.
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initialisation de la carte (une seule fois)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, { center, zoom, zoomControl: false });

      L.control.zoom({ position: "topright" }).addTo(map);
      L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Groupe dédié aux markers (nettoyage propre sans toucher aux tuiles)
      markerLayerRef.current = L.layerGroup().addTo(map);

      // Contrôle « recentrer » : réajuste la vue sur tous les points
      const RecenterControl = L.Control.extend({
        options: { position: "topright" },
        onAdd() {
          const btn = L.DomUtil.create("button", "leaflet-bar leaflet-control-artisan-recenter");
          btn.type = "button";
          btn.title = "Recentrer";
          btn.setAttribute("aria-label", "Recentrer la carte");
          btn.innerHTML =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';
          L.DomEvent.on(btn, "click", (e: Event) => {
            L.DomEvent.stop(e);
            fitBoundsRef.current?.();
          });
          return btn;
        },
      });
      map.addControl(new RecenterControl());

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        onMapClickRef.current?.(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      cancelled = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markerLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mise à jour des markers + position utilisateur
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    import("leaflet").then((L) => {
      const group = markerLayerRef.current;
      if (!group) return;
      group.clearLayers();

      const bounds: [number, number][] = [];

      markers.forEach((marker) => {
        const icon = L.divIcon({
          className: "artisan-pin",
          html: pinSvg(marker.color ?? PIN_COLOR),
          iconSize: [28, 38],
          iconAnchor: [14, 38],
          popupAnchor: [0, -34],
        });
        const m = L.marker(marker.position, { icon }).addTo(group);
        m.bindPopup(buildPopup(marker, onMarkerClick), { minWidth: 208, closeButton: true });
        // Un clic sur le pin lui-même déclenche aussi la navigation
        m.on("dblclick", () => onMarkerClick?.(marker.id));
        bounds.push(marker.position);
      });

      if (userLocation) {
        const pos: [number, number] = [userLocation.latitude, userLocation.longitude];
        const userIcon = L.divIcon({
          className: "artisan-user-marker",
          html:
            '<span class="artisan-user-marker__pulse"></span>' +
            '<span class="artisan-user-marker__dot"></span>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker(pos, { icon: userIcon }).addTo(group).bindPopup("Votre position");
        L.circle(pos, {
          radius: 140,
          color: USER_COLOR,
          weight: 1,
          fillColor: USER_COLOR,
          fillOpacity: 0.08,
        }).addTo(group);
        bounds.push(pos);
      }

      // Fonction de recadrage réutilisée par le contrôle « recentrer »
      fitBoundsRef.current = () => {
        if (bounds.length === 1) {
          map.setView(bounds[0], 15);
        } else if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
      };
      fitBoundsRef.current();
    });
  }, [markers, userLocation, onMarkerClick]);

  return <div ref={mapRef} className="h-full w-full" />;
}
