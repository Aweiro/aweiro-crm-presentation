'use client'

import { useMemo, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { formatCurrency } from '@/lib/currency'
import { useUser } from '@/lib/useUser'
import ConfirmModal from '@/components/ConfirmModal'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type InventoryItem = {
  id: number
  shortName: string
  description: string | null
  price: number
  quantity: number
  isActive?: boolean
  createdAt: string
  updatedAt: string
}

type InventoryOperation = {
  id: number
  itemId: number
  itemName: string
  operationType: 'SUPPLY' | 'WRITEOFF' | 'DELETE' | 'RESTORE' | 'PRICE_CHANGE'
  quantity: number
  note: string | null
  createdAt: string
}

export default function InventoryPage() {
  const { user, loading: userLoading } = useUser()
  const { data, isLoading, error } = useSWR('/api/admin/inventory', fetcher)

  const [shortName, setShortName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [formError, setFormError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [restockDrafts, setRestockDrafts] = useState<Record<number, string>>({})
  const [writeoffDrafts, setWriteoffDrafts] = useState<Record<number, string>>({})
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({})
  const [restockingId, setRestockingId] = useState<number | null>(null)
  const [writeoffId, setWriteoffId] = useState<number | null>(null)
  const [savingPriceId, setSavingPriceId] = useState<number | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [operationTab, setOperationTab] = useState<
    'ALL' | 'SUPPLY' | 'WRITEOFF' | 'DELETE' | 'RESTORE' | 'PRICE_CHANGE'
  >('ALL')
  const [operationsVisibleCount, setOperationsVisibleCount] = useState(5)
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const items: InventoryItem[] = Array.isArray(data?.data) ? data.data : []
  const deletedItems: InventoryItem[] = Array.isArray(data?.deletedItems)
    ? data.deletedItems
    : []
  const operations: InventoryOperation[] = Array.isArray(data?.operations)
    ? data.operations
    : []
  const visibleOperations =
    operationTab === 'ALL'
      ? operations
      : operations.filter((operation) => operation.operationType === operationTab)
  const displayedOperations = visibleOperations.slice(0, operationsVisibleCount)

  const totalStockValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  }, [items])

  async function createItem(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const parsedPrice = Number(price)
    const parsedQuantity = Number(quantity || 0)

    if (!shortName.trim()) {
      setFormError('Вкажіть коротку назву товару')
      return
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFormError('Вкажіть коректну ціну')
      return
    }
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      setFormError('Вкажіть коректну кількість')
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
          price: Math.round(parsedPrice),
          quantity: Math.round(parsedQuantity)
        })
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setFormError(json?.message || 'Не вдалося створити товар')
        return
      }

      setShortName('')
      setDescription('')
      setPrice('')
      setQuantity('')
      mutate('/api/admin/inventory')
    } finally {
      setIsCreating(false)
    }
  }

  async function restock(itemId: number) {
    if (restockingId === itemId) return
    const raw = restockDrafts[itemId] || ''
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed <= 0) return

    setRestockingId(itemId)
    try {
      const res = await fetch(`/api/admin/inventory/${itemId}/restock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Math.round(parsed) })
      })

      if (!res.ok) return

      setRestockDrafts((prev) => ({ ...prev, [itemId]: '' }))
      mutate('/api/admin/inventory')
    } finally {
      setRestockingId(null)
    }
  }

  async function writeoff(itemId: number) {
    if (writeoffId === itemId) return
    const raw = writeoffDrafts[itemId] || ''
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed <= 0) return

    setWriteoffId(itemId)
    try {
      const res = await fetch(`/api/admin/inventory/${itemId}/writeoff`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Math.round(parsed) })
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setFormError(json?.message || 'Не вдалося списати товар')
        return
      }

      setWriteoffDrafts((prev) => ({ ...prev, [itemId]: '' }))
      mutate('/api/admin/inventory')
    } finally {
      setWriteoffId(null)
    }
  }

  async function savePrice(item: InventoryItem) {
    if (savingPriceId === item.id) return

    const raw = priceDrafts[item.id]
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setFormError('Вкажіть коректну ціну')
      return
    }

    setSavingPriceId(item.id)
    setFormError('')
    try {
      const res = await fetch(`/api/admin/inventory/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortName: item.shortName,
          description: item.description || '',
          price: Math.round(parsed)
        })
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setFormError(json?.message || 'Не вдалося оновити ціну')
        return
      }
      mutate('/api/admin/inventory')
    } finally {
      setSavingPriceId(null)
    }
  }

  async function confirmDeleteItem() {
    if (!deleteItem || deletingId === deleteItem.id) return
    setDeletingId(deleteItem.id)
    try {
      const res = await fetch(`/api/admin/inventory/${deleteItem.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setFormError(json?.message || 'Не вдалося видалити товар')
        return
      }
      setDeleteItem(null)
      mutate('/api/admin/inventory')
    } finally {
      setDeletingId(null)
    }
  }

  async function restoreItem(itemId: number) {
    if (restoringId === itemId) return
    setRestoringId(itemId)
    try {
      const res = await fetch(`/api/admin/inventory/${itemId}/restore`, {
        method: 'PATCH'
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setFormError(json?.message || 'Не вдалося відновити товар')
        return
      }
      mutate('/api/admin/inventory')
    } finally {
      setRestoringId(null)
    }
  }

  function switchOperationTab(
    tab: 'ALL' | 'SUPPLY' | 'WRITEOFF' | 'DELETE' | 'RESTORE' | 'PRICE_CHANGE'
  ) {
    setOperationTab(tab)
    setOperationsVisibleCount(5)
  }

  if (userLoading || isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 p-0">
        <div className="w-full">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-slate-600 text-lg">Завантаження складу…</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 p-0">
        <div className="w-full py-20">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            Доступ тільки для адміністратора.
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 p-0">
        <div className="w-full py-20">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            Не вдалося завантажити склад.
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 p-0">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">📦 Склад товарів</h1>
          <p className="mt-2 text-slate-600">
            Керування косметикою та іншими товарами. Додавайте позиції та поповнюйте кількість.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Позицій</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{items.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Одиниць товару</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {items.reduce((s, item) => s + item.quantity, 0)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Сума складу</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{formatCurrency(totalStockValue)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">➕ Додати товар</h2>
          {formError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}
          <form onSubmit={createItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Коротка назва"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
            <input
              type="text"
              placeholder="Опис"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
            <input
              type="number"
              placeholder="Ціна"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
            <input
              type="number"
              placeholder="Початкова кількість"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="sm:col-span-4 rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white hover:bg-cyan-700 disabled:bg-slate-300"
            >
              {isCreating ? 'Додавання…' : 'Додати товар'}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Список товарів</h2>

          {items.length === 0 ? (
            <p className="text-slate-500">Поки що немає жодного товару.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                  <div className="flex flex-col gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-lg font-bold text-slate-900">{item.shortName}</p>
                        <div className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
                          {item.quantity} шт
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 break-words">
                        {item.description || 'Без опису'}
                      </p>
                      <div className="mt-2 inline-flex rounded-lg bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-800">
                        {formatCurrency(item.price)}
                      </div>
                      <div className="mt-2 flex items-center gap-2 max-w-sm">
                        <input
                          type="number"
                          placeholder="Нова ціна"
                          value={priceDrafts[item.id] ?? String(item.price)}
                          onChange={(e) =>
                            setPriceDrafts((prev) => ({
                              ...prev,
                              [item.id]: e.target.value
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => savePrice(item)}
                          disabled={savingPriceId === item.id}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
                        >
                          {savingPriceId === item.id ? '...' : 'Зберегти'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-xs font-semibold uppercase text-emerald-700">Поставка</p>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="+ к-сть"
                            value={restockDrafts[item.id] || ''}
                            onChange={(e) =>
                              setRestockDrafts((prev) => ({
                                ...prev,
                                [item.id]: e.target.value
                              }))
                            }
                            className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2"
                          />
                          <button
                            type="button"
                            onClick={() => restock(item.id)}
                            disabled={restockingId === item.id}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
                          >
                            {restockingId === item.id ? '...' : 'Додати'}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-semibold uppercase text-amber-700">Списання</p>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="- к-сть"
                            value={writeoffDrafts[item.id] || ''}
                            onChange={(e) =>
                              setWriteoffDrafts((prev) => ({
                                ...prev,
                                [item.id]: e.target.value
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                          />
                          <button
                            type="button"
                            onClick={() => writeoff(item.id)}
                            disabled={writeoffId === item.id}
                            className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-slate-300"
                          >
                            {writeoffId === item.id ? '...' : 'Списати'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDeleteItem(item)}
                        className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        🗑️ Видалити
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 mb-4">♻️ Видалені товари</h2>
          {deletedItems.length === 0 ? (
            <p className="text-slate-500">Видалених товарів немає.</p>
          ) : (
            <div className="space-y-2">
              {deletedItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.shortName}</p>
                    <p className="text-sm text-slate-600">{item.description || 'Без опису'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restoreItem(item.id)}
                    disabled={restoringId === item.id}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
                  >
                    {restoringId === item.id ? '...' : 'Відновити'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 mb-4">🕘 Історія операцій</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => switchOperationTab('ALL')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${operationTab === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Усі
            </button>
            <button
              type="button"
              onClick={() => switchOperationTab('SUPPLY')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${operationTab === 'SUPPLY' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700'}`}
            >
              Поставка
            </button>
            <button
              type="button"
              onClick={() => switchOperationTab('WRITEOFF')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${operationTab === 'WRITEOFF' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-700'}`}
            >
              Списання
            </button>
            <button
              type="button"
              onClick={() => switchOperationTab('DELETE')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${operationTab === 'DELETE' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}
            >
              Видалення
            </button>
            <button
              type="button"
              onClick={() => switchOperationTab('RESTORE')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${operationTab === 'RESTORE' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}
            >
              Відновлення
            </button>
            <button
              type="button"
              onClick={() => switchOperationTab('PRICE_CHANGE')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${operationTab === 'PRICE_CHANGE' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-700'}`}
            >
              Ціна
            </button>
          </div>
          {visibleOperations.length === 0 ? (
            <p className="text-slate-500">Операцій ще немає.</p>
          ) : (
            <div className="space-y-2">
              {displayedOperations.map((operation) => {
                const label =
                  operation.operationType === 'SUPPLY'
                    ? '📥 Поставка'
                    : operation.operationType === 'WRITEOFF'
                      ? '📤 Списання'
                    : operation.operationType === 'DELETE'
                        ? '🗑️ Видалення'
                        : operation.operationType === 'RESTORE'
                          ? '♻️ Відновлення'
                          : '💱 Зміна ціни'
                const tone =
                  operation.operationType === 'SUPPLY'
                    ? 'text-emerald-700 bg-emerald-100'
                    : operation.operationType === 'WRITEOFF'
                      ? 'text-amber-700 bg-amber-100'
                    : operation.operationType === 'DELETE'
                        ? 'text-slate-700 bg-slate-200'
                        : operation.operationType === 'RESTORE'
                          ? 'text-blue-700 bg-blue-100'
                          : 'text-indigo-700 bg-indigo-100'

                return (
                  <div
                    key={operation.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{operation.itemName}</p>
                        <p className="text-sm text-slate-600">
                          {operation.note || 'Без примітки'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded px-2 py-1 text-xs font-bold ${tone}`}>
                          {label}
                        </span>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {operation.operationType === 'SUPPLY'
                            ? '+'
                            : operation.operationType === 'RESTORE'
                              ? ''
                              : operation.operationType === 'PRICE_CHANGE'
                              ? ''
                              : '-'}
                          {operation.quantity}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(operation.createdAt).toLocaleDateString('uk-UA', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              {visibleOperations.length > operationsVisibleCount && (
                <button
                  type="button"
                  onClick={() =>
                    setOperationsVisibleCount((prev) =>
                      Math.min(prev + 5, visibleOperations.length)
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Показати ще
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteItem)}
        title="Видалити товар зі складу?"
        description={
          deleteItem
            ? `Позиція "${deleteItem.shortName}" буде деактивована і зникне зі списку активних товарів.`
            : ''
        }
        confirmText="Видалити"
        cancelText="Скасувати"
        tone="danger"
        isLoading={deleteItem ? deletingId === deleteItem.id : false}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDeleteItem}
      />
    </main>
  )
}
