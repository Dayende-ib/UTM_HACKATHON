-- Migration : Corrige les profils des comptes de démo créés par 008
-- Constaté en prod : les 3 comptes (admin/artisan/citoyen@test.com) ont un
-- compte auth valide (login OK) mais AUCUN profil dans utilisateurs — sans
-- doute une exécution partielle de 008 avant cette correction. Comme 008
-- utilisait ON CONFLICT (id) DO NOTHING, rejouer 008 seul ne réparait rien.
-- Cette migration force les bonnes valeurs (idempotente, sans risque).

INSERT INTO utilisateurs (id, nom, prenom, telephone, role) VALUES
  ('d0000000-0000-0000-0000-00000000a001', 'Admin',   'Démo', '+226 70 00 01 00', 'admin'),
  ('d0000000-0000-0000-0000-00000000a002', 'Artisan', 'Démo', '+226 70 00 02 00', 'artisan'),
  ('d0000000-0000-0000-0000-00000000a003', 'Citoyen', 'Démo', '+226 70 00 03 00', 'citoyen')
ON CONFLICT (id) DO UPDATE SET
  nom = EXCLUDED.nom,
  prenom = EXCLUDED.prenom,
  telephone = EXCLUDED.telephone,
  role = EXCLUDED.role;
