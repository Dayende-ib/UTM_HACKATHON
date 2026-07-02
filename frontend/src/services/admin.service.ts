import { apiFetch } from '@/lib/api-client';
import type { Commerce } from '@/types/commerce';
import type { Utilisateur } from '@/types/utilisateur';
import type { Commentaire } from '@/types/commentaire';

// ── Types de réponse API ─────────────────────────────────────

export interface AdminStats {
  total_utilisateurs: number;
  total_commerces: number;
  total_avis: number;
  total_vues: number;
  signalements_en_attente: number;
  avis_spam: number;
  activite_recente: { type: string; description: string; date: string; id: string }[];
  repartition_categories: { nom: string; nombre_commerces: number; pourcentage: number }[];
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}

export interface Signalement {
  id: string;
  signaleur: string;
  commentaireTexte: string;
  commerce: string;
  commerceId?: string;
  avisId?: string;
  raison: string;
  description?: string;
  date: string;
  statut: 'pending' | 'resolved' | 'dismissed';
  noteModerateur?: string;
  resoluPar?: string;
  resoluLe?: string;
}

export interface Categorie {
  id: string;
  nom: string;
  slug: string;
  icone: string;
  description?: string;
  nombreCommerces: number;
}

// ── Service Admin ────────────────────────────────────────────

export const adminService = {
  // ── Stats ────────────────────────────────────────────────
  async getStats(): Promise<AdminStats> {
    return apiFetch<AdminStats>('/api/admin/stats', { auth: true });
  },

  // ── Utilisateurs ─────────────────────────────────────────
  async getUsers(params?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: Utilisateur[]; total: number; page: number; limit: number }> {
    return apiFetch('/api/admin/users', {
      auth: true,
      query: {
        search: params?.search,
        role: params?.role,
        page: params?.page,
        limit: params?.limit,
      },
    });
  },

  async updateUser(
    id: string,
    data: { action: 'activer' | 'desactiver' | 'changer_role'; role?: string }
  ): Promise<{ success: boolean; action: string; userId: string }> {
    return apiFetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      auth: true,
      body: data,
    });
  },

  async deleteUser(id: string): Promise<void> {
    return apiFetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  // ── Commerces ────────────────────────────────────────────
  async getCommerces(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ commerces: Commerce[]; total: number; page: number; limit: number }> {
    return apiFetch('/api/admin/commerces', {
      auth: true,
      query: {
        search: params?.search,
        page: params?.page,
        limit: params?.limit,
      },
    });
  },

  async toggleCommercePublic(id: string): Promise<{ success: boolean; estPublic: boolean }> {
    return apiFetch(`/api/admin/commerces/${id}/toggle`, {
      method: 'PUT',
      auth: true,
    });
  },

  async updateCommerce(
    id: string,
    data: {
      nom?: string;
      description?: string;
      categorieId?: string;
      adresse?: string;
      ville?: string;
      telephone?: string;
      whatsapp?: string;
      email?: string;
    }
  ): Promise<{ success: boolean; commerce: Record<string, unknown> }> {
    return apiFetch(`/api/admin/commerces/${id}`, {
      method: 'PUT',
      auth: true,
      body: data,
    });
  },

  async deleteCommerce(id: string): Promise<void> {
    return apiFetch(`/api/admin/commerces/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  // ── Avis / Commentaires ──────────────────────────────────
  async getAvis(params?: {
    filtre?: 'tous' | 'approuves' | 'spam';
    page?: number;
    limit?: number;
  }): Promise<{ avis: Commentaire[]; total: number; page: number; limit: number }> {
    return apiFetch('/api/admin/avis', {
      auth: true,
      query: {
        filtre: params?.filtre,
        page: params?.page,
        limit: params?.limit,
      },
    });
  },

  async markSpam(id: string): Promise<{ success: boolean; isSpam: boolean }> {
    return apiFetch(`/api/admin/avis/${id}/spam`, {
      method: 'PUT',
      auth: true,
    });
  },

  async approveAvis(id: string): Promise<{ success: boolean; isSpam: boolean }> {
    return apiFetch(`/api/admin/avis/${id}/approve`, {
      method: 'PUT',
      auth: true,
    });
  },

  async deleteAvis(id: string): Promise<void> {
    return apiFetch(`/api/admin/avis/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  // ── Catégories ───────────────────────────────────────────
  async getCategories(): Promise<Categorie[]> {
    return apiFetch<Categorie[]>('/api/admin/categories', { auth: true });
  },

  async createCategory(data: {
    nom: string;
    slug: string;
    icone?: string;
    description?: string;
  }): Promise<Categorie> {
    return apiFetch<Categorie>('/api/admin/categories', {
      method: 'POST',
      auth: true,
      body: data,
    });
  },

  async updateCategory(
    id: string,
    data: { nom?: string; slug?: string; icone?: string; description?: string }
  ): Promise<Categorie> {
    return apiFetch<Categorie>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      auth: true,
      body: data,
    });
  },

  async deleteCategory(id: string): Promise<void> {
    return apiFetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  // ── Signalements ─────────────────────────────────────────
  async getSignalements(statut?: string): Promise<Signalement[]> {
    return apiFetch<Signalement[]>('/api/admin/signalements', {
      auth: true,
      query: { statut },
    });
  },

  async resolveSignalement(id: string, noteModerateur?: string): Promise<{ success: boolean; statut: string }> {
    return apiFetch(`/api/admin/signalements/${id}`, {
      method: 'PUT',
      auth: true,
      body: { action: 'resolve', note_moderateur: noteModerateur },
    });
  },

  async dismissSignalement(id: string, noteModerateur?: string): Promise<{ success: boolean; statut: string }> {
    return apiFetch(`/api/admin/signalements/${id}`, {
      method: 'PUT',
      auth: true,
      body: { action: 'dismiss', note_moderateur: noteModerateur },
    });
  },

  async deleteSignalement(id: string): Promise<void> {
    return apiFetch(`/api/admin/signalements/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },
};
