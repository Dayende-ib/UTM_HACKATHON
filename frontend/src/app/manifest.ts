import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ArtisanBF - Annuaire des artisans du Burkina Faso',
    short_name: 'ArtisanBF',
    description:
      "L'annuaire intelligent des artisans du Burkina Faso. Trouvez, contactez et évaluez le bon artisan près de chez vous.",
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#1c1917',
    lang: 'fr',
    dir: 'ltr',
    categories: ['business', 'lifestyle', 'utilities'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: "J'ai une urgence",
        short_name: 'Urgence',
        description: "Trouver l'artisan disponible le plus proche",
        url: '/urgence',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Annuaire',
        short_name: 'Rechercher',
        description: 'Parcourir les artisans par métier ou ville',
        url: '/annuaire',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
