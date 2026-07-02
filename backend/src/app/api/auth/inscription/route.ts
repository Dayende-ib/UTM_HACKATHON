// @ts-nocheck
import { createServiceClient } from '@/lib/supabase/api'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, nom, prenom, telephone, role = 'citoyen' } = body

    if (!email || !password || !nom) {
      return Response.json({ error: 'email, password et nom requis' }, { status: 400 })
    }

    const authClient = createServiceClient()

    const { data: authData, error: authError } = await authClient.auth.signUp({
      email,
      password,
      options: { data: { nom, prenom, telephone, role } },
    })

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 })
    }

    if (authData.user) {
      // Client séparé : signUp() sur authClient a substitué son contexte
      // d'autorisation à la clé service_role, ce qui ferait échouer cet
      // insert silencieusement (aucune policy RLS INSERT sur utilisateurs).
      const dataClient = createServiceClient()
      const { error: insertError } = await dataClient.from('utilisateurs').insert({
        id: authData.user.id,
        nom,
        prenom: prenom || '',
        telephone: telephone || null,
        role,
      })
      if (insertError) {
        console.error('[/api/auth/inscription] création profil échouée:', insertError)
      }
    }

    return Response.json({
      user: authData.user ? {
        id: authData.user.id,
        email: authData.user.email,
        nom,
        prenom,
        telephone,
        role,
      } : null,
      token: authData.session?.access_token || '',
    }, { status: 201 })
  } catch (error) {
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
