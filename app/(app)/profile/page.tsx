'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/lib/context/app-context'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'
import type { Lang } from '@/lib/types'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function ProfilePage() {
  const { user, lang, setLang, tr } = useApp()
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleChangePassword = async () => {
    setPwError('')
    if (newPassword !== confirmPassword) {
      setPwError('Le password non coincidono')
      return
    }
    if (newPassword.length < 6) {
      setPwError('La password deve essere di almeno 6 caratteri')
      return
    }

    setSaving(true)

    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    const data = await res.json()
    if (!res.ok) {
      setPwError(data.error ?? 'Errore durante il cambio password')
      setSaving(false)
      return
    }

    setPwSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setChangingPassword(false)
    setSaving(false)
    setTimeout(() => setPwSuccess(false), 3000)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const languages: { key: Lang; label: string; native: string }[] = [
    { key: 'it', label: 'Italiano', native: 'IT' },
    { key: 'en', label: 'English', native: 'EN' },
    { key: 'si', label: 'සිංහල', native: 'සි' },
  ]

  const roleLabel: Record<string, string> = {
    superAdmin: 'Super Admin',
    admin: 'Admin',
    user: 'User',
    readonly: 'Read Only',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-xl font-semibold">{tr.profile}</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Impostazioni account</p>
      </div>

      {/* Info utente */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-400 text-sm font-semibold">
              {user?.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">{user?.full_name}</p>
            <p className="text-zinc-500 text-xs">@{user?.id.slice(0, 8)}...</p>
          </div>
          <div className="ml-auto">
            <Badge variant="blue">{roleLabel[user?.role ?? 'readonly']}</Badge>
          </div>
        </div>
      </Card>

      {/* Lingua */}
      <Card className="p-4">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">{tr.language}</p>
        <div className="flex gap-2">
          {languages.map(l => (
            <button
              key={l.key}
              onClick={() => setLang(l.key)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-colors border ${
                lang === l.key
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="block text-base mb-0.5">{l.native}</span>
              <span className="text-[10px] uppercase tracking-wider">{l.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Cambio password */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Password</p>
          {pwSuccess && (
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <Check className="w-3.5 h-3.5" /> Aggiornata!
            </div>
          )}
        </div>

        {!changingPassword ? (
          <button
            onClick={() => setChangingPassword(true)}
            className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white text-sm rounded-lg transition-colors"
          >
            Cambia password
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">
                Password attuale
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">
                Nuova password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">
                Conferma password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
              />
            </div>
            {pwError && <p className="text-xs text-red-400">{pwError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {tr.save}
              </button>
              <button
                onClick={() => { setChangingPassword(false); setPwError('') }}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
              >
                {tr.cancel}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-2.5 border border-red-900/50 text-red-400 hover:bg-red-950/30 text-sm rounded-xl transition-colors"
      >
        {tr.logout}
      </button>
    </div>
  )
}