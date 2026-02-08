'use client'

import { mutate } from 'swr'

type Tx = {
  id: number
  amount: number
  paymentMethod: 'CASH' | 'CARD'
  user: {
    id: number
    name: string
  }
}

type Props = {
  transactions?: Tx[]
  isLoading?: boolean
}

export default function AdminTable({ transactions = [], isLoading = false }: Props) {
  if (isLoading) return <p>Завантаження…</p>

  if (!isLoading && transactions.length === 0) {
    return <p>Список порожній</p>
  }

  async function remove(id: number) {
    await fetch(`/api/admin/transactions/${id}`, {
      method: 'DELETE'
    })

    mutate('/api/admin/transactions/today')
    mutate('/api/admin/day')
  }

  return (
    <>
      <div className="md:hidden space-y-3">
        {transactions.map((t) => (
          <div key={t.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Працівник</p>
                <p className="font-medium text-slate-900 break-words">{t.user?.name ?? '—'}</p>
              </div>
              <span
                className={`shrink-0 px-2 py-1 rounded-full text-xs font-semibold ${
                  t.paymentMethod === 'CASH'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {t.paymentMethod === 'CASH' ? '💵 Готівка' : '💳 Карта'}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900 text-base break-all">{t.amount} грн</p>
              <button
                onClick={() => remove(t.id)}
                className="px-3 py-1.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg transition-all text-sm font-semibold"
                title="Видалити транзакцію"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="px-4 py-3 text-left font-semibold text-slate-900">Працівник</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">Метод</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-900">Сума</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-900">Дія</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, idx) => (
              <tr
                key={t.id}
                className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
              >
                <td className="px-4 py-3 text-slate-900 font-medium">{t.user?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    t.paymentMethod === 'CASH'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {t.paymentMethod === 'CASH' ? '💵 Готівка' : '💳 Карта'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">{t.amount} грн</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => remove(t.id)}
                    className="px-3 py-1.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg transition-all text-sm font-semibold shadow-sm hover:shadow-md hover:scale-105 flex items-center gap-1 mx-auto"
                    title="Видалити транзакцію"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
