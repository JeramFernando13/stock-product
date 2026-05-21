'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/lib/context/app-context'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Check, X, Pencil, Loader2 } from 'lucide-react'
import type { Profile, Category, AccessLevel } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

type Tab = 'users' | 'categories'
type ProfileWithCats = Profile & {
  profile_categories: { category_id: string; access_level: AccessLevel }[]
}

export default function AdminPage() {
  const { user, tr } = useApp()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<ProfileWithCats[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [showCatForm, setShowCatForm] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [catForm, setCatForm] = useState({ it: '', en: '', si: '' })

  const fetchAll = async () => {
    const [{ data: u }, { data: c }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*, profile_categories(category_id, access_level)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name_it'),
    ])
    setUsers(u ?? [])
    setCategories(c ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!loading && user?.role !== 'superAdmin') router.push('/dashboard')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user])

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchAll() }, [])

  const updateUserStatus = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('profiles').update({ status }).eq('id', id)
    fetchAll()
  }

  const updateUserRole = async (id: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', id)
    fetchAll()
  }

  const toggleUserCategory = async (
    profileId: string,
    categoryId: string,
    currentCats: { category_id: string; access_level: AccessLevel }[]
  ) => {
    const existing = currentCats.find(pc => pc.category_id === categoryId)
    if (existing) {
      await supabase
        .from('profile_categories')
        .delete()
        .eq('profile_id', profileId)
        .eq('category_id', categoryId)
    } else {
      await supabase
        .from('profile_categories')
        .insert({ profile_id: profileId, category_id: categoryId, access_level: 'readonly' })
    }
    fetchAll()
  }

  const updateAccessLevel = async (
    profileId: string,
    categoryId: string,
    access_level: AccessLevel
  ) => {
    await supabase
      .from('profile_categories')
      .update({ access_level })
      .eq('profile_id', profileId)
      .eq('category_id', categoryId)
    fetchAll()
  }

  const saveCategory = async () => {
    if (!catForm.it) return
    if (editCat) {
      await supabase.from('categories').update({
        name_it: catForm.it,
        name_en: catForm.en || catForm.it,
        name_si: catForm.si || catForm.it,
      }).eq('id', editCat.id)
    } else {
      await supabase.from('categories').insert({
        name_it: catForm.it,
        name_en: catForm.en || catForm.it,
        name_si: catForm.si || catForm.it,
        icon: 'package',
      })
    }
    setCatForm({ it: '', en: '', si: '' })
    setShowCatForm(false)
    setEditCat(null)
    fetchAll()
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Eliminare questa categoria?')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchAll()
  }

  const startEditCat = (cat: Category) => {
    setEditCat(cat)
    setCatForm({ it: cat.name_it, en: cat.name_en, si: cat.name_si })
    setShowCatForm(true)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'users', label: 'Utenti' },
    { key: 'categories', label: 'Categorie' },
  ]

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
        <h1 className="text-white text-xl font-semibold">{tr.admin}</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Gestione sistema</p>
      </div>

      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs uppercase tracking-wider rounded-lg transition-colors ${
              tab === t.key ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* USERS */}
      {tab === 'users' && (
        <div className="space-y-3">
          {users.length === 0 && (
            <p className="text-center text-zinc-600 text-sm py-8">{tr.noData}</p>
          )}
          {users.map(u => {
            const userCats = u.profile_categories ?? []
            return (
              <Card key={u.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white text-sm font-medium">{u.full_name}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">@{u.username}</p>
                  </div>
                  <Badge variant={
                    u.status === 'approved' ? 'green' :
                    u.status === 'rejected' ? 'red' : 'amber'
                  }>
                    {u.status}
                  </Badge>
                </div>

                {/* Ruolo */}
                <div className="mb-3">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Ruolo</p>
                  <select
                    value={u.role}
                    onChange={e => updateUserRole(u.id, e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-blue-600"
                  >
                    <option value="readonly">Readonly</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superAdmin">Super Admin</option>
                  </select>
                </div>

                {/* Categorie multi-select con access level */}
                <div className="mb-3">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Categorie</p>
                  <div className="space-y-2">
                    {categories.map(cat => {
                      const existing = userCats.find(pc => pc.category_id === cat.id)
                      const active = !!existing
                      return (
                        <div key={cat.id} className="flex items-center gap-2">
                          <button
                            onClick={() => toggleUserCategory(u.id, cat.id, userCats)}
                            className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-colors border text-left ${
                              active
                                ? 'bg-blue-600/20 border-blue-600/50 text-blue-400'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {cat.name_it}
                          </button>
                          {active && (
                            <select
                              value={existing.access_level}
                              onChange={e => updateAccessLevel(u.id, cat.id, e.target.value as AccessLevel)}
                              className="px-2 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-blue-600"
                            >
                              <option value="readonly">Read only</option>
                              <option value="edit">Edit</option>
                            </select>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {u.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateUserStatus(u.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-green-950/40 border border-green-800/50 rounded-lg text-green-400 text-xs hover:bg-green-950/70 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Approva
                    </button>
                    <button
                      onClick={() => updateUserStatus(u.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-950/40 border border-red-800/50 rounded-lg text-red-400 text-xs hover:bg-red-950/70 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Rifiuta
                    </button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* CATEGORIES */}
      {tab === 'categories' && (
        <div className="space-y-3">
          <button
            onClick={() => { setShowCatForm(true); setEditCat(null); setCatForm({ it: '', en: '', si: '' }) }}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuova categoria
          </button>

          {showCatForm && (
            <Card className="p-4 space-y-3">
              <p className="text-white text-sm font-medium">
                {editCat ? 'Modifica categoria' : 'Nuova categoria'}
              </p>
              {[
                { key: 'it', label: 'Italiano' },
                { key: 'en', label: 'English' },
                { key: 'si', label: 'සිංහල' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">{label}</label>
                  <input
                    type="text"
                    value={catForm[key as keyof typeof catForm]}
                    onChange={e => setCatForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`Nome in ${label}`}
                    className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-600"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={saveCategory} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
                  {tr.save}
                </button>
                <button onClick={() => { setShowCatForm(false); setEditCat(null) }} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors">
                  {tr.cancel}
                </button>
              </div>
            </Card>
          )}

          {categories.map(cat => (
            <Card key={cat.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{cat.name_it}</p>
                <p className="text-zinc-600 text-xs mt-0.5">{cat.name_en} · {cat.name_si}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEditCat(cat)} className="p-1.5 text-zinc-500 hover:text-blue-400 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
          {categories.length === 0 && (
            <p className="text-center text-zinc-600 text-sm py-8">{tr.noData}</p>
          )}
        </div>
      )}
    </div>
  )
}