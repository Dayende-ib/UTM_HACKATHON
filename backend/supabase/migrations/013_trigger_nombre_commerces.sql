-- Migration : Trigger pour maintenir nombre_commerces en temps réel
-- Se déclenche à chaque INSERT / UPDATE / DELETE sur commerces.

CREATE OR REPLACE FUNCTION sync_nombre_commerces()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Recalcule la catégorie concernée par l'ancienne et/ou la nouvelle ligne
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.categorie_id IS DISTINCT FROM NEW.categorie_id) THEN
    UPDATE categories
    SET nombre_commerces = (SELECT COUNT(*) FROM commerces WHERE categorie_id = OLD.categorie_id AND est_public = true)
    WHERE id = OLD.categorie_id;
  END IF;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE categories
    SET nombre_commerces = (SELECT COUNT(*) FROM commerces WHERE categorie_id = NEW.categorie_id AND est_public = true)
    WHERE id = NEW.categorie_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_nombre_commerces ON commerces;
CREATE TRIGGER trg_sync_nombre_commerces
AFTER INSERT OR UPDATE OF categorie_id OR DELETE ON commerces
FOR EACH ROW EXECUTE FUNCTION sync_nombre_commerces();

-- Recalcule une fois pour corriger les compteurs existants
UPDATE categories cat
SET nombre_commerces = (SELECT COUNT(*) FROM commerces c WHERE c.categorie_id = cat.id AND c.est_public = true);

-- Le trigger doit aussi se déclencher sur est_public
DROP TRIGGER IF EXISTS trg_sync_nombre_commerces ON commerces;
CREATE TRIGGER trg_sync_nombre_commerces
AFTER INSERT OR UPDATE OF categorie_id, est_public OR DELETE ON commerces
FOR EACH ROW EXECUTE FUNCTION sync_nombre_commerces();
