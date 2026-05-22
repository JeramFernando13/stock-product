'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/lib/context/app-context'
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import type { Movement } from '@/lib/types'
import Card from '@/components/ui/Card'

type MovementWithRelations = Movement & {
  profiles: { full_name: string }
  products: { name: string; category_id: string; categories: { name_it: string } }
}

export default function LogPage() {
  const { user, tr } = useApp()
  const supabase = useMemo(() => createClient(), [])
  const [movements, setMovements] = useState<MovementWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  
  const fetchData = async () => {
    const { data } = await supabase
      .from('movements')
      .select('*, profiles(full_name), products(name, category_id, categories(name_it))')
      .eq('organization_id', user?.organization_id)
      .order('created_at', { ascending: false })
      .limit(100)

    let filtered = data ?? []
    if (user?.role !== 'superAdmin' && user?.category_ids && user.category_ids.length > 0) {
      filtered = filtered.filter(m =>
        user.category_ids.includes(m.products?.category_id ?? '')
      )
    }

    setMovements(filtered)
    setLoading(false)
  }
  
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchData() }, [])

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000)
    if (diffH < 1) return 'Ora'
    if (diffH < 24) return `${diffH}h fa`
    if (diffH < 48) return 'Ieri'
    return d.toLocaleDateString('it-IT', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-xl font-semibold">{tr.log}</h1>
        <p className="text-zinc-500 text-sm mt-0.5">{movements.length} movimenti</p>
      </div>

      {movements.length === 0 ? (
        <p className="text-center text-zinc-600 text-sm py-8">{tr.noData}</p>
      ) : (
        <Card className="divide-y divide-zinc-800/50">
          {movements.map(m => (
            <div key={m.id} className="px-4 py-3 flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                m.delta > 0 ? 'bg-green-950/60' : 'bg-red-950/60'
              }`}>
                {m.delta > 0
                  ? <ArrowUp className="w-3.5 h-3.5 text-green-400" />
                  : <ArrowDown className="w-3.5 h-3.5 text-red-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-zinc-200 truncate">{m.products?.name}</p>
                  <p className={`text-sm font-medium shrink-0 ${
                    m.delta > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {m.delta > 0 ? '+' : ''}{m.delta}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500">{m.profiles?.full_name}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-xs text-zinc-600">{m.products?.categories?.name_it}</span>
                  </div>
                  <span className="text-xs text-zinc-600">{formatDate(m.created_at)}</span>
                </div>
                {m.note && (
                  <p className="text-xs text-zinc-600 mt-1 italic">&ldquo;{m.note}&rdquo;</p>
                )}
                <p className="text-[10px] text-zinc-700 mt-0.5">
                  → {m.qty_after} dopo
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}