'use client';

import { WifiOff } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';

export default function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="sticky top-16 z-40 bg-stone-900 text-white text-xs sm:text-sm px-4 py-2 flex items-center justify-center gap-2">
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      Vous êtes hors connexion - certaines fonctionnalités peuvent être limitées.
    </div>
  );
}
