import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export const metadata = { title: 'Hors ligne — ArtisanBF' };

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 mb-4">
          <WifiOff className="h-6 w-6 text-stone-500" />
        </div>
        <h1 className="text-xl font-semibold text-stone-900 mb-2">Vous êtes hors ligne</h1>
        <p className="text-stone-500 text-sm mb-6">
          Cette page nécessite une connexion internet. Vérifiez votre connexion puis réessayez.
        </p>
        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center gap-2 h-10 px-5 bg-stone-900 text-white text-sm font-medium rounded-md hover:bg-stone-800 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
