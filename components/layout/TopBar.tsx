'use client'

import { Package } from 'lucide-react'
import { useApp } from '@/lib/context/app-context'
import { useRouter } from 'next/navigation'

export default function TopBar() {
  const { user, tr } = useApp()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-[#111111] border-b border-zinc-800 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-none">Stoccaggio</p>
            <p className="text-zinc-500 text-[10px] mt-0.5 uppercase tracking-wider">Control Center</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-white text-xs font-medium leading-none">{user?.full_name}</p>
            <p className="text-blue-500 text-[10px] uppercase tracking-wider mt-0.5">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1 border border-zinc-800 hover:border-zinc-600 rounded-lg"
          >
            {tr.logout}
          </button>
        </div>
      </div>
    </header>
  )
}