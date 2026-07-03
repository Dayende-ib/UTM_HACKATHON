'use client';

import { useState, useCallback } from 'react';
import type { Commentaire } from '@/types/commentaire';
import { commentaireService } from '@/services/commentaire.service';

export function useComments() {
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);

  const loadComments = useCallback(async (commerceId: string) => {
    const data = await commentaireService.getByCommerceId(commerceId);
    setCommentaires(data);
  }, []);

  const addComment = useCallback(
    async (data: {
      texte: string;
      note: number;
      auteurId?: string | null;
      commerceId: string;
    }): Promise<Commentaire> => {
      const newComment = await commentaireService.create(data);
      setCommentaires((prev) => [newComment, ...prev]);
      return newComment;
    },
    []
  );

  const deleteComment = useCallback(async (id: string) => {
    await commentaireService.delete(id);
    setCommentaires((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { commentaires, loadComments, addComment, deleteComment };
}
