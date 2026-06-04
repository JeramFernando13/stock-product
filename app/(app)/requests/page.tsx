'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/lib/context/app-context'
import { Plus, Check, X, Loader2, Copy, CheckCheck, Minus, ShoppingCart, Trash2 } from 'lucide-react'
import type { Request, Category, Product } from '@/lib/types'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

type RequestWithRelations = Request & {
  profiles: { full_name: string }
  categories: Category | null
}

type RequestItem = {
  id: string
  product_id: string | null
  name: string
  qty: number
  unit: string
}

const ITEMS_PREFIX = '__items__:'

const serializeItems = (items: RequestItem[]) =>
  ITEMS_PREFIX + JSON.stringify(items.map(({ id: _id, ...rest }) => rest))

const parseItems = (text: string): RequestItem[] | null => {
  if (!text.startsWith(ITEMS_PREFIX)) return null
  try {
    const arr = JSON.parse(text.slice(ITEMS_PREFIX.length))
    return arr.map((item: Omit<RequestItem, 'id'>, i: number) => ({ ...item, id: String(i) }))
  } catch { return null }
}

export default function RequestsPage() {
  const { user, tr } = useApp()
  const supabase = useMemo(() => createClient(), [])

  const [requests, setRequests] = useState<RequestWithRelations[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newCatId, setNewCatId] = useState('')
  const [requestItems, setRequestItems] = useState<RequestItem[]>([])
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // stato ricerca prodotto
  const [itemSearch, setItemSearch] = useState('')
  const [itemQty, setItemQty] = useState(1)
  const [itemUnit, setItemUnit] = useState('pz')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const fetchData = async () => {
    const [{ data: reqs }, { data: cats }, { data: prods }] = await Promise.all([
      supabase
        .from('requests')
        .select('*, profiles(full_name), categories(*)')
        .eq('organization_id', user?.organization_id)
        .order('created_at', { ascending: false }),
      supabase
        .from('categories')
        .select('*')
        .eq('organization_id', user?.organization_id)
        .order('name_it'),
      supabase
        .from('products')
        .select('*')
        .eq('organization_id', user?.organization_id)
        .order('name'),
    ])

    let filtered = reqs ?? []
    if (user?.role !== 'superAdmin' && user?.category_ids && user.category_ids.length > 0) {
      filtered = filtered.filter(r =>
        !r.category_id || user.category_ids.includes(r.category_id)
      )
    }

    setRequests(filtered)

    if (user?.role !== 'superAdmin' && user?.category_ids && user.category_ids.length > 0) {
      setCategories(cats?.filter(c => user.category_ids.includes(c.id)) ?? [])
    } else {
      setCategories(cats ?? [])
    }

    setProducts(prods ?? [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchData() }, [user?.organization_id])

  const suggestions = itemSearch.length > 0
    ? products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase()))
    : []

  const exactMatch = products.some(p => p.name.toLowerCase() === itemSearch.toLowerCase())

  const addItemFromProduct = (p: Product) => {
    setRequestItems(prev => [...prev, {
      id: Date.now().toString(),
      product_id: p.id,
      name: p.name,
      qty: itemQty,
      unit: p.unit,
    }])
    setItemSearch('')
    setItemQty(1)
    setItemUnit('pz')
    setShowSuggestions(false)
  }

  const addNewItem = () => {
    if (!itemSearch.trim()) return
    setRequestItems(prev => [...prev, {
      id: Date.now().toString(),
      product_id: null,
      name: itemSearch.trim(),
      qty: itemQty,
      unit: itemUnit,
    }])
    setItemSearch('')
    setItemQty(1)
    setItemUnit('pz')
    setShowSuggestions(false)
  }

  const updateItemQty = (id: string, delta: number) => {
    setRequestItems(prev => prev.map(item =>
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ))
  }

  const removeItem = (id: string) => {
    setRequestItems(prev => prev.filter(item => item.id !== id))
  }

  const submitRequest = async () => {
    if (requestItems.length === 0) return
    setSaving(true)
    await supabase.from('requests').insert({
      user_id: user?.id,
      category_id: newCatId || null,
      text: serializeItems(requestItems),
      status: 'pending',
      organization_id: user?.organization_id,
    })
    setRequestItems([])
    setNewCatId('')
    setShowForm(false)
    setSaving(false)
    fetchData()
  }

  const resetForm = () => {
    setShowForm(false)
    setRequestItems([])
    setNewCatId('')
    setItemSearch('')
    setItemQty(1)
    setItemUnit('pz')
  }

  const updateStatus = async (id: string, status: 'approved' | 'declined') => {
    await supabase
      .from('requests')
      .update({ status, approved_by: user?.id })
      .eq('id', id)
    fetchData()
  }

  const canApprove = user?.role === 'superAdmin' || user?.role === 'admin'

  const shoppingList = requests.filter(r => r.status !== 'declined')

  const copyShoppingList = () => {
    const lines: string[] = []
    shoppingList.forEach(r => {
      const items = parseItems(r.text)
      if (items) {
        items.forEach(item => lines.push(`• ${item.name} × ${item.qty} ${item.unit}`))
      } else {
        lines.push(`• ${r.text}${r.categories ? ` (${r.categories.name_it})` : ''}`)
      }
    })
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">{tr.requests}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{requests.filter(r => r.status === 'pending').length} in attesa</p>
        </div>
        {shoppingList.length > 0 && (
          <button
            onClick={copyShoppingList}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
          >
            {copied
              ? <><CheckCheck className="w-3.5 h-3.5 text-green-400" /> Copiato!</>
              : <><Copy className="w-3.5 h-3.5" /> Copia lista</>
            }
          </button>
        )}
      </div>

      {/* Pulsante nuova richiesta */}
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 text-sm transition-colors"
      >
        <Plus className="w-4 h-4" /> {tr.newRequest}
      </button>

      {/* Form nuova richiesta */}
      {showForm && (
        <Card className="p-4 space-y-4">
          <p className="text-white text-sm font-medium">{tr.newRequest}</p>

          {/* Categoria */}
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Categoria (opzionale)</label>
            <select
              value={newCatId}
              onChange={e => setNewCatId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-blue-600"
            >
              <option value="">Nessuna categoria</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name_it}</option>
              ))}
            </select>
          </div>

          {/* Prodotti aggiunti */}
          {requestItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Prodotti ({requestItems.length})</p>
              {requestItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2">
                  <ShoppingCart className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="flex-1 text-sm text-zinc-200 truncate">{item.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateItemQty(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm text-white min-w-12 text-center">{item.qty} {item.unit}</span>
                    <button
                      onClick={() => updateItemQty(item.id, 1)}
                      className="w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-zinc-600 hover:text-red-400 transition-colors ml-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Aggiungi prodotto */}
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Aggiungi prodotto</p>
            <div className="relative">
              <input
                type="text"
                value={itemSearch}
                onChange={e => { setItemSearch(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Cerca prodotto o scrivi nome nuovo..."
                className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-600"
              />

              {showSuggestions && itemSearch.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden z-10 max-h-52 overflow-y-auto shadow-xl">
                  {suggestions.map(p => (
                    <button
                      key={p.id}
                      onMouseDown={() => addItemFromProduct(p)}
                      className="w-full px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800 flex items-center justify-between"
                    >
                      <span>{p.name}</span>
                      <span className="text-xs text-zinc-500 shrink-0 ml-2">{p.qty} {p.unit} in stock</span>
                    </button>
                  ))}
                  {!exactMatch && itemSearch.trim() && (
                    <button
                      onMouseDown={addNewItem}
                      className="w-full px-3 py-2.5 text-left text-sm text-blue-400 hover:bg-zinc-800 flex items-center gap-2 border-t border-zinc-800"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>Aggiungi &quot;{itemSearch.trim()}&quot; come nuovo</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Qty + unità per prodotti non nel catalogo */}
            {itemSearch.trim() && !exactMatch && (
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  min={1}
                  value={itemQty}
                  onChange={e => setItemQty(Math.max(1, Number(e.target.value)))}
                  placeholder="Qtà"
                  className="w-24 px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
                />
                <input
                  type="text"
                  value={itemUnit}
                  onChange={e => setItemUnit(e.target.value)}
                  placeholder="pz"
                  className="w-24 px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-600"
                />
              </div>
            )}
          </div>

          {/* Azioni */}
          <div className="flex gap-2">
            <button
              onClick={submitRequest}
              disabled={saving || requestItems.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {tr.save}
            </button>
            <button onClick={resetForm} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors">
              {tr.cancel}
            </button>
          </div>
        </Card>
      )}

      {/* Lista richieste */}
      {requests.length === 0 ? (
        <p className="text-center text-zinc-600 text-sm py-8">{tr.noData}</p>
      ) : (
        <Card className="divide-y divide-zinc-800/50">
          {requests.map(r => {
            const items = parseItems(r.text)
            return (
              <div key={r.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    {items ? (
                      <div className="space-y-1">
                        {items.map((item, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <ShoppingCart className="w-3 h-3 text-zinc-600 shrink-0" />
                            <span className="text-sm text-zinc-200 truncate">{item.name}</span>
                            <span className="text-xs text-zinc-500 shrink-0">× {item.qty} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-200">{r.text}</p>
                    )}
                  </div>
                  <Badge variant={
                    r.status === 'approved' ? 'green' :
                    r.status === 'declined' ? 'red' : 'amber'
                  }>
                    {r.status === 'approved' ? tr.approved :
                     r.status === 'declined' ? tr.declined : tr.pending}
                  </Badge>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500">{r.profiles?.full_name}</span>
                    {r.categories && (
                      <>
                        <span className="text-zinc-700">·</span>
                        <span className="text-xs text-zinc-600">{r.categories.name_it}</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-zinc-600">{formatDate(r.created_at)}</span>
                </div>

                {canApprove && r.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => updateStatus(r.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-green-950/40 border border-green-800/50 rounded-lg text-green-400 text-xs hover:bg-green-950/70 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> {tr.approve}
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, 'declined')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-950/40 border border-red-800/50 rounded-lg text-red-400 text-xs hover:bg-red-950/70 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> {tr.decline}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
