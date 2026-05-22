'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/lib/context/app-context'
import { Plus, Check, X, Loader2, Copy, CheckCheck } from 'lucide-react'
import type { Request, Category } from '@/lib/types'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

type RequestWithRelations = Request & {
  profiles: { full_name: string }
  categories: Category | null
}

export default function RequestsPage() {
  const { user, tr } = useApp()
  const supabase = useMemo(() => createClient(), [])

  const [requests, setRequests] = useState<RequestWithRelations[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newText, setNewText] = useState('')
  const [newCatId, setNewCatId] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchData = async () => {
    const [{ data: reqs }, { data: cats }] = await Promise.all([
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

    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchData() }, [])

  const submitRequest = async () => {
    if (!newText.trim()) return
    setSaving(true)
    await supabase.from('requests').insert({
      user_id: user?.id,
      category_id: newCatId || null,
      text: newText.trim(),
      status: 'pending',
      organization_id: user?.organization_id,
    })
    setNewText('')
    setNewCatId('')
    setShowForm(false)
    setSaving(false)
    fetchData()
  }

  const updateStatus = async (id: string, status: 'approved' | 'declined') => {
    await supabase
      .from('requests')
      .update({ status, approved_by: user?.id })
      .eq('id', id)
    fetchData()
  }

  const canApprove = user?.role === 'superAdmin' || user?.role === 'admin'

  // Lista spesa — solo richieste pending/approved
  const shoppingList = requests.filter(r => r.status !== 'declined')

  const copyShoppingList = () => {
    const text = shoppingList
      .map(r => `• ${r.text}${r.categories ? ` (${r.categories.name_it})` : ''}`)
      .join('\n')
    navigator.clipboard.writeText(text)
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

      {/* Form nuova richiesta */}
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 text-sm transition-colors"
      >
        <Plus className="w-4 h-4" /> {tr.newRequest}
      </button>

      {showForm && (
        <Card className="p-4 space-y-3">
          <p className="text-white text-sm font-medium">{tr.newRequest}</p>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 block">
              Categoria
            </label>
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
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 block">
              Richiesta
            </label>
            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Es. 3 bottiglie olio EVO, 2 pacchi sale..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-600 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={submitRequest}
              disabled={saving || !newText.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {tr.save}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewText(''); setNewCatId('') }}
              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
            >
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
          {requests.map(r => (
            <div key={r.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm text-zinc-200 flex-1">{r.text}</p>
                <Badge variant={
                  r.status === 'approved' ? 'green' :
                  r.status === 'declined' ? 'red' : 'amber'
                }>
                  {r.status === 'approved' ? tr.approved :
                   r.status === 'declined' ? tr.declined : tr.pending}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
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
          ))}
        </Card>
      )}
    </div>
  )
}