// @ts-nocheck
import { createServiceClient } from '@/lib/supabase/api'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return Response.json({ error: 'email et password requis' }, { status: 400 })
    }

    const authClient = createServiceClient()
    const { data, error } = await authClient.auth.signInWithPassword({ email, password })

    if (error) {
      return Response.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    // Client séparé et non authentifié : signInWithPassword() sur authClient a
    // substitué son contexte d'autorisation (JWT de l'utilisateur connecté) à
    // la clé service_role. Réutiliser authClient ici ferait échouer cette
    // lecture silencieusement (droits insuffisants sur la table).
    const dataClient = createServiceClient()
    const { data: profil, error: profilError } = await dataClient
      .from('utilisateurs')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profilError) {
      console.error('[/api/auth/connexion] lecture profil échouée:', profilError)
    }

    return Response.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        nom: profil?.nom || data.user.user_metadata?.nom || '',
        prenom: profil?.prenom || data.user.user_metadata?.prenom || '',
        telephone: profil?.telephone || data.user.user_metadata?.telephone || undefined,
        role: profil?.role || data.user.user_metadata?.role || 'citoyen',
      },
      token: data.session.access_token,
      session: data.session,
    })
  } catch (error) {
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
