-- Autorise les visiteurs non authentifies a laisser un avis via l'API backend.
-- L'insert public direct Supabase reste ferme par les policies existantes :
-- seule la route /api/avis, qui utilise le service role et valide les entrees,
-- peut creer un avis anonyme avec user_id = NULL.

ALTER TABLE avis ALTER COLUMN user_id DROP NOT NULL;
