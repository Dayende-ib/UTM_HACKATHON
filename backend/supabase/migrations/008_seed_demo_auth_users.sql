-- Migration : Comptes de démo avec authentification réelle
-- admin@test.com / artisan@test.com / citoyen@test.com — mot de passe : Demo1234!
-- Contrairement au 007 (profils démo sans login), ces comptes existent dans
-- auth.users + auth.identities et peuvent se connecter via /api/auth/connexion.
-- Idempotent (guardé par NOT EXISTS sur des UUID fixes).

-- pgcrypto est déjà utilisé en interne par Supabase Auth, mais on s'assure
-- qu'il est accessible dans le schéma "extensions" (no-op si déjà présent).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_instance_id uuid;
  v_admin_id    uuid := 'd0000000-0000-0000-0000-00000000a001';
  v_artisan_id  uuid := 'd0000000-0000-0000-0000-00000000a002';
  v_citoyen_id  uuid := 'd0000000-0000-0000-0000-00000000a003';
  v_password    text := 'Demo1234!';
BEGIN
  -- Réutilise l'instance_id d'un utilisateur existant si présent (multi-tenance
  -- legacy de GoTrue), sinon la valeur par défaut standard Supabase.
  SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  -- ─── admin@test.com ───────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_admin_id) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change, email_change_token_new
    ) VALUES (
      v_instance_id, v_admin_id, 'authenticated', 'authenticated',
      'admin@test.com', extensions.crypt(v_password, extensions.gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"]}', '{}',
      NOW(), NOW(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_admin_id, v_admin_id::text,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@test.com'),
      'email', NOW(), NOW(), NOW()
    );
  END IF;

  -- ─── artisan@test.com ─────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_artisan_id) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change, email_change_token_new
    ) VALUES (
      v_instance_id, v_artisan_id, 'authenticated', 'authenticated',
      'artisan@test.com', extensions.crypt(v_password, extensions.gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"]}', '{}',
      NOW(), NOW(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_artisan_id, v_artisan_id::text,
      jsonb_build_object('sub', v_artisan_id::text, 'email', 'artisan@test.com'),
      'email', NOW(), NOW(), NOW()
    );
  END IF;

  -- ─── citoyen@test.com ─────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_citoyen_id) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change, email_change_token_new
    ) VALUES (
      v_instance_id, v_citoyen_id, 'authenticated', 'authenticated',
      'citoyen@test.com', extensions.crypt(v_password, extensions.gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"]}', '{}',
      NOW(), NOW(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_citoyen_id, v_citoyen_id::text,
      jsonb_build_object('sub', v_citoyen_id::text, 'email', 'citoyen@test.com'),
      'email', NOW(), NOW(), NOW()
    );
  END IF;

  -- ─── Profils applicatifs (public.utilisateurs) ─────────────
  INSERT INTO utilisateurs (id, nom, prenom, telephone, role) VALUES
    (v_admin_id,   'Admin',   'Démo', '+226 70 00 01 00', 'admin'),
    (v_artisan_id, 'Artisan', 'Démo', '+226 70 00 02 00', 'artisan'),
    (v_citoyen_id, 'Citoyen', 'Démo', '+226 70 00 03 00', 'citoyen')
  ON CONFLICT (id) DO NOTHING;

  -- Donne un commerce existant à artisan@test.com pour que le dashboard
  -- "Mes commerces" ne soit pas vide à la première connexion (no-op si déjà
  -- réassigné à un autre propriétaire entre-temps).
  UPDATE commerces
  SET artisan_id = v_artisan_id
  WHERE nom = 'Garage Wend-Kuni'
    AND artisan_id = 'a1111111-1111-1111-1111-111111111111';
END $$;
