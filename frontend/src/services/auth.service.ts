import { supabase } from '@/lib/supabase/client';
import type { User } from '@/types/auth';
import { apiFetch } from '@/lib/api-client';

const API = '/api/auth';

function toUser(raw: Record<string, unknown>): User {
  return {
    id: raw.id as string,
    email: (raw.email as string) || '',
    nom: (raw.nom as string) || '',
    prenom: (raw.prenom as string) || '',
    telephone: (raw.telephone as string) || undefined,
    role: (raw.role as User['role']) || 'citoyen',
    avatar: (raw.avatar as string) || undefined,
    dateCreation: (raw.dateCreation as string) || new Date().toISOString(),
    dateModification: (raw.dateModification as string) || new Date().toISOString(),
  };
}

export const authService = {
  async login(email: string, password: string) {
    // signInWithPassword via le client Supabase : pose automatiquement les
    // cookies sb-*-auth-token lisibles par le middleware SSR.
    const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({ email, password });
    if (sbError) throw new Error(sbError.message);

    // Récupère le profil enrichi (nom/prenom/role) depuis notre backend
    const data = await apiFetch<{ user: Record<string, unknown>; token?: string }>(
      `${API}/connexion`,
      { method: 'POST', body: { email, password } }
    );
    return { user: toUser(data.user), token: sbData.session?.access_token || '' };
  },

  async register(data: { email: string; password: string; nom: string; prenom: string; telephone?: string; role?: string }) {
    const json = await apiFetch<{ user: Record<string, unknown>; token?: string }>(
      `${API}/inscription`,
      { method: 'POST', body: data }
    );
    // Connecte aussi via Supabase client pour poser les cookies
    await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    return { user: toUser(json.user), token: json.token || '' };
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  },
};
