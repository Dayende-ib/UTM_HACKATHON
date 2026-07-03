"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Trash2, CheckCircle, XCircle, Store, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { adminService } from "@/services/admin.service";
import { categorieService } from "@/services/categorie.service";
import type { Commerce, Categorie } from "@/types/commerce";

const ITEMS_PER_PAGE = 20;

const emptyForm = {
  nom: "",
  description: "",
  categorieId: "",
  adresse: "",
  ville: "",
  telephone: "",
  whatsapp: "",
  email: "",
};

export default function AdminCommercesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Commerce[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search]);

  const fetchCommerces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getCommerces({ search: search || undefined, page, limit: ITEMS_PER_PAGE });
      setItems(res.commerces);
      setTotal(res.total);
    } catch (err) {
      console.error("Erreur chargement commerces:", err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCommerces();
  }, [fetchCommerces]);

  useEffect(() => {
    categorieService.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const toggleStatus = async (id: string) => {
    try {
      const res = await adminService.toggleCommercePublic(id);
      setItems((prev) =>
        prev.map((c) => (c.id === id ? { ...c, estPublic: res.estPublic } : c))
      );
    } catch (err) {
      console.error("Erreur toggle commerce:", err);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce commerce ?")) return;
    try {
      await adminService.deleteCommerce(id);
      if (items.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchCommerces();
      }
    } catch (err) {
      console.error("Erreur suppression commerce:", err);
    }
  };

  const openEdit = (c: Commerce) => {
    setEditingId(c.id);
    setForm({
      nom: c.nom,
      description: c.description || "",
      categorieId: c.categorieId,
      adresse: c.adresse,
      ville: c.ville,
      telephone: c.telephone || "",
      whatsapp: c.whatsapp || "",
      email: c.email || "",
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!editingId || !form.nom || !form.adresse || !form.ville) return;
    setSaving(true);
    try {
      await adminService.updateCommerce(editingId, form);
      const categorie = categories.find((cat) => cat.id === form.categorieId);
      setItems((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, ...form, categorie: categorie ?? c.categorie }
            : c
        )
      );
      setShowModal(false);
    } catch (err) {
      console.error("Erreur mise à jour commerce:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Gestion des commerces</h1>
          <p className="text-stone-500 text-sm mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Gestion des commerces</h1>
          <p className="text-stone-500 text-sm mt-2">{total} commerces au total</p>
        </div>
      </div>

      <div className="relative max-w-md group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-primary-500 transition-colors" />
        <input
          type="text"
          placeholder="Rechercher un commerce..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-white pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-all duration-200 hover:border-stone-300"
        />
      </div>

      <div className="hidden md:block rounded-lg border border-stone-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-stone-50/50 border-b border-stone-100">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Commerce</th>
              <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Ville</th>
              <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Catégorie</th>
              <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Statut</th>
              <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Vues</th>
              <th className="text-right px-5 py-3.5 font-semibold text-stone-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-5 py-4 font-semibold text-stone-900">{c.nom}</td>
                <td className="px-5 py-4 text-stone-600">{c.ville}</td>
                <td className="px-5 py-4">
                  <Badge variant="warm">{c.categorie?.nom || c.categorieId}</Badge>
                </td>
                <td className="px-5 py-4">
                  <Badge variant={c.estPublic ? "success" : "warning"}>
                    {c.estPublic ? "Publié" : "Brouillon"}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-stone-600">{c.nombreVues}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4 text-stone-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(c.id)}>
                      {c.estPublic ? (
                        <XCircle className="h-4 w-4 text-primary-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-success-500" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(c.id)}>
                      <Trash2 className="h-4 w-4 text-error-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {items.map((c) => (
          <div key={c.id} className="rounded-lg border border-stone-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-900">{c.nom}</h3>
              <Badge variant={c.estPublic ? "success" : "warning"}>
                {c.estPublic ? "Publié" : "Brouillon"}
              </Badge>
            </div>
            <p className="text-sm text-stone-500">{c.ville}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Modifier
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleStatus(c.id)}>
                {c.estPublic ? "Retirer" : "Publier"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => remove(c.id)}>
                <Trash2 className="h-4 w-4 text-error-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16">
          <div className="h-20 w-20 rounded-lg bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <Store className="h-10 w-10 text-stone-300" />
          </div>
          <p className="text-stone-500 font-medium">Aucun commerce trouvé</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-9 w-9 flex items-center justify-center rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-stone-500">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-9 w-9 flex items-center justify-center rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Modifier le commerce" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Nom</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
              className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Catégorie</label>
            <select
              value={form.categorieId}
              onChange={(e) => setForm((p) => ({ ...p, categorieId: e.target.value }))}
              className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Adresse</label>
            <input
              type="text"
              value={form.adresse}
              onChange={(e) => setForm((p) => ({ ...p, adresse: e.target.value }))}
              className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Ville</label>
              <input
                type="text"
                value={form.ville}
                onChange={(e) => setForm((p) => ({ ...p, ville: e.target.value }))}
                className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))}
                className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">WhatsApp</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
                className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
