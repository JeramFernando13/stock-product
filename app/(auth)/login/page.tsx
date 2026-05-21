'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Loader2 } from 'lucide-react'

type Step = 'login' | 'register' | 'pending'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('login')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Errore durante il login')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const handleRegister = async () => {
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, username, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Errore durante la registrazione')
      setLoading(false)
      return
    }
    setStep('pending')
    setLoading(false)
  }

  if (step === 'pending') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-10">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-white text-lg font-semibold tracking-tight">Stoccaggio</h1>
            <p className="text-zinc-500 text-sm mt-1 uppercase tracking-wider">Control Center</p>
          </div>
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 text-center">
            <div className="w-10 h-10 bg-amber-950/50 border border-amber-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
            </div>
            <p className="text-white text-sm font-medium mb-2">Richiesta inviata</p>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Il tuo account è in attesa di approvazione. Contatta un amministratore.
            </p>
            <button
              onClick={() => setStep('login')}
              className="mt-5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Torna al login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white text-lg font-semibold tracking-tight">Stoccaggio</h1>
          <p className="text-zinc-500 text-sm mt-1 uppercase tracking-wider">Control Center</p>
        </div>

        <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-white text-base font-medium mb-5">
            {step === 'login' ? 'Accedi' : 'Richiedi accesso'}
          </h2>

          <div className="space-y-4">
            {step === 'register' && (
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 block">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Es. Sara Rossi"
                  className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 block">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && step === 'login' && handleLogin()}
                placeholder="il tuo username"
                className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && step === 'login' && handleLogin()}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-xs text-red-400">{error}</p>
          )}

          <button
            onClick={step === 'login' ? handleLogin : handleRegister}
            disabled={loading}
            className="mt-5 w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {step === 'login' ? 'Accedi' : 'Richiedi accesso'}
          </button>

          <button
            onClick={() => { setStep(step === 'login' ? 'register' : 'login'); setError('') }}
            className="mt-3 w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {step === 'login' ? 'Non hai un account? Richiedi accesso' : 'Hai già un account? Accedi'}
          </button>
        </div>
      </div>
    </div>
  )
}