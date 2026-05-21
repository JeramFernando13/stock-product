import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/actions'
import { createClient } from '@/lib/supabase/server'
import type { Lang } from '@/lib/types'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { lang } = await request.json() as { lang: Lang }

  const supabase = await createClient()
  await supabase.from('profiles').update({ lang }).eq('id', session.id)

  const updatedSession = { ...session, lang }
  const response = NextResponse.json({ ok: true })
  response.cookies.set('stock-session', JSON.stringify(updatedSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}