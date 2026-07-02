import { apiFetch } from '@/lib/api-client';

export interface UpdateProfileData {
  nom?: string;
  prenom?: string;
  telephone?: string;
  password?: string;
}

export interface UpdatedProfile {
  id: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  role: string;
}

export const utilisateurService = {
  async updateProfile(id: string, data: UpdateProfileData): Promise<UpdatedProfile> {
    return apiFetch<UpdatedProfile>(`/api/utilisateurs/${id}`, {
      method: 'PUT',
      auth: true,
      body: data,
    });
  },
};
