// @ts-nocheck
import { createServiceClient } from '@/lib/supabase/api'

const MAX_DAYS = 90

// GET /api/commerces/[id]/stats/evolution?days=7
// Renvoie le nombre de vues/appels/whatsapp par jour sur les N derniers jours,
// à partir de l'historique commerce_events (compteurs cumulés seuls ne
// permettent pas de reconstruire une évolution dans le temps).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') || '7'), MAX_DAYS)
    const commerceId = (await params).id

    const since = new Date()
    since.setDate(since.getDate() - (days - 1))
    since.setHours(0, 0, 0, 0)

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('commerce_events')
      .select('type, created_at')
      .eq('commerce_id', commerceId)
      .gte('created_at', since.toISOString())

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Prépare un jour vide pour chaque jour de la fenêtre, dans l'ordre chronologique.
    const buckets = new Map()
    for (let i = 0; i < days; i++) {
      const d = new Date(since)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      buckets.set(key, { date: key, vues: 0, appels: 0, whatsapp: 0 })
    }

    for (const row of data || []) {
      const key = row.created_at.slice(0, 10)
      const bucket = buckets.get(key)
      if (!bucket) continue
      if (row.type === 'vue') bucket.vues += 1
      else if (row.type === 'appel') bucket.appels += 1
      else if (row.type === 'whatsapp') bucket.whatsapp += 1
    }

    return Response.json({ days: Array.from(buckets.values()) })
  } catch (error) {
    console.error('[/api/commerces/[id]/stats/evolution]', error)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
