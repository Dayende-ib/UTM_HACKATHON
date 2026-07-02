// @ts-nocheck
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUser, createServiceClient } from '@/lib/supabase/api'

const updateSchema = z.object({
  nom: z.string().min(1).optional(),
  prenom: z.string().min(1).optional(),
  telephone: z.string().optional(),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').optional(),
})

// PUT /api/utilisateurs/[id] — mise à jour de son propre profil (nom, prénom,
// téléphone, mot de passe). Un utilisateur ne peut modifier que lui-même.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const targetId = (await params).id
  if (targetId !== user.id) {
    return NextResponse.json(
      { error: 'Vous ne pouvez modifier que votre propre profil' },
      { status: 403 }
    )
  }

  const supabase = createServiceClient()

  try {
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { nom, prenom, telephone, password } = parsed.data

    if (password) {
      const { error: pwError } = await supabase.auth.admin.updateUserById(targetId, { password })
      if (pwError) {
        return NextResponse.json({ error: pwError.message }, { status: 500 })
      }
    }

    const profileUpdate = {}
    if (nom !== undefined) profileUpdate.nom = nom
    if (prenom !== undefined) profileUpdate.prenom = prenom
    if (telephone !== undefined) profileUpdate.telephone = telephone

    let profil = null
    if (Object.keys(profileUpdate).length > 0) {
      const { data, error } = await supabase
        .from('utilisateurs')
        .update(profileUpdate)
        .eq('id', targetId)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      profil = data
    } else {
      const { data } = await supabase
        .from('utilisateurs')
        .select()
        .eq('id', targetId)
        .single()
      profil = data
    }

    return NextResponse.json({
      id: profil.id,
      nom: profil.nom,
      prenom: profil.prenom,
      telephone: profil.telephone,
      role: profil.role,
    })
  } catch (error) {
    console.error('[/api/utilisateurs/[id]]', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
