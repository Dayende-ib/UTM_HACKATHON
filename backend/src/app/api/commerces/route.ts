// @ts-nocheck
import { createServiceClient, getUser } from '@/lib/supabase/api'

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const categorie = searchParams.get('categorie')
    const search = searchParams.get('search')
    const artisanId = searchParams.get('artisanId')

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('commerces')
      .select('*, categories(*), utilisateurs(id, nom, prenom)', { count: 'exact' })
      .eq('est_public', true)
      .range(from, to)
      .order('created_at', { ascending: false })

    if (categorie) {
      query = query.eq('categorie_id', categorie)
    }
    if (artisanId) {
      query = query.eq('artisan_id', artisanId)
    }
    if (search) {
      const s = search.toLowerCase()
      query = query.or(`nom.ilike.%${s}%,description.ilike.%${s}%,adresse.ilike.%${s}%`)
    }

    const { data, error, count } = await query

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ commerces: data, total: count, page, limit })
  } catch (error) {
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request)
    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const body = await request.json()
    const { nom, description, categorieId, adresse, ville, latitude, longitude, telephone, whatsapp, email, photos } = body

    const { data: profil, error: profileError } = await supabase
      .from('utilisateurs')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return Response.json({ error: profileError.message }, { status: 500 })
    }

    if (profil?.role !== 'artisan' && profil?.role !== 'admin') {
      return Response.json({ error: 'Vous devez devenir artisan pour publier un commerce' }, { status: 403 })
    }

    if (!nom || !categorieId || !adresse || !ville) {
      return Response.json({ error: 'Les champs nom, categorieId, adresse et ville sont requis' }, { status: 400 })
    }

    const { data: commerce, error } = await supabase
      .from('commerces')
      .insert({
        nom,
        description,
        categorie_id: categorieId,
        adresse,
        ville,
        latitude,
        longitude,
        telephone,
        whatsapp,
        email,
        photos: Array.isArray(photos) ? photos : [],
        artisan_id: user.id,
        est_public: true,
      })
      .select('*, categories(*), utilisateurs(id, nom, prenom)')
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json(commerce, { status: 201 })
  } catch (error) {
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
