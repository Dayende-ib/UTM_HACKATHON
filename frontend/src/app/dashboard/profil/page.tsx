'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { utilisateurService } from '@/services/utilisateur.service';
import { useToast } from '@/components/ui/toast';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  User,
  ShieldCheck,
  LogOut,
  Store,
  ArrowRight,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const ROLE_LABEL: Record<string, string> = {
  citoyen: 'Citoyen',
  artisan: 'Artisan',
  admin: 'Administrateur',
};

const inputClass =
  'w-full h-10 px-3 border border-stone-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900';

function Section({
  icon: Icon,
  title,
  description,
  accent = 'bg-stone-900',
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accent?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className={`h-9 w-9 rounded-md ${accent} text-white flex items-center justify-center shrink-0`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-stone-900">{title}</h2>
          <p className="text-sm text-stone-500 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ProfilPage() {
  const { user, logout, updateUser } = useAuthStore();
  const { toast } = useToast();

  const initialForm = useMemo(
    () => ({
      prenom: user?.prenom || '',
      nom: user?.nom || '',
      telephone: user?.telephone || '',
    }),
    [user]
  );
  const [form, setForm] = useState(initialForm);
  const isDirty =
    form.prenom !== initialForm.prenom ||
    form.nom !== initialForm.nom ||
    form.telephone !== initialForm.telephone;

  const [passwords, setPasswords] = useState({ newPass: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const passwordTooShort = passwords.newPass.length > 0 && passwords.newPass.length < 6;
  const passwordsMismatch =
    passwords.confirmPassword.length > 0 && passwords.newPass !== passwords.confirmPassword;

  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [becomingArtisan, setBecomingArtisan] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

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
    if (passwordTooShort || passwords.newPass.length === 0) {
      toast('error', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (passwordsMismatch) {
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
        <p className="text-stone-500 text-sm mt-1.5">Gérez vos informations personnelles et la sécurité de votre compte</p>
      </div>

      <Section icon={User} title="Informations personnelles" description="Votre identité sur ArtisanBF">
        <div className="flex items-center gap-4 mb-6">
          <Avatar src={user?.avatar} alt={user?.prenom || ''} name={`${user?.prenom || ''} ${user?.nom || ''}`} size="lg" />
          <div>
            <p className="font-medium text-stone-900">{user?.prenom} {user?.nom}</p>
            <Badge variant="outline" size="sm" className="mt-1">
              {user ? ROLE_LABEL[user.role] || user.role : ''}
            </Badge>
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
              placeholder="+226 XX XX XX XX"
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleProfileSave} disabled={!isDirty || saving} loading={saving}>
              <Save className="h-4 w-4" />
              Enregistrer
            </Button>
            {isDirty && !saving && (
              <Button variant="ghost" onClick={() => setForm(initialForm)}>
                Annuler
              </Button>
            )}
          </div>
        </div>
      </Section>

      {user?.role === 'citoyen' && (
        <Section
          icon={Store}
          title="Devenir artisan"
          description="Activez votre espace artisan pour publier et gérer vos commerces"
          accent="bg-primary-600"
        >
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleBecomeArtisan} disabled={becomingArtisan} loading={becomingArtisan}>
              <Store className="h-4 w-4" />
              Activer mon compte artisan
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = ROUTES.DASHBOARD_COMMERCES)}>
              Mes commerces
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Section>
      )}

      <Section icon={ShieldCheck} title="Sécurité" description="Changez votre mot de passe">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-800 mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwords.newPass}
                onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPasswords((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                aria-label={showPasswords ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordTooShort && (
              <p className="text-xs text-error-600 mt-1">Au moins 6 caractères requis.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-800 mb-1.5">Confirmer le mot de passe</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
              className={inputClass}
            />
            {passwordsMismatch && (
              <p className="text-xs text-error-600 mt-1">Les mots de passe ne correspondent pas.</p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handlePasswordChange}
            disabled={changingPassword || !passwords.newPass || passwordsMismatch}
            loading={changingPassword}
          >
            <ShieldCheck className="h-4 w-4" />
            Changer le mot de passe
          </Button>
        </div>
      </Section>

      <Section icon={LogOut} title="Compte" description="Gérez votre session">
        <Button variant="outline" onClick={() => setLogoutModalOpen(true)}>
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </Button>
      </Section>

      <Modal open={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} title="Se déconnecter" size="sm">
        <p className="text-sm text-stone-600 mb-5">Voulez-vous vraiment mettre fin à votre session ?</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setLogoutModalOpen(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={logout}>
            Se déconnecter
          </Button>
        </div>
      </Modal>
    </div>
  );
}
