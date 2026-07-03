'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Search, Trash2, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Utilisateur } from '@/types/utilisateur';
import { adminService } from '@/services/admin.service';

const ITEMS_PER_PAGE = 20;

export default function UtilisateursPage() {
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, roleFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        page,
        limit: ITEMS_PER_PAGE,
      });
      setUsers(res.users);
      setTotal(res.total);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const toggleActive = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const action = user.estActif ? 'desactiver' : 'activer';
    try {
      await adminService.updateUser(id, { action });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, estActif: !u.estActif } : u))
      );
    } catch (err) {
      console.error('Erreur toggle utilisateur:', err);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await adminService.deleteUser(id);
      // Recharge depuis le serveur pour garder le total et la pagination cohérents.
      if (users.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error('Erreur suppression utilisateur:', err);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Utilisateurs</h1>
          <p className="text-stone-500 text-sm mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Utilisateurs</h1>
        <p className="text-stone-500 text-sm mt-2">{total} utilisateur(s)</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 outline-none transition-all duration-200 hover:border-stone-300"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 outline-none transition-all duration-200 hover:border-stone-300"
        >
          <option value="all">Tous les rôles</option>
          <option value="citoyen">Citoyen</option>
          <option value="artisan">Artisan</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Rôle</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">Statut</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden lg:table-cell">Inscrit le</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <Image src={user.avatar} alt={user.prenom} width={36} height={36} className="h-9 w-9 rounded-lg object-cover ring-2 ring-stone-100" />
                      ) : (
                        <div className="h-9 w-9 rounded-md bg-stone-900 flex items-center justify-center">
                          <span className="text-xs font-semibold text-white">
                            {user.prenom[0]}{user.nom[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{user.prenom} {user.nom}</p>
                        <p className="text-xs text-stone-500 sm:hidden">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="text-sm text-stone-600">{user.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin'
                        ? 'bg-error-100 text-error-700'
                        : user.role === 'artisan'
                        ? 'bg-info-100 text-info-700'
                        : 'bg-stone-100 text-stone-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      user.estActif ? 'text-success-600' : 'text-stone-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.estActif ? 'bg-success-500' : 'bg-stone-400'}`} />
                      {user.estActif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-sm text-stone-500">
                      {new Date(user.dateCreation).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleActive(user.id)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          user.estActif
                            ? 'text-stone-400 hover:text-primary-600 hover:bg-primary-50'
                            : 'text-stone-400 hover:text-success-600 hover:bg-success-50'
                        }`}
                        title={user.estActif ? 'Désactiver' : 'Activer'}
                      >
                        {user.estActif ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-2 text-stone-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone-400 text-sm font-medium">Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

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
    </div>
  );
}
