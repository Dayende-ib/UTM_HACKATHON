'use client';

import { useEffect } from 'react';

// Enregistre le service worker (app-shell + fallback hors-ligne).
// Composant sans rendu, monté une fois dans le layout racine.
export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* PWA non critique : un échec d'enregistrement ne doit pas casser l'app */
    });
  }, []);

  return null;
}
