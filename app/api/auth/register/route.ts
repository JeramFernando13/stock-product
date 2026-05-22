import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { full_name, username, password, org_name } = await request.json()

  if (!full_name || !username || !password || !org_name) {
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

  // Crea slug org
  const slug = org_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  // Controlla se slug esiste già
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingOrg) {
    return NextResponse.json({ error: 'Nome organizzazione già in uso' }, { status: 409 })
  }

  // Crea organizzazione
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: org_name, slug, plan: 'free', status: 'active' })
    .select()
    .single()

  if (orgError || !org) {
    return NextResponse.json({ error: 'Errore nella creazione organizzazione' }, { status: 500 })
  }

  // Crea profilo superAdmin
  const password_hash = await bcrypt.hash(password, 10)

  const { error: profileError } = await supabase.from('profiles').insert({
    full_name,
    username,
    password_hash,
    role: 'superAdmin',
    status: 'approved', // ← superAdmin approvato automaticamente
    lang: 'it',
    organization_id: org.id,
  })

  if (profileError) {
    // Rollback org
    await supabase.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: 'Errore durante la registrazione' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}