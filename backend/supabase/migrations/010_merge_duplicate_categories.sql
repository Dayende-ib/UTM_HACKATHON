-- Migration : Fusion des catégories dupliquées
-- La table `categories` contenait deux jeux de données : le nôtre (005, bien
-- encodé, slugs utilisés par le frontend dans CATEGORY_PEXELS_QUERY) et un
-- second jeu externe (déjà présent en base avant nos migrations, texte
-- corrompu en Windows-1252/UTF-8 — ex. "Ã©lectricien"). 7 catégories du
-- second jeu sont des doublons fonctionnels des nôtres.
-- Idempotent : re-jouable sans erreur si les doublons ont déjà été fusionnés.

-- ─────────────────────────────────────────────────────────────
-- Fusion des doublons : réassigne les commerces vers NOTRE catégorie
-- (canon_slug, utilisée par le frontend), puis supprime le doublon.
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  pair RECORD;
BEGIN
  FOR pair IN
    SELECT * FROM (VALUES
      ('coiffure',    'coiffeur'),
      ('couture',     'couturier'),
      ('electricite', 'electricien'),
      ('mecanique',   'mecanicien'),
      ('menuiserie',  'menuisier'),
      ('plomberie',   'plombier'),
      ('telephonie',  'reparateur-telephones')
    ) AS t(dup_slug, canon_slug)
  LOOP
    UPDATE commerces
    SET categorie_id = (SELECT id FROM categories WHERE slug = pair.canon_slug)
    WHERE categorie_id = (SELECT id FROM categories WHERE slug = pair.dup_slug);

    DELETE FROM categories WHERE slug = pair.dup_slug;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- Corrige le texte corrompu des catégories restantes sans équivalent
-- dans notre jeu (pas des doublons, juste mal encodées à l'origine).
-- ─────────────────────────────────────────────────────────────
UPDATE categories SET nom = 'Jardinage',     description = 'Entretien espaces verts, paysagistes',        icone = 'Leaf'             WHERE slug = 'jardinage';
UPDATE categories SET nom = 'Maçonnerie',    description = 'Constructeurs, réparateurs de bâtiments',      icone = 'Construction'     WHERE slug = 'maconnerie';
UPDATE categories SET nom = 'Peinture',      description = 'Peintres en bâtiment, artistes',               icone = 'PaintBucket'      WHERE slug = 'peinture';
UPDATE categories SET nom = 'Photographie',  description = 'Photographes, vidéastes',                      icone = 'Camera'           WHERE slug = 'photographie';
UPDATE categories SET nom = 'Restauration',  description = 'Restaurants, maquis, vendeurs ambulants',      icone = 'UtensilsCrossed'  WHERE slug = 'restauration';

-- ─────────────────────────────────────────────────────────────
-- Recalcule le compteur de commerces par catégorie après la fusion
-- ─────────────────────────────────────────────────────────────
UPDATE categories cat
SET nombre_commerces = (SELECT COUNT(*) FROM commerces c WHERE c.categorie_id = cat.id);
