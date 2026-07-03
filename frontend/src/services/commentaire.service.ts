import type { Commentaire } from '@/types/commentaire';
import { apiFetch, ApiError } from '@/lib/api-client';
import { db } from '@/lib/db';
import { queueAvis } from '@/lib/offline-queue';

const API = '/api/avis';

export const commentaireService = {
  async getByCommerceId(commerceId: string): Promise<Commentaire[]> {
    try {
      const data = await apiFetch<{ avis: Commentaire[] }>(API, { query: { commerceId } });
      const avis = data.avis || [];
      if (avis.length > 0) void db.avis.bulkPut(avis).catch(() => {});
      return avis;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      return db.avis.where('commerceId').equals(commerceId).toArray();
    }
  },

  async getByUserId(userId: string): Promise<Commentaire[]> {
    try {
      const data = await apiFetch<{ avis: Commentaire[] }>(API, { query: { userId } });
      const avis = data.avis || [];
      if (avis.length > 0) void db.avis.bulkPut(avis).catch(() => {});
      return avis;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      return db.avis.where('auteurId').equals(userId).toArray();
    }
  },

  async create(data: {
    texte: string;
    note: number;
    auteurId?: string | null;
    commerceId: string;
  }): Promise<Commentaire> {
    try {
      return await apiFetch<Commentaire>(API, {
        method: 'POST',
        auth: true,
        body: {
          commerce_id: data.commerceId,
          texte: data.texte,
          note: data.note,
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      // Pas de réseau : on enregistre l'avis localement, il sera envoyé pour
      // de vrai dès la reconnexion (voir offline-sync.tsx).
      return queueAvis({
        commerceId: data.commerceId,
        texte: data.texte,
        note: data.note,
        auteurId: data.auteurId ?? null,
      });
    }
  },

  async delete(id: string): Promise<void> {
    await apiFetch<void>(`${API}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      auth: true,
    });
  },
};
