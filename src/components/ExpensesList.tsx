'use client'

import { mutate } from 'swr'
import { formatCurrency } from '@/lib/currency'

type Expense = {
	id: number
	amount: number
	comment?: string
}

type Props = {
	expenses?: Expense[]
	isLoading?: boolean
}

export default function ExpensesList({ expenses = [], isLoading = false }: Props) {
	if (isLoading) return <p>Завантаження…</p>

	if (expenses.length === 0) {
		return (
			<div className="text-center py-8 text-slate-500">
				<p className="text-lg">Витрат ще немає 📋</p>
			</div>
		)
	}

	async function remove(id: number) {
		await fetch(`/api/admin/expenses/${id}`, {
			method: 'DELETE'
		})

		mutate('/api/admin/expenses')
		mutate('/api/admin/day')
	}

	return (
		<div className="space-y-2">
			{expenses.map((e) => (
				<div
					key={e.id}
					className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
				>
					<div className="flex-1">
						<p className="font-semibold text-slate-900">
							-{formatCurrency(e.amount)}
						</p>
						{e.comment && (
							<p className="text-sm text-slate-600 mt-1">{e.comment}</p>
						)}
					</div>
					<button
						onClick={() => remove(e.id)}
						className="ml-4 px-3 py-1.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white text-sm rounded-lg transition-all font-semibold shadow-sm hover:shadow-md hover:scale-105"
						title="Видалити витрату"
					>
						🗑️
					</button>
				</div>
			))}
		</div>
	)
}
