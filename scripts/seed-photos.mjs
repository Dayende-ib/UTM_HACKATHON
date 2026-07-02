/**
 * seed-photos.mjs
 * Assigne une photo Pexels unique à chaque commerce qui n'en a pas encore.
 * Usage (depuis la racine du monorepo) : node scripts/seed-photos.mjs
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// ── Chargement des .env ──────────────────────────────────────────────────────
function loadEnv(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf8')
        .split('\n')
        .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
        .map(l => {
          const idx = l.indexOf('=');
          return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
        })
    );
  } catch {
    return {};
  }
}

const env = { ...loadEnv('backend/.env.local'), ...loadEnv('frontend/.env.local') };

const SUPABASE_URL     = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const PEXELS_API_KEY   = env.PEXELS_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant');
  process.exit(1);
}
if (!PEXELS_API_KEY) {
  console.error('PEXELS_API_KEY manquant dans frontend/.env.local');
  process.exit(1);
}

// ── Mapping slug -> requete Pexels ───────────────────────────────────────────
const PEXELS_QUERY = {
  'mecanicien':            'motorcycle mechanic repair shop',
  'couturier':             'tailor sewing fabric workshop',
  'menuisier':             'carpenter woodworking workshop',
  'soudeur':               'welder welding metal workshop',
  'electricien':           'electrician at work',
  'plombier':              'plumber fixing pipes',
  'coiffeur':              'hair salon barber africa',
  'reparateur-telephones': 'phone repair technician',
  'frigoriste':            'air conditioner technician repair',
  'peintre':               'house painter painting wall',
  'jardinage':             'gardener landscaping garden work',
  'maconnerie':            'mason bricklayer construction site',
  'peinture':              'house painter painting wall',
  'photographie':          'photographer camera studio africa',
  'restauration':          'african street food restaurant',
};

// ── Pexels fetch ─────────────────────────────────────────────────────────────
async function fetchPexelsPhotos(query, count = 10, page = 1) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&page=${page}&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.photos ?? []).map(p => p.src.large);
}

// ── Main ─────────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const { data: commerces, error } = await supabase
  .from('commerces')
  .select('id, nom, photos, categories(slug)')
  .or('photos.eq.{},photos.is.null');

if (error) { console.error('Supabase:', error.message); process.exit(1); }
if (!commerces.length) { console.log('Tous les commerces ont deja une photo.'); process.exit(0); }

console.log(`${commerces.length} commerces sans photo a traiter...\n`);

// Groupe par slug pour mutualiser les appels Pexels
const bySlug = {};
for (const c of commerces) {
  const slug = c.categories?.slug ?? 'mecanicien';
  (bySlug[slug] ??= []).push(c);
}

// Recupere un pool de photos par slug (pages de 10 si besoin)
const photoPool = {};
for (const [slug, list] of Object.entries(bySlug)) {
  const query  = PEXELS_QUERY[slug] ?? slug;
  const pages  = Math.ceil(list.length / 10);
  let photos   = [];
  for (let p = 1; p <= pages; p++) {
    photos = photos.concat(await fetchPexelsPhotos(query, 10, p));
    if (p < pages) await new Promise(r => setTimeout(r, 300));
  }
  photoPool[slug] = photos;
  console.log(`[${slug}] ${photos.length} photos pour ${list.length} commerces`);
}

// Assigne une photo unique par commerce et met a jour en base
let ok = 0, fail = 0;
for (const [slug, list] of Object.entries(bySlug)) {
  const pool = photoPool[slug];
  for (let i = 0; i < list.length; i++) {
    const commerce = list[i];
    const photo    = pool[i % pool.length];
    if (!photo) { console.warn(`Pas de photo pour ${commerce.nom}`); fail++; continue; }

    const { error: upErr } = await supabase
      .from('commerces')
      .update({ photos: [photo] })
      .eq('id', commerce.id);

    if (upErr) { console.error(`${commerce.nom}: ${upErr.message}`); fail++; }
    else       { console.log(`OK  ${commerce.nom}`); ok++; }
  }
}

console.log(`\nTermine : ${ok} mis a jour, ${fail} echecs.`);
