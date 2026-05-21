'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/lib/context/app-context'
import {
  LayoutDashboard,
  Package,
  ScrollText,
  ClipboardList,
  User,
  Settings,
} from 'lucide-react'

export default function BottomNav() {
  const { user, tr } = useApp()
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: tr.dashboard },
    { href: '/inventory', icon: Package, label: tr.inventory },
    { href: '/log', icon: ScrollText, label: tr.log },
    { href: '/requests', icon: ClipboardList, label: tr.requests },
    { href: '/profile', icon: User, label: tr.profile },
    ...(user?.role === 'superAdmin'
      ? [{ href: '/admin', icon: Settings, label: tr.admin }]
      : []
    ),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-zinc-800 z-10">
      <div className="max-w-2xl mx-auto flex items-center overflow-x-auto scrollbar-none px-2 h-16">
        <div className="flex items-center gap-1 min-w-max mx-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-16 ${
                  active ? 'text-blue-500' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[10px] uppercase tracking-wider whitespace-nowrap">
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}