-- Migration : Historique des évènements commerce (vues/appels/whatsapp)
-- Permet un vrai graphique d'évolution dans le temps, au lieu du seul
-- compteur cumulé sur commerces (nombre_vues, nombre_appels, ...).
-- Idempotent : CREATE TABLE IF NOT EXISTS + policies avec DROP IF EXISTS.

CREATE TABLE IF NOT EXISTS commerce_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commerce_id UUID NOT NULL REFERENCES commerces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('vue', 'appel', 'whatsapp')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commerce_events_commerce ON commerce_events(commerce_id);
CREATE INDEX IF NOT EXISTS idx_commerce_events_created_at ON commerce_events(created_at);

ALTER TABLE commerce_events ENABLE ROW LEVEL SECURITY;

-- Écriture publique (tracking anonyme, même politique que les compteurs
-- sur commerces via /api/commerces/[id]/stats qui n'exige pas d'auth).
DROP POLICY IF EXISTS "Évènements commerce insérables publiquement" ON commerce_events;
CREATE POLICY "Évènements commerce insérables publiquement"
  ON commerce_events FOR INSERT
  WITH CHECK (true);

-- Lecture publique (les compteurs agrégés sont déjà publics sur la fiche commerce).
DROP POLICY IF EXISTS "Évènements commerce lisibles publiquement" ON commerce_events;
CREATE POLICY "Évènements commerce lisibles publiquement"
  ON commerce_events FOR SELECT
  USING (true);
