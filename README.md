# ArtisanBF

Plateforme geolocalisée pour les artisans locaux du Burkina Faso.

## Description

ArtisanBF connecte les artisans à leurs clients via un annuaire géolocalisé, avec des outils d’intelligence artificielle pour :

- l’analyse de commentaires (sentiment, pertinence, note)
- le résumé de commentaires
- la recherche vocale (catégorie/quartier/urgence)

## Architecture (monorepo)

- **frontend/** : application Next.js 16 / React 19 (pages publiques + dashboard), port 3000. Nom de package : `frontend`.
- **backend/** : API (routes `/api/*`, documentation Swagger, intégrations IA), port 3001. Nom de package : `artisanbf`.

Les deux apps tournent sur **Next.js 16 / React 19** au runtime (hoisté à la racine du monorepo), même si `backend/package.json` déclare encore Next 14 / React 18. Conséquence directe : dans les routes `[id]` du backend, `params` est une **Promise** (`const { id } = await params`, jamais `params.id` en synchrone).

> ⚠️ Le backend est à la racine `backend/` (le nom **de package** est `artisanbf`). Il n'existe **pas** de dossier `backend/artisanbf/`.

Le frontend communique avec le backend via des **rewrites Next.js** (proxy) configurés dans `frontend/next.config.ts` (env `NEXT_PUBLIC_BACKEND_URL`, avec compatibilité `BACKEND_URL`). Sont proxyfiés : `/api/ai/*`, `/api/commerces`, `/api/categories`, `/api/avis/*`, `/api/auth/*`, `/api/recherche`, `/api/geocoding`, `/api/upload`. Seul `/api/photos` (Pexels) est servi localement par le frontend.

## Base de données (Supabase)

Le schéma est versionné dans `backend/supabase/migrations/` (ordre = dépendances de clés étrangères) :

- `000_create_utilisateurs.sql`
- `001_create_categories.sql`
- `002_create_commerces.sql`
- `003_create_avis.sql`
- `004_storage_bucket.sql` — bucket Storage `commerces` (photos, utilisé par `/api/upload`)
- `005_seed_data.sql` — catégories + commerces à Ouagadougou
- `006_admin_module.sql` — modération : `utilisateurs.est_actif`, `avis.approuve`, table `signalements`
- `007_seed_users_cities_avis.sql` — utilisateurs de démo, commerces multi-villes (Bobo, Koudougou, Banfora, Ouahigouya, Fada) associés à des artisans, et avis
- `008_seed_demo_auth_users.sql` — comptes de connexion réels (`auth.users` + `auth.identities`), un par rôle
- `009_enrich_utilisateurs.sql` — un artisan par ville (au lieu de 3 artisans de Ouaga possédant des commerces partout), 5 citoyens supplémentaires, avis sur les commerces multi-villes
- `010_merge_duplicate_categories.sql` — fusionne 7 catégories dupliquées (ex. `coiffeur`/`coiffure`) issues d'un second jeu de données mal encodé déjà présent en base ; corrige le texte corrompu des catégories restantes sans équivalent
- `011_commerce_events.sql` — table `commerce_events` (horodatage vue/appel/whatsapp) pour le graphique d'évolution des statistiques artisan
- `012_fix_demo_user_roles.sql` — force le profil (rôle/nom/prénom) des 3 comptes de démo créés par `008` (upsert, corrige une exécution partielle antérieure de `008` où `ON CONFLICT DO NOTHING` avait laissé les comptes sans profil → repli silencieux sur le rôle `citoyen`)

> Migrations idempotentes : rejouables sans erreur (colonnes réconciliées via `ADD COLUMN IF NOT EXISTS`, policies via `DROP POLICY IF EXISTS`, seeds guardés). Appliquer dans l'ordre `000 → 012`.

### Comptes de démo (après migration `008`)

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@test.com` | `Demo1234!` | admin |
| `artisan@test.com` | `Demo1234!` | artisan (propriétaire de « Garage Wend-Kuni ») |
| `citoyen@test.com` | `Demo1234!` | citoyen |
>
> ⚠️ `007` relâche la FK `utilisateurs.id → auth.users` pour permettre des **profils de démo sans compte auth** (données/associations uniquement, pas de login). Les inscriptions réelles restent inchangées.

## Démarrage (dev)

Depuis la racine du monorepo :

```bash
# Lancer le frontend (port 3000)
npm run dev:frontend

# Lancer le backend (port 3001)
npm run dev:backend
```

Scripts disponibles (root) :

- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run build --workspaces --if-present`
- `npm run lint --workspaces --if-present`

## Variables d’environnement

### Frontend (frontend/.env.local)
Copier `frontend/.env.local.example` vers `frontend/.env.local`, puis renseigner :

> Note : les appels IA (`/api/ai/*`) sont routés vers le backend via `frontend/next.config.ts` (env `NEXT_PUBLIC_BACKEND_URL`, avec compatibilité `BACKEND_URL`).
> Vérifier que `NEXT_PUBLIC_BACKEND_URL` pointe bien vers le backend (ex : `http://localhost:3001`).

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_BACKEND_URL` (ex : `http://localhost:3001`)
- `BACKEND_URL` (alias compatible, facultatif)
- `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` (utilisés par le proxy)
- `PEXELS_API_KEY` (photos)

### Backend (backend/.env)
Copier `backend/.env.example` vers `backend/.env`. Le backend utilise notamment :
- `AI_MODEL` (ex: `llama-3.1-8b-instant`)
- `AI_BASE_URL`
- `AI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (accès Supabase)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (rate limiting)

> Ces variables doivent correspondre à celles utilisées par `backend/src/lib/ia/client`.


## API (backend)

Routes IA (Groq — Llama 3.1 + Whisper) :
- `POST /api/ai/analyze` — analyse d'un commentaire (sentiment, note, pertinence)
- `POST /api/ai/summarize` — résumé d'une liste d'avis (résumé + points forts/faibles)
- `POST /api/ai/voice-search` — audio → transcription + intention (catégorie/quartier/urgence)
- `POST /api/ai/speech-to-text` — audio → texte
- `POST /api/ai/respond` — génère une réponse d'artisan à un avis (`{ avis, note? }` → `{ reponse }`)

Routes métier :
- `GET|POST /api/commerces`, `GET|PUT|DELETE /api/commerces/[id]`
- `POST /api/commerces/[id]/stats` — incrémente un compteur (`{ type: 'vue'|'appel'|'whatsapp' }`) et horodate l'évènement
- `GET /api/commerces/[id]/stats/evolution?days=7` — évolution vues/appels/whatsapp par jour
- `GET /api/categories`
- `GET|POST /api/avis` (filtre par `commerce_id` et/ou `user_id`), `DELETE /api/avis/[id]`
- `PUT /api/utilisateurs/[id]` — mise à jour de son propre profil (nom/prénom/téléphone/mot de passe)
- `POST /api/auth/connexion`, `POST /api/auth/inscription`
- `GET /api/recherche` (recherche + tri géolocalisé par distance)
- `GET|POST /api/geocoding` (géocodage direct / inverse via Nominatim)
- `POST /api/upload` (image → Supabase Storage, renvoie l'URL publique)

Routes admin (`requireAdmin`, réservées au rôle `admin`) : `/api/admin/{stats,users,commerces,avis,categories,signalements}` — voir `backend/src/app/api/admin/`.

Documentation :
- Swagger statique : `backend/public/swagger.html`
- Page docs : `/api-docs` (généré via `backend/lib/swagger.js`)

## Branches

| Branche | Description |
|---|---|
| `main` | Produit final |
| `IA` | Module d’intelligence artificielle |
| `frontend` | Interface utilisateur |

