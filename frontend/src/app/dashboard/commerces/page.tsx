'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/stores/auth.store';
import { commerceService } from '@/services/commerce.service';
import { categorieService } from '@/services/categorie.service';
import { uploadService } from '@/services/upload.service';
import { geolocationService } from '@/services/geolocation.service';
import { useToast } from '@/components/ui/toast';
import { ROUTES } from '@/constants/routes';
import { Plus, Edit2, Trash2, Eye, Star, X, Store, Loader2, ImagePlus, LocateFixed, MapPin } from 'lucide-react';
import MapLeaflet from '@/components/maps/map-leaflet';
import type { Commerce, Categorie } from '@/types/commerce';

// Coordonnées par défaut (centre de Ouagadougou) tant qu'aucun géocodage n'est fait.
const DEFAULT_COORDS = { latitude: 12.3714, longitude: -1.5197 };

export default function CommercesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.role !== 'artisan') {
      router.push(ROUTES.DASHBOARD);
    }
  }, [user, router]);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingCommerce, setEditingCommerce] = useState<Commerce | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    categorieId: '',
    adresse: '',
    ville: '',
    telephone: '',
    photos: [] as string[],
    latitude: DEFAULT_COORDS.latitude,
    longitude: DEFAULT_COORDS.longitude,
  });
  const [locating, setLocating] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let annule = false;
    commerceService
      .getAll({ artisanId: user.id })
      .then((list) => !annule && setCommerces(list))
      .catch(() => !annule && toast('error', 'Erreur de chargement de vos commerces.'))
      .finally(() => !annule && setLoading(false));
    return () => {
      annule = true;
    };
  }, [user?.id, toast]);

  useEffect(() => {
    categorieService.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  const handleOpenModal = (commerce?: Commerce) => {
    setResolvedAddress(null);
    if (commerce) {
      setEditingCommerce(commerce);
      setFormData({
        nom: commerce.nom,
        description: commerce.description,
        categorieId: commerce.categorieId,
        adresse: commerce.adresse,
        ville: commerce.ville,
        telephone: commerce.telephone,
        photos: commerce.photos ?? [],
        latitude: commerce.latitude ?? DEFAULT_COORDS.latitude,
        longitude: commerce.longitude ?? DEFAULT_COORDS.longitude,
      });
    } else {
      setEditingCommerce(null);
      setFormData({
        nom: '', description: '', categorieId: '', adresse: '', ville: '', telephone: '', photos: [],
        latitude: DEFAULT_COORDS.latitude, longitude: DEFAULT_COORDS.longitude,
      });
    }
    setShowModal(true);
  };

  // Position choisie sur la carte ou via la géolocalisation : met à jour le
  // formulaire et propose l'adresse résolue (sans écraser une adresse déjà saisie).
  const setPosition = async (lat: number, lng: number) => {
    setFormData((p) => ({ ...p, latitude: lat, longitude: lng }));
    try {
      const result = await geolocationService.reverseGeocode(lat, lng);
      if (result) {
        setResolvedAddress(result.displayName);
        setFormData((p) => (p.adresse ? p : { ...p, adresse: result.displayName }));
      }
    } catch {
      /* géocodage inverse best-effort */
    }
  };

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const { coordinates } = await geolocationService.getCurrentPosition();
      await setPosition(coordinates.latitude, coordinates.longitude);
      toast('success', 'Position actuelle utilisée.');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : "Impossible d'obtenir votre position.");
    } finally {
      setLocating(false);
    }
  };

  const handleUploadPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const results = await uploadService.uploadMultiple(Array.from(files));
      setFormData((p) => ({ ...p, photos: [...p.photos, ...results.map((r) => r.url)] }));
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Échec du téléversement.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url: string) => {
    setFormData((p) => ({ ...p, photos: p.photos.filter((u) => u !== url) }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast('error', 'Vous devez être connecté.');
      return;
    }
    setSaving(true);
    try {
      if (editingCommerce) {
        const updated = await commerceService.update(editingCommerce.id, formData);
        setCommerces((prev) => prev.map((c) => (c.id === editingCommerce.id ? updated : c)));
        toast('success', 'Commerce mis à jour.');
      } else {
        const created = await commerceService.create(formData, user.id);
        setCommerces((prev) => [created, ...prev]);
        toast('success', 'Commerce créé.');
      }
      setShowModal(false);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const prev = commerces;
    setCommerces((list) => list.filter((c) => c.id !== id)); // optimiste
    try {
      await commerceService.delete(id);
    } catch (err) {
      setCommerces(prev); // rollback
      toast('error', err instanceof Error ? err.message : 'Erreur de suppression.');
    }
  };

  const togglePublic = async (commerce: Commerce) => {
    const next = !commerce.estPublic;
    setCommerces((prev) => prev.map((c) => (c.id === commerce.id ? { ...c, estPublic: next } : c)));
    try {
      await commerceService.update(commerce.id, { estPublic: next });
    } catch {
      setCommerces((prev) => prev.map((c) => (c.id === commerce.id ? { ...c, estPublic: !next } : c)));
      toast('error', 'Impossible de modifier le statut.');
    }
  };

  if (user && user.role !== 'artisan') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Mes commerces</h1>
          <p className="text-stone-500 text-sm mt-1 flex items-center gap-1.5">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {commerces.length} commerce(s)
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 h-9 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-md text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      {commerces.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center">
          <Store className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-stone-900 mb-1">Aucun commerce</h3>
          <p className="text-stone-500 text-sm mb-4">
            Vous n&apos;avez pas encore ajouté de commerce.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 h-9 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-md text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter un commerce
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase">Commerce</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase hidden sm:table-cell">Catégorie</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase">Statut</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase hidden md:table-cell">Vues</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase hidden md:table-cell">Note</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-stone-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {commerces.map((commerce) => {
                  const categorie = categories.find((c) => c.id === commerce.categorieId) ?? commerce.categorie;
                  return (
                    <tr key={commerce.id} className="hover:bg-stone-50">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-stone-900">{commerce.nom}</p>
                        <p className="text-xs text-stone-500 truncate max-w-[200px]">{commerce.ville}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-sm text-stone-600">{categorie?.nom || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => togglePublic(commerce)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            commerce.estPublic ? 'bg-success-600' : 'bg-stone-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              commerce.estPublic ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm text-stone-600">
                          <Eye className="h-4 w-4" />
                          {commerce.nombreVues}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm text-stone-600">
                          <Star className="h-4 w-4 fill-primary-600 text-primary-600" />
                          {commerce.note.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenModal(commerce)}
                            className="p-2 text-stone-400 hover:text-info-600 hover:bg-info-50 rounded-md transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(commerce.id)}
                            className="p-2 text-stone-400 hover:text-error-600 hover:bg-error-50 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-stone-900/50" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-lg border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 className="text-base font-semibold text-stone-900">
                {editingCommerce ? 'Modifier le commerce' : 'Nouveau commerce'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-800 mb-1.5">Nom</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))}
                  className="w-full h-10 px-3 border border-stone-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                  placeholder="Nom du commerce"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-800 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 resize-none"
                  placeholder="Description du commerce"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-800 mb-1.5">Catégorie</label>
                <select
                  value={formData.categorieId}
                  onChange={(e) => setFormData((p) => ({ ...p, categorieId: e.target.value }))}
                  className="w-full h-10 px-3 border border-stone-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-800 mb-1.5">Adresse</label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData((p) => ({ ...p, adresse: e.target.value }))}
                  className="w-full h-10 px-3 border border-stone-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                  placeholder="Adresse"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-800 mb-1.5">Ville</label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData((p) => ({ ...p, ville: e.target.value }))}
                    className="w-full h-10 px-3 border border-stone-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                    placeholder="Ville"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-800 mb-1.5">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData((p) => ({ ...p, telephone: e.target.value }))}
                    className="w-full h-10 px-3 border border-stone-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                    placeholder="+226 XX XX XX XX"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-stone-800">Localisation</label>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 disabled:opacity-50"
                  >
                    {locating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LocateFixed className="h-3.5 w-3.5" />
                    )}
                    Utiliser ma position
                  </button>
                </div>
                <div className="rounded-md overflow-hidden border border-stone-300">
                  <MapLeaflet
                    className="h-48 w-full"
                    center={[formData.latitude, formData.longitude]}
                    zoom={14}
                    markers={[{
                      id: 'position',
                      position: [formData.latitude, formData.longitude],
                      nom: formData.nom || 'Position du commerce',
                    }]}
                    onMapClick={setPosition}
                  />
                </div>
                <p className="text-xs text-stone-400 mt-1.5 flex items-start gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-px" />
                  Cliquez sur la carte pour placer précisément votre commerce.
                </p>
                {resolvedAddress && (
                  <p className="text-xs text-stone-500 mt-1 truncate">📍 {resolvedAddress}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-800 mb-1.5">Photos</label>
                <div className="flex flex-wrap gap-2">
                  {formData.photos.map((url) => (
                    <div key={url} className="relative h-16 w-16 rounded-md overflow-hidden border border-stone-200 group">
                      <Image src={url} alt="" fill sizes="64px" className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        aria-label="Retirer la photo"
                        className="absolute top-0.5 right-0.5 bg-stone-900/70 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="h-16 w-16 flex items-center justify-center rounded-md border border-dashed border-stone-300 cursor-pointer hover:border-stone-500 transition-colors text-stone-400">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => handleUploadPhotos(e.target.files)}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 border-t border-stone-200 px-5 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="h-9 px-4 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.nom || !formData.categorieId || !formData.adresse || !formData.ville}
                className="h-9 px-4 inline-flex items-center gap-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingCommerce ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
