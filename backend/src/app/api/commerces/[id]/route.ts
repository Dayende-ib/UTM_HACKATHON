// @ts-nocheck
import { createServiceClient, getUser } from '@/lib/supabase/api'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient()
    const { data: commerce, error } = await supabase
      .from('commerces')
      .select('*, categories(*), utilisateurs(id, nom, prenom)')
      .eq('id', (await params).id)
      .single()

    if (error || !commerce) {
      return Response.json({ error: 'Commerce non trouvé' }, { status: 404 })
    }

    return Response.json(commerce)
  } catch (error) {
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const body = await request.json()
    const { id } = await params

    const { data: existing, error: existingError } = await supabase
      .from('commerces')
      .select('artisan_id')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return Response.json({ error: 'Commerce non trouvé' }, { status: 404 })
    }

    const { data: profil, error: profileError } = await supabase
      .from('utilisateurs')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return Response.json({ error: profileError.message }, { status: 500 })
    }

    const canManage = existing.artisan_id === user.id || profil?.role === 'admin'
    if (!canManage) {
      return Response.json({ error: 'Vous ne pouvez modifier que vos propres commerces' }, { status: 403 })
    }

    // Le frontend envoie du camelCase (categorieId, ...) mais les colonnes
    // Supabase sont en snake_case. On mappe explicitement les champs autorisés.
    const fieldMap: Record<string, string> = {
      nom: 'nom',
      description: 'description',
      categorieId: 'categorie_id',
      adresse: 'adresse',
      ville: 'ville',
      latitude: 'latitude',
      longitude: 'longitude',
      telephone: 'telephone',
      whatsapp: 'whatsapp',
      email: 'email',
      photos: 'photos',
      estPublic: 'est_public',
    }

    const updates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      const column = fieldMap[key]
      if (column) updates[column] = value
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'Aucun champ modifiable fourni' }, { status: 400 })
    }

    const { data: commerce, error } = await supabase
      .from('commerces')
      .update(updates)
      .eq('id', id)
      .select('*, categories(*), utilisateurs(id, nom, prenom)')
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json(commerce)
  } catch (error) {
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { id } = await params
    const { data: existing, error: existingError } = await supabase
      .from('commerces')
      .select('artisan_id')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return Response.json({ error: 'Commerce non trouvé' }, { status: 404 })
    }

    const { data: profil, error: profileError } = await supabase
      .from('utilisateurs')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return Response.json({ error: profileError.message }, { status: 500 })
    }

    const canManage = existing.artisan_id === user.id || profil?.role === 'admin'
    if (!canManage) {
      return Response.json({ error: 'Vous ne pouvez supprimer que vos propres commerces' }, { status: 403 })
    }

    const { error } = await supabase
      .from('commerces')
      .delete()
      .eq('id', id)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ message: 'Commerce supprimé' })
  } catch (error) {
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
