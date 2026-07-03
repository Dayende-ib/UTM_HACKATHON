import type { Commentaire } from '@/types/commentaire';
import { apiFetch } from '@/lib/api-client';

const API = '/api/avis';

export const commentaireService = {
  async getByCommerceId(commerceId: string): Promise<Commentaire[]> {
    const data = await apiFetch<{ avis: Commentaire[] }>(API, { query: { commerceId } });
    return data.avis || [];
  },

  async getByUserId(userId: string): Promise<Commentaire[]> {
    const data = await apiFetch<{ avis: Commentaire[] }>(API, { query: { userId } });
    return data.avis || [];
  },

  async create(data: {
    texte: string;
    note: number;
    auteurId?: string | null;
    commerceId: string;
  }): Promise<Commentaire> {
    return apiFetch<Commentaire>(API, {
      method: 'POST',
      auth: true,
      body: {
        commerce_id: data.commerceId,
        texte: data.texte,
        note: data.note,
      },
    });
  },

  async delete(id: string): Promise<void> {
    await apiFetch<void>(`${API}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      auth: true,
    });
  },
};
