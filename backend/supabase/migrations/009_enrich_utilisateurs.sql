-- Migration : Enrichissement de la table utilisateurs
-- Ajoute un artisan par ville (plus réaliste que 3 artisans de Ouaga
-- possédant des commerces dans 5 villes différentes) et davantage de
-- citoyens pour diversifier les auteurs d'avis. Idempotent (ON CONFLICT).

-- ─────────────────────────────────────────────────────────────
-- Artisans supplémentaires, un par ville hors Ouagadougou
-- ─────────────────────────────────────────────────────────────
INSERT INTO utilisateurs (id, nom, prenom, telephone, role) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Kone',      'Salif',   '+226 70 10 00 01', 'artisan'), -- Bobo-Dioulasso
  ('b2222222-2222-2222-2222-222222222222', 'Yameogo',   'Rasmata', '+226 70 10 00 02', 'artisan'), -- Koudougou
  ('b3333333-3333-3333-3333-333333333333', 'Some',      'Boureima','+226 70 10 00 03', 'artisan'), -- Banfora
  ('b4444444-4444-4444-4444-444444444444', 'Dabire',    'Aminata', '+226 70 10 00 04', 'artisan'), -- Ouahigouya
  ('b5555555-5555-5555-5555-555555555555', 'Compaore',  'Issouf',  '+226 70 10 00 05', 'artisan')  -- Fada N'Gourma
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Citoyens supplémentaires (diversifie les auteurs d'avis)
-- ─────────────────────────────────────────────────────────────
INSERT INTO utilisateurs (id, nom, prenom, telephone, role) VALUES
  ('c3333333-3333-3333-3333-333333333333', 'Nikiema',   'Salimata','+226 70 20 00 01', 'citoyen'),
  ('c4444444-4444-4444-4444-444444444444', 'Ilboudo',   'Yacouba', '+226 70 20 00 02', 'citoyen'),
  ('c5555555-5555-5555-5555-555555555555', 'Ouattara',  'Aicha',   '+226 70 20 00 03', 'citoyen'),
  ('c6666666-6666-6666-6666-666666666666', 'Bicaba',    'Seydou',  '+226 70 20 00 04', 'citoyen'),
  ('c7777777-7777-7777-7777-777777777777', 'Tapsoba',   'Mariam',  '+226 70 20 00 05', 'citoyen')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Réassigne chaque commerce hors Ouaga à l'artisan de sa ville
-- (no-op si déjà réassigné entre-temps, ou si le commerce n'existe pas).
-- ─────────────────────────────────────────────────────────────
UPDATE commerces SET artisan_id = 'b1111111-1111-1111-1111-111111111111'
WHERE ville = 'Bobo-Dioulasso' AND artisan_id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
);

UPDATE commerces SET artisan_id = 'b2222222-2222-2222-2222-222222222222'
WHERE ville = 'Koudougou' AND artisan_id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
);

UPDATE commerces SET artisan_id = 'b3333333-3333-3333-3333-333333333333'
WHERE ville = 'Banfora' AND artisan_id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
);

UPDATE commerces SET artisan_id = 'b4444444-4444-4444-4444-444444444444'
WHERE ville = 'Ouahigouya' AND artisan_id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
);

UPDATE commerces SET artisan_id = 'b5555555-5555-5555-5555-555555555555'
WHERE ville = 'Fada N''Gourma' AND artisan_id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
);

-- ─────────────────────────────────────────────────────────────
-- Quelques avis supplémentaires des nouveaux citoyens, sur les commerces
-- multi-villes (jusqu'ici sans aucun avis). Seedé seulement si ces
-- commerces n'ont encore aucun avis, pour rester idempotent.
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM avis WHERE commerce_id = (SELECT id FROM commerces WHERE nom = 'Garage Sya Bobo' LIMIT 1)
  ) THEN
    INSERT INTO avis (commerce_id, user_id, note, commentaire, sentiment, score_sentiment, is_spam) VALUES
      ((SELECT id FROM commerces WHERE nom = 'Garage Sya Bobo' LIMIT 1),          'c3333333-3333-3333-3333-333333333333', 5, 'Excellent accueil, diagnostic clair et prix honnête.', 'positif', 1.0, false),
      ((SELECT id FROM commerces WHERE nom = 'Couture Kénédougou' LIMIT 1),       'c4444444-4444-4444-4444-444444444444', 4, 'Beau travail sur mon boubou, léger retard de livraison.', 'positif', 0.8, false),
      ((SELECT id FROM commerces WHERE nom = 'Électricité Koudougou Plus' LIMIT 1), 'c5555555-5555-5555-5555-555555555555', 5, 'Installation solaire nickel, très pédagogue.', 'positif', 1.0, false),
      ((SELECT id FROM commerces WHERE nom = 'Salon Réo Coiffure' LIMIT 1),       'c6666666-6666-6666-6666-666666666666', 3, 'Correct mais salon un peu bruyant.', 'neutre', 0.6, false),
      ((SELECT id FROM commerces WHERE nom = 'Menuiserie Cascades' LIMIT 1),      'c7777777-7777-7777-7777-777777777777', 4, 'Table solide, belles finitions.', 'positif', 0.8, false),
      ((SELECT id FROM commerces WHERE nom = 'Plomberie Banfora Services' LIMIT 1), 'c3333333-3333-3333-3333-333333333333', 2, 'Fuite toujours présente après intervention.', 'negatif', 0.4, false),
      ((SELECT id FROM commerces WHERE nom = 'Soudure du Yatenga' LIMIT 1),       'c4444444-4444-4444-4444-444444444444', 5, 'Portail impeccable, travail soigné.', 'positif', 1.0, false),
      ((SELECT id FROM commerces WHERE nom = 'Réparation Phone Yatenga' LIMIT 1), 'c5555555-5555-5555-5555-555555555555', 4, 'Écran remplacé rapidement, bon prix.', 'positif', 0.8, false),
      ((SELECT id FROM commerces WHERE nom = 'Garage Gourma Auto' LIMIT 1),       'c6666666-6666-6666-6666-666666666666', 3, 'Vidange correcte, attente un peu longue.', 'neutre', 0.6, false),
      ((SELECT id FROM commerces WHERE nom = 'Atelier Couture Gulmu' LIMIT 1),    'c7777777-7777-7777-7777-777777777777', 5, 'Retouche parfaite en moins d''une journée.', 'positif', 1.0, false);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- Recalcule les agrégats après les nouveaux avis / réassignations
-- ─────────────────────────────────────────────────────────────
UPDATE commerces c
SET note_moyenne = sub.moyenne,
    nombre_avis  = sub.cnt
FROM (
  SELECT commerce_id, ROUND(AVG(note)::numeric, 2) AS moyenne, COUNT(*) AS cnt
  FROM avis
  GROUP BY commerce_id
) sub
WHERE c.id = sub.commerce_id;
