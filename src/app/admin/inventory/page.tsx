'use client'

import React, { useState, useMemo, useEffect } from 'react'
import useSWR from 'swr'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/lib/useUser'
import PageLoader from '@/components/PageLoader'
import PageSubTabs from '@/components/PageSubTabs'
import ConfirmModal from '@/components/ConfirmModal'
import {
  Plus,
  Trash2,
  Package,
  History,
  AlertCircle,
  Check,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  LayoutGrid,
  Boxes,
  TrendingUp,
  RotateCcw,
  Search,
  Settings,
  X
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface InventoryItem {
  id: number
  shortName: string
  description: string
  price: number
  quantity: number
  isActive: boolean
}

interface InventoryOperation {
  id: number
  itemId: number
  itemName: string
  operationType: 'SUPPLY' | 'WRITEOFF' | 'DELETE' | 'RESTORE' | 'PRICE_CHANGE'
  quantity: number
  oldPrice: number
  newPrice: number
  adminName: string
  createdAt: string
  note: string
}

export default function InventoryPage() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { data, mutate, isLoading, error } = useSWR('/api/admin/inventory', fetcher)

  const [shortName, setShortName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [formError, setFormError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const [restockDrafts, setRestockDrafts] = useState<Record<number, string>>({})
  const [writeoffDrafts, setWriteoffDrafts] = useState<Record<number, string>>({})
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({})

  const [restockingId, setRestockingId] = useState<number | null>(null)
  const [writeoffId, setWriteoffId] = useState<number | null>(null)
  const [savingPriceId, setSavingPriceId] = useState<number | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [activeTab, setActiveTab] = useState<'LIST' | 'HISTORY'>(
    pathname.endsWith('/history') ? 'HISTORY' : 'LIST'
  )
  const [operationTab, setOperationTab] = useState<'ALL' | 'SUPPLY' | 'WRITEOFF' | 'PRICE_CHANGE'>('ALL')
  const [operationsVisibleCount, setOperationsVisibleCount] = useState(10)
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount / 100)
  }

  const items: InventoryItem[] = Array.isArray(data?.data) ? data.data : []
  const deletedItems: InventoryItem[] = Array.isArray(data?.deletedItems) ? data.deletedItems : []
  const operations: InventoryOperation[] = Array.isArray(data?.operations) ? data.operations : []

  const totalStockValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  }, [items])

  const visibleOperations = useMemo(() => {
    if (operationTab === 'ALL') return operations
    return operations.filter(op => op.operationType === operationTab)
  }, [operations, operationTab])

  const displayedOperations = visibleOperations.slice(0, operationsVisibleCount)

  useEffect(() => {
    setActiveTab(pathname.endsWith('/history') ? 'HISTORY' : 'LIST')
  }, [pathname])

  async function createItem(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const parsedPrice = Number(price)
    const parsedQuantity = Number(quantity || 0)

    if (!shortName.trim()) {
      setFormError('Вкажіть назву товару')
      return
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Вкажіть коректну ціну')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortName: shortName.trim(),
          description: description.trim(),
          price: Math.round(parsedPrice * 100),
          quantity: Math.round(parsedQuantity)
        })
      })

      if (res.ok) {
        mutate()
        setShortName('')
        setDescription('')
        setPrice('')
        setQuantity('')
        setShowAddForm(false)
      } else {
        const err = await res.json()
        setFormError(err.error || 'Помилка при створенні')
      }
    } catch {
      setFormError('Помилка мережі')
    } finally {
      setIsCreating(false)
    }
  }

  async function supplyItem(id: number) {
    const qty = Number(restockDrafts[id])
    if (!qty || qty <= 0) return

    setRestockingId(id)
    try {
      const res = await fetch(`/api/admin/inventory/${id}/restock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty, note: 'Поповнення з панелі керування' })
      })
      if (res.ok) {
        mutate()
        setRestockDrafts(prev => ({ ...prev, [id]: '' }))
      }
    } finally {
      setRestockingId(null)
    }
  }

  async function writeoffItem(id: number) {
    const qty = Number(writeoffDrafts[id])
    if (!qty || qty <= 0) return

    setWriteoffId(id)
    try {
      const res = await fetch(`/api/admin/inventory/${id}/writeoff`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty, note: 'Списання з панелі керування' })
      })
      if (res.ok) {
        mutate()
        setWriteoffDrafts(prev => ({ ...prev, [id]: '' }))
      }
    } finally {
      setWriteoffId(null)
    }
  }

  async function updatePrice(id: number) {
    const newPrice = Number(priceDrafts[id])
    if (isNaN(newPrice) || newPrice < 0) return

    const item = items.find(i => i.id === id)
    if (!item) return

    setSavingPriceId(id)
    try {
      const res = await fetch(`/api/admin/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortName: item.shortName,
          description: item.description,
          price: Math.round(newPrice * 100)
        })
      })
      if (res.ok) {
        mutate()
        setPriceDrafts(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }
    } finally {
      setSavingPriceId(null)
    }
  }

  async function restoreItem(id: number) {
    setRestoringId(id)
    try {
      const res = await fetch(`/api/admin/inventory/${id}/restore`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      if (res.ok) mutate()
    } finally {
      setRestoringId(null)
    }
  }

  async function confirmDeleteItem() {
    if (!deleteItem) return
    setDeletingId(deleteItem.id)
    try {
      const res = await fetch(`/api/admin/inventory/${deleteItem.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      if (res.ok) {
        mutate()
        setDeleteItem(null)
      }
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading || userLoading) return <PageLoader message="Завантаження складу..." />
  if (error) return <div className="p-12 text-center text-rose-500 font-bold">Помилка завантаження даних</div>

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-600 text-xs font-bold uppercase tracking-wider mb-4">
            <Package className="w-3.5 h-3.5" /> Складський облік
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Інвентаризація та <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">товари</span>
          </h1>
          <p className="text-slate-500 max-w-2xl font-medium leading-relaxed">
            Централізоване керування вашими запасами. Швидке поповнення, списання та детальна аналітика кожної позиції.
          </p>
        </div>

        <div className="flex flex-row items-center justify-between gap-6 border-b border-slate-100 pb-6 mb-6">
          <div className="flex items-center gap-6">
            <PageSubTabs
              items={[
                { key: 'LIST', label: '📦 Товари на складі' },
                { key: 'HISTORY', label: '🕘 Історія операцій' }
              ]}
              activeKey={activeTab}
              onChange={(key) => {
                const tab = key as 'LIST' | 'HISTORY'
                const nextPath =
                  tab === 'HISTORY' ? '/admin/inventory/history' : '/admin/inventory/list'
                if (nextPath !== pathname) router.push(nextPath)
              }}
              className="w-fit bg-slate-200/60"
            />
          </div>

          {activeTab === 'LIST' && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black transition-all ${showAddForm
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95'
                }`}
            >
              {showAddForm ? <><X className="w-5 h-5" /><span>Скасувати</span></> : <><Plus className="w-5 h-5" /><span>Додати товар</span></>}
            </button>
          )}
        </div>

        {showAddForm && activeTab === 'LIST' && (
          <div className="mb-12 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-2xl animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 -mr-12 -mt-12 bg-cyan-500/5 rounded-full blur-3xl" />
            <div className="flex items-center justify-between mb-8 relative">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Plus className="w-6 h-6 text-cyan-600" />
                Новий товар
              </h2>
            </div>
            <form onSubmit={createItem} className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Назва</label>
                <input type="text" placeholder="Напр. Глина" value={shortName} onChange={e => setShortName(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-cyan-100 outline-none transition-all shadow-inner" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Опис</label>
                <input type="text" placeholder="Опис..." value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-cyan-100 outline-none transition-all shadow-inner" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ціна (zł)</label>
                <input type="text" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value.replace(/[^\d.]/g, ''))} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-cyan-100 outline-none transition-all shadow-inner" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Кількість</label>
                  <input type="text" placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value.replace(/[^\d]/g, ''))} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-cyan-100 outline-none transition-all shadow-inner" />
                </div>
                <button type="submit" disabled={isCreating} className="bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 h-[48px] self-end mb-[1px]">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Створити товар</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {formError && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-bold flex items-center gap-3 animate-in shake-in">
            <AlertCircle className="w-5 h-5" />
            {formError}
          </div>
        )}

        {activeTab === 'LIST' && (
          <div className="animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100 mb-6">
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 relative underline underline-offset-4 decoration-indigo-200">Позицій</p>
                <div className="flex items-end justify-between relative">
                  <p className="text-3xl font-black text-slate-900">{items.length}</p>
                  <LayoutGrid className="w-8 h-8 text-indigo-500 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 relative underline underline-offset-4 decoration-cyan-200">Одиниць товару</p>
                <div className="flex items-end justify-between relative">
                  <p className="text-3xl font-black text-slate-900">{items.reduce((s, i) => s + i.quantity, 0)}</p>
                  <Boxes className="w-8 h-8 text-cyan-500 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 relative underline underline-offset-4 decoration-emerald-200">Вартість складу</p>
                <div className="flex items-end justify-between relative">
                  <p className="text-3xl font-black text-emerald-600">{formatCurrency(totalStockValue)}</p>
                  <Coins className="w-8 h-8 text-emerald-500 opacity-20" />
                </div>
              </div>
            </div>




            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.length === 0 ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                  <p className="text-slate-400 font-bold mb-4">На складі порожньо</p>
                  <button onClick={() => setShowAddForm(true)} className="text-cyan-600 font-black hover:underline px-4 py-2">Додати перший товар</button>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="group relative bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 -mr-8 -mt-8 bg-cyan-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative mb-6">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-xl font-black text-slate-900 leading-tight line-clamp-2">{item.shortName}</h3>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setDeleteItem(item)}
                            className="shrink-0 inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 hover:border-rose-300"
                            title="Видалити товар"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="shrink-0 text-right">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-black">{item.quantity} шт</span>
                            {item.quantity <= 3 && <div className="mt-1 text-[8px] font-black uppercase text-rose-500 flex items-center gap-0.5 justify-end"><AlertCircle className="w-2.5 h-2.5" /> Мало</div>}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{item.description || 'Опис відсутній'}</p>
                    </div>

                    <div className="relative space-y-4">
                      <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group/price relative overflow-hidden shadow-inner">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ціна (zł)</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={priceDrafts[item.id] ?? (item.price / 100).toString()}
                            onChange={e => setPriceDrafts(p => ({ ...p, [item.id]: e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.') }))}
                            className="bg-transparent text-2xl font-black text-slate-900 w-full outline-none focus:text-cyan-600 transition-colors"
                          />
                          {(priceDrafts[item.id] !== undefined) && (
                            <button onClick={() => updatePrice(item.id)} disabled={savingPriceId === item.id} className="p-2 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-all scale-90">
                              {savingPriceId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-2 shadow-sm transition-all hover:shadow-md">
                          <input type="text" placeholder="+ Додати" value={restockDrafts[item.id] || ''} onChange={e => setRestockDrafts(p => ({ ...p, [item.id]: e.target.value.replace(/[^\d]/g, '') }))} className="bg-transparent text-emerald-700 font-black text-xs w-full outline-none placeholder:text-emerald-300" />
                          <button onClick={() => supplyItem(item.id)} disabled={restockingId === item.id || !restockDrafts[item.id]} className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 disabled:opacity-30 transition-all">
                            {restockingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUpRight className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-2 shadow-sm transition-all hover:shadow-md">
                          <input type="text" placeholder="- Списати" value={writeoffDrafts[item.id] || ''} onChange={e => setWriteoffDrafts(p => ({ ...p, [item.id]: e.target.value.replace(/[^\d]/g, '') }))} className="bg-transparent text-amber-700 font-black text-xs w-full outline-none placeholder:text-amber-300" />
                          <button onClick={() => writeoffItem(item.id)} disabled={writeoffId === item.id || !writeoffDrafts[item.id]} className="p-1.5 bg-amber-600 text-white rounded-lg shadow-sm hover:bg-amber-700 disabled:opacity-30 transition-all">
                            {writeoffId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowDownRight className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-700">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Журнал операцій</h3>
                <p className="text-slate-500 text-sm mt-1">Повна історія руху товарів та змін цін.</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
                {(['ALL', 'SUPPLY', 'WRITEOFF', 'PRICE_CHANGE'] as const).map(t => (
                  <button key={t} onClick={() => setOperationTab(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${operationTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {t === 'ALL' ? 'Всі' : t === 'SUPPLY' ? 'Надходження' : t === 'WRITEOFF' ? 'Списання' : 'Ціна'}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {displayedOperations.length === 0 ? (
                <div className="p-20 text-center text-slate-400 font-bold">Операцій не знайдено</div>
              ) : (
                displayedOperations.map(op => (
                  <div key={op.id} className="p-6 hover:bg-slate-50/30 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${op.operationType === 'SUPPLY' ? 'bg-emerald-50 text-emerald-600' : op.operationType === 'WRITEOFF' ? 'bg-amber-50 text-amber-600' : op.operationType === 'PRICE_CHANGE' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
                        {op.operationType === 'SUPPLY' ? <ArrowUpRight className="w-5 h-5" /> : op.operationType === 'WRITEOFF' ? <ArrowDownRight className="w-5 h-5" /> : <History className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{op.itemName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {new Date(op.createdAt).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} • {op.adminName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-xl text-xs font-black ${op.operationType === 'SUPPLY' ? 'bg-emerald-100 text-emerald-700' : op.operationType === 'WRITEOFF' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                        {op.operationType === 'SUPPLY' ? `+${op.quantity}` : op.operationType === 'WRITEOFF' ? `-${op.quantity}` : `${op.newPrice / 100} zł`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {visibleOperations.length > operationsVisibleCount && (
              <div className="p-6 text-center bg-slate-50/50 border-t border-slate-100">
                <button onClick={() => setOperationsVisibleCount(p => p + 10)} className="text-xs font-black text-cyan-600 hover:underline uppercase tracking-widest">Завантажити більше</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'LIST' && deletedItems.length > 0 && (
          <div className="mt-20">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-2 flex items-center gap-4">
              Архів товарів
              <div className="h-px flex-1 bg-slate-200" />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
              {deletedItems.map(item => (
                <div key={item.id} className="p-6 bg-white rounded-[2rem] border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{item.shortName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">ID: #{item.id}</p>
                  </div>
                  <button onClick={() => restoreItem(item.id)} disabled={restoringId === item.id} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                    {restoringId === item.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteItem}
        title="Видалити товар?"
        description={`Товар "${deleteItem?.shortName}" буде перенесено в архів.`}
        confirmText="Видалити"
        cancelText="Скасувати"
        tone="danger"
        isLoading={deletingId === deleteItem?.id}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDeleteItem}
      />
    </main>
  )
}
