import type { Commerce, CreateCommerceData } from '@/types/commerce';
import { apiFetch, ApiError } from '@/lib/api-client';
import { db } from '@/lib/db';

const API = '/api/commerces';

export interface DayStats {
  date: string;
  vues: number;
  appels: number;
  whatsapp: number;
}

export function mapCommerce(row: Record<string, unknown>): Commerce {
  const categories = row.categories as Record<string, unknown> | null;
  const artisans = row.utilisateurs as Record<string, unknown> | null;
  return {
    id: row.id as string,
    nom: row.nom as string,
    description: row.description as string,
    categorieId: row.categorie_id as string,
    categorie: categories ? {
      id: categories.id as string,
      nom: categories.nom as string,
      slug: (categories.slug as string) || '',
      icone: (categories.icone as string) || '',
      description: categories.description as string | undefined,
      nombreCommerces: (categories.nombre_commerces as number) || 0,
    } : undefined,
    artisanId: row.artisan_id as string,
    artisan: artisans ? {
      id: artisans.id as string,
      nom: (artisans.nom as string) || '',
      prenom: (artisans.prenom as string) || '',
      email: (artisans.email as string) || '',
      role: 'artisan' as const,
      estActif: true,
      dateCreation: '',
    } : undefined,
    adresse: row.adresse as string,
    ville: row.ville as string,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    telephone: row.telephone as string,
    whatsapp: (row.whatsapp as string) || undefined,
    email: (row.email as string) || undefined,
    photos: (row.photos as string[]) || [],
    note: (row.note_moyenne as number) || 0,
    nombreAvis: (row.nombre_avis as number) || 0,
    nombreVues: (row.nombre_vues as number) || 0,
    nombreAppels: (row.nombre_appels as number) || 0,
    nombreClicsWhatsApp: (row.nombre_clics_whatsapp as number) || 0,
    estPublic: row.est_public as boolean,
    dateCreation: row.created_at as string,
    dateModification: row.updated_at as string,
  };
}

export interface CommerceFilters {
  categorieId?: string;
  ville?: string;
  search?: string;
  artisanId?: string;
  noteMin?: number;
}

export interface PaginatedCommerces {
  commerces: Commerce[];
  total: number;
  page: number;
  limit: number;
}

export const commerceService = {
  async getAll(filters?: CommerceFilters): Promise<Commerce[]> {
    try {
      const data = await apiFetch<{ commerces?: Record<string, unknown>[] }>(API, {
        query: {
          categorie: filters?.categorieId,
          search: filters?.search,
          artisanId: filters?.artisanId,
        },
      });
      const commerces = (data.commerces || []).map(mapCommerce);
      if (commerces.length > 0) void db.commerces.bulkPut(commerces).catch(() => {});
      return commerces;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      // Panne réseau : on retombe sur le cache local (filtré côté client).
      let cached = await db.commerces.toArray();
      if (filters?.categorieId) cached = cached.filter((c) => c.categorieId === filters.categorieId);
      if (filters?.artisanId) cached = cached.filter((c) => c.artisanId === filters.artisanId);
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        cached = cached.filter((c) => c.nom.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
      }
      return cached;
    }
  },

  /** Recherche paginée côté serveur (annuaire) : évite de charger tout le catalogue d'un coup. */
  async search(filters: CommerceFilters & { page?: number; limit?: number }): Promise<PaginatedCommerces> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 9;
    try {
      const data = await apiFetch<{ commerces?: Record<string, unknown>[]; total?: number }>(API, {
        query: {
          categorie: filters.categorieId,
          search: filters.search,
          artisanId: filters.artisanId,
          ville: filters.ville,
          noteMin: filters.noteMin,
          page,
          limit,
        },
      });
      const commerces = (data.commerces || []).map(mapCommerce);
      if (commerces.length > 0) void db.commerces.bulkPut(commerces).catch(() => {});
      return { commerces, total: data.total ?? commerces.length, page, limit };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      // Panne réseau : filtre + pagine le cache local.
      let cached = await db.commerces.toArray();
      if (filters.categorieId) cached = cached.filter((c) => c.categorieId === filters.categorieId);
      if (filters.artisanId) cached = cached.filter((c) => c.artisanId === filters.artisanId);
      if (filters.ville && filters.ville !== 'Toutes') {
        cached = cached.filter((c) => c.ville.toLowerCase() === filters.ville!.toLowerCase());
      }
      if (filters.noteMin) cached = cached.filter((c) => c.note >= filters.noteMin!);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        cached = cached.filter((c) => c.nom.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
      }
      const total = cached.length;
      const start = (page - 1) * limit;
      return { commerces: cached.slice(start, start + limit), total, page, limit };
    }
  },

  async getById(id: string): Promise<Commerce | undefined> {
    try {
      const data = await apiFetch<Record<string, unknown>>(`${API}/${id}`);
      const commerce = mapCommerce(data);
      void db.commerces.put(commerce).catch(() => {});
      return commerce;
    } catch (error) {
      if (error instanceof ApiError) return undefined;
      return db.commerces.get(id);
    }
  },

  async create(data: CreateCommerceData, artisanId: string): Promise<Commerce> {
    const row = await apiFetch<Record<string, unknown>>(API, {
      method: 'POST',
      auth: true,
      body: data,
    });
    return mapCommerce(row);
  },

  async update(
    id: string,
    data: Partial<CreateCommerceData & { estPublic: boolean }>
  ): Promise<Commerce> {
    const row = await apiFetch<Record<string, unknown>>(`${API}/${id}`, {
      method: 'PUT',
      auth: true,
      body: data,
    });
    return mapCommerce(row);
  },

  async delete(id: string): Promise<void> {
    await apiFetch<void>(`${API}/${id}`, { method: 'DELETE', auth: true });
  },

  async incrementStat(id: string, type: 'vue' | 'appel' | 'whatsapp'): Promise<void> {
    // Tracking best-effort : une erreur ne doit jamais casser l'UI.
    try {
      await apiFetch<void>(`${API}/${id}/stats`, { method: 'POST', body: { type } });
    } catch {
      /* silencieux */
    }
  },

  incrementView(id: string): Promise<void> {
    return this.incrementStat(id, 'vue');
  },

  incrementCall(id: string): Promise<void> {
    return this.incrementStat(id, 'appel');
  },

  incrementWhatsAppClick(id: string): Promise<void> {
    return this.incrementStat(id, 'whatsapp');
  },

  async getStatsEvolution(id: string, days = 7): Promise<DayStats[]> {
    const data = await apiFetch<{ days: DayStats[] }>(`${API}/${id}/stats/evolution`, {
      query: { days },
    });
    return data.days || [];
  },
};
