import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Credenziali mancanti' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, lang, password_hash, status, organization_id')
    .eq('username', username)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Utente non trovato' }, { status: 401 })
  }

  if (user.status !== 'approved') {
    return NextResponse.json({ error: 'Account non ancora approvato' }, { status: 403 })
  }

  // Controlla che l'org sia attiva
  if (user.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('status')
      .eq('id', user.organization_id)
      .single()

    if (org?.status !== 'active') {
      return NextResponse.json({ error: 'Organizzazione sospesa o non attiva' }, { status: 403 })
    }
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatch) {
    return NextResponse.json({ error: 'Password errata' }, { status: 401 })
  }

  const { data: profileCats } = await supabase
    .from('profile_categories')
    .select('category_id, access_level')
    .eq('profile_id', user.id)

  const category_ids = profileCats?.map(pc => pc.category_id) ?? []
  const category_access = Object.fromEntries(
    profileCats?.map(pc => [pc.category_id, pc.access_level]) ?? []
  )

  const sessionData = {
    id: user.id,
    full_name: user.full_name,
    role: user.role,
    organization_id: user.organization_id,
    category_ids,
    category_access,
    lang: user.lang,
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('stock-session', JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}