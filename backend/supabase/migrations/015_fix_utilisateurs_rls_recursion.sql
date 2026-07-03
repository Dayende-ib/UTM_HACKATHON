-- Corrige : "infinite recursion detected in policy for relation utilisateurs" (42P17).
-- Cause : les policies admin de 006_admin_module.sql verifient le role via
-- EXISTS (SELECT 1 FROM utilisateurs ...) DANS une policy SUR utilisateurs,
-- ce qui reevalue la RLS sur elle-meme indefiniment. Toute lecture de
-- utilisateurs par un client anon/authentifie (ex: proxy.ts qui verifie le
-- role admin avant d'autoriser /admin) echoue avec ce code, meme pour un
-- vrai admin -- proxy.ts traite alors l'echec comme "role != admin" et
-- redirige vers /dashboard.
--
-- Fix standard Supabase : deporter la verification dans une fonction
-- SECURITY DEFINER (executee avec les privileges du proprietaire de la
-- migration, qui contournent RLS), pour que la policy ne requete plus
-- utilisateurs sous le contexte RLS de l'appelant.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM utilisateurs WHERE id = auth.uid() AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "Admin lecture utilisateurs" ON utilisateurs;
CREATE POLICY "Admin lecture utilisateurs"
  ON utilisateurs FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admin modification utilisateurs" ON utilisateurs;
CREATE POLICY "Admin modification utilisateurs"
  ON utilisateurs FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "Admin suppression utilisateurs" ON utilisateurs;
CREATE POLICY "Admin suppression utilisateurs"
  ON utilisateurs FOR DELETE
  USING (is_admin());

DROP POLICY IF EXISTS "Admin full access commerces" ON commerces;
CREATE POLICY "Admin full access commerces"
  ON commerces FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admin full access avis" ON avis;
CREATE POLICY "Admin full access avis"
  ON avis FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admin full access signalements" ON signalements;
CREATE POLICY "Admin full access signalements"
  ON signalements FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admin full access categories" ON categories;
CREATE POLICY "Admin full access categories"
  ON categories FOR ALL
  USING (is_admin());
