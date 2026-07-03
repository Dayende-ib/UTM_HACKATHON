'use client';

import { useEffect } from 'react';
import { flushPendingAvis } from '@/lib/offline-queue';

// Vide la file d'avis en attente dès que la connexion revient.
// Composant sans rendu, monté une fois dans le layout racine.
export default function OfflineSync() {
  useEffect(() => {
    if (navigator.onLine) flushPendingAvis();

    window.addEventListener('online', flushPendingAvis);
    return () => window.removeEventListener('online', flushPendingAvis);
  }, []);

  return null;
}
