'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { CircleDollarSign, MessageSquare, PlusCircle, Loader2 } from 'lucide-react'

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
		<div className="space-y-6">
			<div>
				<label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-slate-400 mb-3">
					<CircleDollarSign size={14} className="text-blue-500" />
					Сума (zł)
				</label>
				<input
					type="number"
					placeholder="0.00"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-black text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
				/>
			</div>

			<div>
				<label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-slate-400 mb-3">
					<MessageSquare size={14} className="text-indigo-500" />
					Коментар
				</label>
				<input
					type="text"
					placeholder="На що витрачено?"
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
				/>
			</div>

			<button
				onClick={submit}
				disabled={loading || !amount}
				className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-200 disabled:to-slate-200 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95"
			>
				{loading ? <Loader2 className="animate-spin" /> : <PlusCircle size={20} />}
				{loading ? 'Додавання...' : 'Додати витрату'}
			</button>
		</div>
	)
}
