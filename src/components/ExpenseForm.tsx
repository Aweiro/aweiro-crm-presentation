'use client'

import { useState } from 'react'
import { mutate } from 'swr'

type Props = {
  onAdded?: () => void
}

export default function ExpenseForm({ onAdded }: Props) {
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!amount) return

    setLoading(true)

    await fetch('/api/admin/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        comment
      })
    })

    setAmount('')
    setComment('')
    setLoading(false)

    mutate('/api/admin/expenses')
    mutate('/api/admin/day')
    onAdded?.()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Сума (грн)
        </label>
        <input
          type="number"
          placeholder="Введіть суму"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Коментар (опціонально)
        </label>
        <input
          type="text"
          placeholder="Причина витрати"
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button 
        onClick={submit} 
        disabled={loading || !amount}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
      >
        {loading ? 'Додавання...' : '➕ Додати витрату'}
      </button>
    </div>
  )
}