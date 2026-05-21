import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { full_name, username, password } = await request.json()

  if (!full_name || !username || !password) {
    return NextResponse.json({ error: 'Tutti i campi sono obbligatori' }, { status: 400 })
  }

  const supabase = await createClient()

  // Controlla se username esiste già
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Username già in uso' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 10)

  const { error } = await supabase.from('profiles').insert({
    full_name,
    username,
    password_hash,
    role: 'readonly',
    status: 'pending',
    lang: 'it',
  })

  if (error) {
    return NextResponse.json({ error: 'Errore durante la registrazione' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}