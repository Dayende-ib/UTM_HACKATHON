import { db, type PendingAvis } from '@/lib/db';
import { apiFetch } from '@/lib/api-client';
import type { Commentaire } from '@/types/commentaire';

const API = '/api/avis';

export async function queueAvis(data: {
  commerceId: string;
  texte: string;
  note: number;
  auteurId: string | null;
}): Promise<Commentaire> {
  const pending: PendingAvis = {
    id: `pending-${crypto.randomUUID()}`,
    commerceId: data.commerceId,
    texte: data.texte,
    note: data.note,
    auteurId: data.auteurId,
    createdAt: Date.now(),
  };
  await db.pendingAvis.put(pending);

  return {
    id: pending.id,
    texte: pending.texte,
    note: pending.note,
    auteurId: pending.auteurId,
    commerceId: pending.commerceId,
    estSpam: false,
    estModer: false,
    dateCreation: new Date(pending.createdAt).toISOString(),
    _pending: true,
  };
}

export async function flushPendingAvis(): Promise<void> {
  const pending = await db.pendingAvis.toArray();
  for (const item of pending) {
    try {
      await apiFetch<Record<string, unknown>>(API, {
        method: 'POST',
        auth: true,
        body: { commerce_id: item.commerceId, texte: item.texte, note: item.note },
      });
      await db.pendingAvis.delete(item.id);
    } catch {
      // Toujours pas de réseau (ou le serveur refuse) : on retentera à la
      // prochaine reconnexion, l'item reste dans la file.
    }
  }
}
