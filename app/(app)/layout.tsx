'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/app-context'
import { Loader2 } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <TopBar />
      <main className="flex-1 pb-24 max-w-2xl w-full mx-auto px-4 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}