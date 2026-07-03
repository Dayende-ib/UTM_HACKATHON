import Dexie, { type EntityTable } from 'dexie';
import type { Commerce, Categorie } from '@/types/commerce';
import type { Commentaire } from '@/types/commentaire';

export interface PendingAvis {
  id: string;
  commerceId: string;
  texte: string;
  note: number;
  auteurId: string | null;
  createdAt: number;
}

const db = new Dexie('artisanbf-offline') as Dexie & {
  commerces: EntityTable<Commerce, 'id'>;
  categories: EntityTable<Categorie, 'id'>;
  avis: EntityTable<Commentaire, 'id'>;
  pendingAvis: EntityTable<PendingAvis, 'id'>;
};

db.version(1).stores({
  commerces: 'id',
  categories: 'id',
  avis: 'id, commerceId, auteurId',
  pendingAvis: 'id, commerceId',
});

export { db };
