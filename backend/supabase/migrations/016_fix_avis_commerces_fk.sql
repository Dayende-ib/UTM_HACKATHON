-- Corrige : PGRST200 "Could not find a relationship between 'avis' and 'commerces'
-- in the schema cache" sur GET /api/avis (embed .select('*, commerces(...)')).
--
-- Cause : 003_create_avis.sql declare commerce_id UUID REFERENCES commerces(id)
-- dans un CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS -- les deux
-- sont des no-op si la table/colonne existait deja sur la base live (cree
-- avant l'introduction de ce fichier de migration). La contrainte FK n'a
-- donc jamais ete appliquee reellement, meme si le fichier de migration la
-- decrit. PostgREST derive ses relations d'embed des contraintes FK du
-- catalogue, pas du SQL des migrations : sans contrainte, l'embed echoue.
--
-- NOT VALID : au moins une ligne avis.commerce_id orpheline existe deja en
-- prod (pointant vers un commerce supprime) -- on ajoute la contrainte sans
-- revalider les lignes existantes pour ne pas echouer ni toucher aux
-- donnees, tout en l'appliquant aux futurs inserts/updates.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'avis_commerce_id_fkey'
  ) THEN
    ALTER TABLE avis
      ADD CONSTRAINT avis_commerce_id_fkey
      FOREIGN KEY (commerce_id) REFERENCES commerces(id) ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
