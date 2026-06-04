'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/lib/context/app-context'
import { Plus, Minus, Loader2, X, Check, TrendingDown,  } from 'lucide-react'
import type { Product, Category } from '@/lib/types'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

type ProductWithCategory = Product & { categories: Category }

export default function InventoryPage() {
  const { user, tr } = useApp()
  const supabase = useMemo(() => createClient(), [])

  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState<string>('all')

  // Stato per aggiornamento quantità inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState<string>('')
  const [editNote, setEditNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Stato per nuovo prodotto
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '', category_id: '', qty: 0, unit: 'pz', min_qty: 1
  })
  const [savingNew, setSavingNew] = useState(false)

  const fetchData = async () => {
    let query = supabase
      .from('products')
      .select('*, categories(*)')
      .eq('organization_id', user?.organization_id)
      .order('name')

    if (user?.role !== 'superAdmin' && user?.category_ids && user.category_ids.length > 0) {
      query = query.in('category_id', user.category_ids)
    }

    const [{ data: prods }, { data: cats }] = await Promise.all([
      query,
      supabase
        .from('categories')
        .select('*')
        .eq('organization_id', user?.organization_id)
        .order('name_it'),
    ])

    setProducts(prods ?? [])

    if (user?.role !== 'superAdmin' && user?.category_ids && user.category_ids.length > 0) {
      setCategories(cats?.filter(c => user.category_ids.includes(c.id)) ?? [])
    } else {
      setCategories(cats ?? [])
    }

    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchData() }, [])

  const canEdit = (categoryId: string) =>
    user?.role === 'superAdmin' ||
    user?.category_access?.[categoryId] === 'edit'

  const canAddProducts =
    user?.role === 'superAdmin' || user?.role === 'admin'

  const startEdit = (p: ProductWithCategory) => {
    setEditingId(p.id)
    setEditQty(String(p.qty))
    setEditNote('')
  }

  const increment = async (p: ProductWithCategory) => {
    const newQty = p.qty + 1
    await saveQty(p, newQty)
  }

  const decrement = async (p: ProductWithCategory) => {
    if (p.qty <= 0) return
    const newQty = p.qty - 1
    await saveQty(p, newQty)
  }

  const saveQty = async (p: ProductWithCategory, qty: number, note?: string) => {
    setSaving(true)
    const delta = qty - p.qty

    await Promise.all([
      supabase.from('products').update({ qty }).eq('id', p.id),
      supabase.from('movements').insert({
        product_id: p.id,
        user_id: user?.id,
        organization_id: user?.organization_id,
        delta,
        qty_after: qty,
        note: note || null,
      }),
    ])

    setSaving(false)
    setEditingId(null)
    setEditQty('')
    setEditNote('')
    fetchData()
  }

  const confirmEdit = async (p: ProductWithCategory) => {
    if (editQty === '') return
    await saveQty(p, Number(editQty), editNote)
  }

  const saveNewProduct = async () => {
    if (!newProduct.name || !newProduct.category_id) return
    setSavingNew(true)
    await supabase.from('products').insert({
      ...newProduct,
      created_by: user?.id,
      organization_id: user?.organization_id,
    })
    setNewProduct({ name: '', category_id: '', qty: 0, unit: 'pz', min_qty: 1 })
    setShowNewProduct(false)
    setSavingNew(false)
    fetchData()
  }

  const filtered = selectedCat === 'all'
    ? products
    : products.filter(p => p.category_id === selectedCat)

  const grouped = filtered.reduce((acc, p) => {
    const catId = p.category_id
    if (!acc[catId]) acc[catId] = []
    acc[catId].push(p)
    return acc
  }, {} as Record<string, ProductWithCategory[]>)

  const getCatName = (cat: Category) => {
    const l = user?.lang ?? 'it'
    if (l === 'en') return cat.name_en
    if (l === 'si') return cat.name_si
    return cat.name_it
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

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">{tr.inventory}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{products.length} prodotti</p>
        </div>
        {canAddProducts && (
          <button
            onClick={() => setShowNewProduct(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nuovo
          </button>
        )}
      </div>

      {/* Form nuovo prodotto */}
      {showNewProduct && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-white text-sm font-medium">Nuovo prodotto</p>
            <button onClick={() => setShowNewProduct(false)} className="text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">Nome</label>
            <input
              type="text"
              value={newProduct.name}
              onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
              placeholder="Es. Olio EVO"
              className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">Categoria</label>
            <select
              value={newProduct.category_id}
              onChange={e => setNewProduct(p => ({ ...p, category_id: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-blue-600"
            >
              <option value="">Seleziona categoria</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name_it}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">Qtà</label>
              <input
                type="number"
                value={newProduct.qty}
                onChange={e => setNewProduct(p => ({ ...p, qty: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">Unità</label>
              <input
                type="text"
                value={newProduct.unit}
                onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))}
                placeholder="pz"
                className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">Min</label>
              <input
                type="number"
                value={newProduct.min_qty}
                onChange={e => setNewProduct(p => ({ ...p, min_qty: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveNewProduct}
              disabled={savingNew || !newProduct.name || !newProduct.category_id}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              {savingNew ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : tr.save}
            </button>
            <button
              onClick={() => setShowNewProduct(false)}
              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
            >
              {tr.cancel}
            </button>
          </div>
        </Card>
      )}

      {/* Filtro categorie */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider whitespace-nowrap transition-colors shrink-0 ${
            selectedCat === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Tutti
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider whitespace-nowrap transition-colors shrink-0 ${
              selectedCat === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {getCatName(cat)}
          </button>
        ))}
      </div>

      {/* Lista prodotti */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-center text-zinc-600 text-sm py-8">{tr.noData}</p>
      ) : (
        Object.entries(grouped).map(([catId, prods]) => {
          const cat = categories.find(c => c.id === catId)
          if (!cat) return null
          return (
            <div key={catId}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                {getCatName(cat)}
              </p>
              <Card className="divide-y divide-zinc-800/50">
                {prods.map(p => {
                  const below = p.qty <= p.min_qty
                  const pct = Math.min((p.qty / Math.max(p.min_qty * 3, 1)) * 100, 100)
                  const editing = editingId === p.id
                  const editable = canEdit(p.category_id)

                  return (
                    <div key={p.id} className="px-4 py-3">
                      <div className="flex items-center gap-3">

                        {/* Nome + badge */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm text-zinc-200 truncate">{p.name}</p>
                            {below && <TrendingDown className="w-3 h-3 text-red-400 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-zinc-600 mt-0.5">min {p.min_qty} {p.unit}</p>
                        </div>

                        {/* Controlli quantità */}
                        {editable ? (
                          editing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={editQty}
                                onChange={e => setEditQty(e.target.value)}
                                className="w-16 px-2 py-1 text-sm bg-zinc-900 border border-blue-600 rounded-lg text-white text-center focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => confirmEdit(p)}
                                disabled={saving}
                                className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                              >
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => decrement(p)}
                                className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => startEdit(p)}
                                className={`min-w-12 text-center px-2 py-1 rounded-lg text-sm font-medium border transition-colors ${
                                  below
                                    ? 'bg-red-950/40 border-red-800/50 text-red-400'
                                    : 'bg-green-950/40 border-green-800/50 text-green-400'
                                }`}
                              >
                                {p.qty} {p.unit}
                              </button>
                              <button
                                onClick={() => increment(p)}
                                className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )
                        ) : (
                          <Badge variant={below ? 'red' : 'green'}>
                            {p.qty} {p.unit}
                          </Badge>
                        )}
                      </div>

                      {/* Barra progresso */}
                      <div className="mt-2">
                        <div className="w-full bg-zinc-800 rounded-full h-0.5">
                          <div
                            className={`h-0.5 rounded-full transition-all ${below ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Campo nota quando si sta editando */}
                      {editing && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={editNote}
                            onChange={e => setEditNote(e.target.value)}
                            placeholder="Nota opzionale..."
                            className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </Card>
            </div>
          )
        })
      )}
    </div>
  )
}