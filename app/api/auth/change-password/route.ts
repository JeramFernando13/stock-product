import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/actions'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { currentPassword, newPassword } = await request.json()

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('password_hash')
    .eq('id', session.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })

  const match = await bcrypt.compare(currentPassword, profile.password_hash)
  if (!match) return NextResponse.json({ error: 'Password attuale errata' }, { status: 401 })

  const newHash = await bcrypt.hash(newPassword, 10)
  await supabase.from('profiles').update({ password_hash: newHash }).eq('id', session.id)

  return NextResponse.json({ ok: true })
}