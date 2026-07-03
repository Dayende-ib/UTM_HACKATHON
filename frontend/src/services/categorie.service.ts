import type { Categorie } from '@/types/commerce';
import { apiFetch, ApiError } from '@/lib/api-client';
import { db } from '@/lib/db';

const API = '/api/categories';

function mapCategorie(row: Record<string, unknown>): Categorie {
  return {
    id: row.id as string,
    nom: row.nom as string,
    slug: (row.slug as string) || '',
    icone: (row.icone as string) || '',
    description: (row.description as string) || undefined,
    nombreCommerces: (row.nombre_commerces as number) || 0,
  };
}

export const categorieService = {
  async getAll(): Promise<Categorie[]> {
    try {
      const data = await apiFetch<unknown>(API);
      const categories = (Array.isArray(data) ? data : []).map(mapCategorie);
      if (categories.length > 0) void db.categories.bulkPut(categories).catch(() => {});
      return categories;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      return db.categories.toArray();
    }
  },

  async getById(id: string): Promise<Categorie | undefined> {
    const all = await this.getAll();
    return all.find((c) => c.id === id);
  },
};
