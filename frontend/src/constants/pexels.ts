/**
 * Requêtes Pexels en anglais par **slug** de catégorie : de meilleurs
 * résultats qu'avec les noms de métiers en français. Indexé par slug (stable,
 * présent en base) plutôt que par id, afin de fonctionner avec les vraies
 * catégories Supabase. Partagé client/serveur — aucun secret ici.
 */
export const CATEGORY_PEXELS_QUERY: Record<string, string> = {
  'mecanicien': 'motorcycle mechanic repair shop',
  'couturier': 'tailor sewing fabric workshop',
  'menuisier': 'carpenter woodworking workshop',
  'soudeur': 'welder welding metal workshop',
  'electricien': 'electrician at work',
  'plombier': 'plumber fixing pipes',
  'coiffeur': 'hair salon barber africa',
  'reparateur-telephones': 'phone repair technician',
  'frigoriste': 'air conditioner technician repair',
  'peintre': 'house painter painting wall',
  'jardinage': 'gardener landscaping garden work',
  'maconnerie': 'mason bricklayer construction site',
  'peinture': 'house painter painting wall',
  'photographie': 'photographer camera studio africa',
  'restauration': 'african street food restaurant',
};
