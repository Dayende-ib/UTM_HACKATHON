// @ts-nocheck
import { createServiceClient } from '@/lib/supabase/api'

// Colonnes compteurs autorisées, indexées par type d'évènement.
const COLUMN_BY_TYPE = {
  vue: 'nombre_vues',
  appel: 'nombre_appels',
  whatsapp: 'nombre_clics_whatsapp',
} as const

// POST /api/commerces/[id]/stats  { type: 'vue' | 'appel' | 'whatsapp' }
// Incrémente le compteur correspondant. Pas d'auth : tracking public.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const type = body?.type as keyof typeof COLUMN_BY_TYPE
    const column = COLUMN_BY_TYPE[type]

    if (!column) {
      return Response.json(
        { error: "type invalide (attendu: 'vue' | 'appel' | 'whatsapp')" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Lecture de la valeur courante puis incrément (read-modify-write).
    const { data: current, error: readError } = await supabase
      .from('commerces')
      .select(column)
      .eq('id', (await params).id)
      .single()

    if (readError || !current) {
      return Response.json({ error: 'Commerce non trouvé' }, { status: 404 })
    }

    const nextValue = (current[column] ?? 0) + 1

    const { error: updateError } = await supabase
      .from('commerces')
      .update({ [column]: nextValue })
      .eq('id', (await params).id)

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 })
    }

    // Horodate l'évènement pour permettre un graphique d'évolution
    // (le compteur cumulé ci-dessus ne garde pas l'historique dans le temps).
    await supabase.from('commerce_events').insert({ commerce_id: (await params).id, type })

    return Response.json({ [column]: nextValue })
  } catch (error) {
    console.error('[/api/commerces/[id]/stats]', error)
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
