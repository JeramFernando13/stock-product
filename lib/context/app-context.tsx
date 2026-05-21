'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { SessionUser, Lang } from '@/lib/types'
import { getTranslations } from '@/lib/i18n'

interface AppContextType {
  user: SessionUser | null
  lang: Lang
  tr: Record<string, string>
  setLang: (lang: Lang) => void
  loading: boolean
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [lang, setLangState] = useState<Lang>('it')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUser(data)
          setLangState(data.lang ?? 'it')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const setLang = async (newLang: Lang) => {
    setLangState(newLang)
    await fetch('/api/auth/lang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: newLang }),
    })
  }

  return (
    <AppContext.Provider value={{
      user,
      lang,
      tr: getTranslations(lang),
      setLang,
      loading,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}