'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/auth.store';
import { utilisateurService } from '@/services/utilisateur.service';
import { useToast } from '@/components/ui/toast';
import { Camera, Lock, Trash2, Save, Loader2, Store, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export default function ProfilPage() {
  const { user, logout, updateUser } = useAuthStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    telephone: user?.telephone || '',
  });
  const [passwords, setPasswords] = useState({
    newPass: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [becomingArtisan, setBecomingArtisan] = useState(false);

  const inputClass =
    'w-full h-10 px-3 border border-stone-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900';

  const handleProfileSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await utilisateurService.updateProfile(user.id, {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
      });
      updateUser({ nom: updated.nom, prenom: updated.prenom, telephone: updated.telephone ?? undefined });
      toast('success', 'Profil mis à jour.');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    if (passwords.newPass.length < 6) {
      toast('error', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (passwords.newPass !== passwords.confirmPassword) {
      toast('error', 'Les mots de passe ne correspondent pas.');
      return;
    }
    setChangingPassword(true);
    try {
      await utilisateurService.updateProfile(user.id, { password: passwords.newPass });
      setPasswords({ newPass: '', confirmPassword: '' });
      toast('success', 'Mot de passe changé.');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleBecomeArtisan = async () => {
    if (!user || user.role !== 'citoyen') return;
    setBecomingArtisan(true);
    try {
      const updated = await utilisateurService.becomeArtisan(user.id);
      updateUser({ role: updated.role as 'artisan' });
      toast('success', 'Votre compte artisan est activé. Vous pouvez publier vos commerces.');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : "Impossible d'activer le compte artisan.");
    } finally {
      setBecomingArtisan(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Mon profil</h1>
        <p className="text-stone-500 text-sm mt-1.5">Gérez vos informations personnelles</p>
      </div>

      <div className="rounded-lg border border-stone-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {user?.avatar ? (
              <Image src={user.avatar} alt={user.prenom} width={64} height={64} className="h-16 w-16 rounded-md object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-md bg-stone-900 flex items-center justify-center">
                <span className="text-xl font-semibold text-white">
                  {user?.prenom[0]}{user?.nom[0]}
                </span>
              </div>
            )}
            <button className="absolute -bottom-1 -right-1 p-1.5 bg-stone-900 text-white rounded-full hover:bg-stone-800">
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div>
            <h3 className="font-medium text-stone-900">{user?.prenom} {user?.nom}</h3>
            <p className="text-sm text-stone-500 capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1.5">Prénom</label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => setForm((p) => ({ ...p, prenom: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1.5">Nom</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-800 mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className={`${inputClass} bg-stone-50 text-stone-400 cursor-not-allowed`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-800 mb-1.5">Téléphone</label>
            <input
              type="tel"
              value={form.telephone}
              onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleProfileSave}
              disabled={saving}
              className="flex items-center gap-2 h-9 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-md text-sm transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>

      {user?.role === 'citoyen' && (
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-md bg-stone-900 text-white flex items-center justify-center shrink-0">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-stone-900">Devenir artisan</h2>
              <p className="mt-1 text-sm text-stone-600">
                Activez votre espace artisan pour publier et gérer vos commerces.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={handleBecomeArtisan}
                  disabled={becomingArtisan}
                  className="inline-flex items-center gap-2 h-9 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-md text-sm transition-colors disabled:opacity-50"
                >
                  {becomingArtisan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
                  Activer mon compte artisan
                </button>
                <a
                  href={ROUTES.DASHBOARD_COMMERCES}
                  className="inline-flex items-center gap-2 h-9 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium rounded-md text-sm transition-colors"
                >
                  Mes commerces
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-stone-200 p-6">
        <h2 className="text-base font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-stone-400" />
          Changer le mot de passe
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-800 mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              value={passwords.newPass}
              onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-800 mb-1.5">Confirmer le mot de passe</label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePasswordChange}
              disabled={changingPassword || !passwords.newPass}
              className="flex items-center gap-2 h-9 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium rounded-md text-sm transition-colors disabled:opacity-50"
            >
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Changer le mot de passe
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-error-200 bg-error-50 p-6">
        <h2 className="text-base font-semibold text-error-900 mb-2 flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Zone de danger
        </h2>
        <p className="text-sm text-error-700 mb-4">
          La déconnexion mettra fin à votre session actuelle.
        </p>
        <button
          onClick={() => {
            if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
              logout();
            }
          }}
          className="h-9 px-4 bg-error-600 hover:bg-error-700 text-white font-medium rounded-md text-sm transition-colors"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
