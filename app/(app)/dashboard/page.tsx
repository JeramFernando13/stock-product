'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/lib/context/app-context'
import { AlertTriangle, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { Product, Movement } from '@/lib/types'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'

type MovementWithRelations = Movement & {
  profiles: { full_name: string }
  products: { name: string }
}

export default function DashboardPage() {
  const { tr, user } = useApp()
  const supabase = useMemo(() => createClient(), [])
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<MovementWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!user?.organization_id) return
    const [{ data: prods }, { data: movs }] = await Promise.all([
      supabase
        .from('products')
        .select('*, categories(*)')
        .eq('organization_id', user.organization_id)
        .order('name'),
      supabase
        .from('movements')
        .select('*, profiles(full_name), products(name)')
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])
    setProducts(prods ?? [])
    setMovements(movs ?? [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchData() }, [user?.organization_id])

  const belowThreshold = products.filter(p => p.qty <= p.min_qty)
  const totalCategories = new Set(products.map(p => p.category_id)).size

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000)
    if (diffH < 1) return 'Ora'
    if (diffH < 24) return `${diffH}h fa`
    if (diffH < 48) return 'Ieri'
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-zinc-600">
        {tr.loading}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-xl font-semibold">{tr.dashboard}</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Panoramica magazzino</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={tr.totalProducts}
          value={products.length}
          sub={`${totalCategories} ${tr.categories}`}
        />
        <StatCard
          label={tr.belowThreshold}
          value={belowThreshold.length}
          sub={tr.toReorder}
          danger={belowThreshold.length > 0}
        />
      </div>

      {belowThreshold.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-400">{tr.belowThreshold}</span>
          </div>
          <div className="space-y-2">
            {belowThreshold.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">{p.name}</span>
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">{p.qty} {p.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">{tr.recentUpdates}</p>
        <Card className="divide-y divide-zinc-800/50">
          {movements.length === 0 ? (
            <p className="text-sm text-zinc-600 p-4 text-center">{tr.noData}</p>
          ) : (
            movements.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  m.delta > 0 ? 'bg-green-950/60' : 'bg-red-950/60'
                }`}>
                  {m.delta > 0
                    ? <ArrowUp className="w-3.5 h-3.5 text-green-400" />
                    : <ArrowDown className="w-3.5 h-3.5 text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{m.products?.name}</p>
                  <p className="text-xs text-zinc-600">{m.profiles?.full_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-medium ${m.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {m.delta > 0 ? '+' : ''}{m.delta}
                  </p>
                  <p className="text-xs text-zinc-600">{formatDate(m.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}