// @ts-nocheck
import { createServiceClient, getUser } from '@/lib/supabase/api'

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const commerce_id = searchParams.get('commerce_id') || searchParams.get('commerceId')
    const user_id = searchParams.get('user_id') || searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!commerce_id && !user_id) {
      return Response.json({ error: 'commerce_id ou user_id requis' }, { status: 400 })
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('avis')
      .select('*, utilisateurs(id, nom), commerces(id, nom, ville)', { count: 'exact' })
      .eq('is_spam', false)
      .range(from, to)
      .order('created_at', { ascending: false })

    if (commerce_id) query = query.eq('commerce_id', commerce_id)
    if (user_id) query = query.eq('user_id', user_id)

    const { data, error, count } = await query

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const avis = (data || []).map((row) => {
      const user = row.utilisateurs
      const commerce = row.commerces
      return {
        id: row.id,
        texte: row.commentaire,
        note: row.note,
        auteurId: row.user_id,
        auteur: user ? { nom: user.nom } : undefined,
        commerceId: row.commerce_id,
        commerce: commerce ? { id: commerce.id, nom: commerce.nom, ville: commerce.ville } : undefined,
        iaScore: row.score_sentiment,
        estSpam: row.is_spam,
        estModer: !row.is_spam,
        sentiment: row.sentiment,
        dateCreation: row.created_at,
      }
    })

    return Response.json({ avis, total: count, page, limit })
  } catch (error) {
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request)
    const body = await request.json()
    const { commerce_id, texte, note } = body

    if (!commerce_id || !texte || !note) {
      return Response.json({ error: 'commerce_id, texte et note requis' }, { status: 400 })
    }

    const commentaire = String(texte).trim()
    const rating = Number(note)

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return Response.json({ error: 'note invalide' }, { status: 400 })
    }

    if (commentaire.length < 10 || commentaire.length > 500) {
      return Response.json({ error: 'texte invalide' }, { status: 400 })
    }

    // Analyse IA
    let analyseIA = null
    try {
      const { ai } = await import('@/lib/ia/client')
      const { ANALYZE_SYSTEM } = await import('@/lib/ia/prompts')
      const { extractJson } = await import('@/lib/ia/parser')

      const response = await ai.chat.completions.create({
        model: process.env.AI_MODEL || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: ANALYZE_SYSTEM },
          { role: 'user', content: `Analyse ce commentaire :\n\n${commentaire}` },
        ],
        temperature: 0.3,
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        analyseIA = extractJson(content)
      }
    } catch (error) {
      console.error('Erreur analyse IA:', error)
    }

    const supabase = createServiceClient()
    const { data: avis, error: insertError } = await supabase
      .from('avis')
      .insert({
        commerce_id,
        user_id: user?.id ?? null,
        note: rating,
        commentaire,
        sentiment: analyseIA?.sentiment || 'neutre',
        score_sentiment: analyseIA?.note ? analyseIA.note / 5 : 0,
        is_spam: analyseIA ? !analyseIA.pertinent : false,
      })
      .select()
      .single()

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 })
    }

    // Update commerce stats
    const { data: allAvis } = await supabase
      .from('avis')
      .select('note')
      .eq('commerce_id', commerce_id)

    if (allAvis && allAvis.length > 0) {
      const avg = allAvis.reduce((sum, a) => sum + a.note, 0) / allAvis.length
      await supabase
        .from('commerces')
        .update({
          note_moyenne: Math.round(avg * 100) / 100,
          nombre_avis: allAvis.length,
        })
        .eq('id', commerce_id)
    }

    return Response.json({
      id: avis.id,
      texte: avis.commentaire,
      note: avis.note,
      auteurId: avis.user_id,
      commerceId: avis.commerce_id,
      iaScore: avis.score_sentiment,
      estSpam: avis.is_spam,
      estModer: !avis.is_spam,
      sentiment: avis.sentiment,
      dateCreation: avis.created_at,
    }, { status: 201 })
  } catch (error) {
    console.error('[/api/avis]', error)
    return Response.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
