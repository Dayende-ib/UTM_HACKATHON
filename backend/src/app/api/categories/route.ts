// @ts-nocheck
import { createServiceClient } from '@/lib/supabase/api'

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    let query = supabase
      .from('categories')
      .select('id, nom, slug, description, icone, couleur, nombre_commerces')
      .order('nom')

    if (q) {
      query = query.ilike('nom', `%${q}%`)
    }

    const { data: categories, error } = await query

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json(categories)
  } catch (error) {
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
