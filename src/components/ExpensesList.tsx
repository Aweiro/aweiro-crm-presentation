'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/currency'
import ConfirmModal from './ConfirmModal'
import { parseExpenseComment } from '@/lib/expenseMeta'

type Expense = {
	id: number
	amount: number
	comment?: string
}

type Props = {
	expenses?: Expense[]
	isLoading?: boolean
}

export default function ExpensesList({
	expenses = [],
	isLoading = false
}: Props) {
	const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)

	if (isLoading) return <p>Завантаження…</p>

	if (expenses.length === 0) {
		return (
			<div className="text-center py-8 text-slate-500">
				<p className="text-lg">Витрат ще немає 📋</p>
			</div>
		)
	}

	async function remove(id: number) {
		if (isDeleting) return
		setIsDeleting(true)
		try {
			await fetch(`/api/admin/expenses/${id}`, {
				method: 'DELETE'
			})

			mutate('/api/admin/expenses')
			mutate('/api/admin/day')
			setExpenseToDelete(null)
		} finally {
			setIsDeleting(false)
		}
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
							{(() => {
								const meta = parseExpenseComment(e.comment)
								const categoryLabel =
									meta.category === 'SALARY' ? '💸 Зарплата' : '🧾 Інше'
							return (
								<>
									<p className="text-xs text-slate-500 mt-1">{categoryLabel}</p>
									{meta.cleanComment ? (
										<p className="text-sm text-slate-600 mt-1">{meta.cleanComment}</p>
									) : null}
								</>
							)
						})()}
					</div>
					<button
						onClick={() => setExpenseToDelete(e)}
						className="ml-4 px-3 py-1.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white text-sm rounded-lg transition-all font-semibold shadow-sm hover:shadow-md hover:scale-105"
						title="Видалити витрату"
					>
						🗑️
					</button>
				</div>
			))}

			<ConfirmModal
				isOpen={Boolean(expenseToDelete)}
				title="Підтвердьте видалення витрати"
				description={
					expenseToDelete
						? `Витрата на ${formatCurrency(expenseToDelete.amount)} буде видалена.`
						: ''
				}
				confirmText="Видалити"
				cancelText="Скасувати"
				tone="danger"
				isLoading={isDeleting}
				onClose={() => setExpenseToDelete(null)}
				onConfirm={() => (expenseToDelete ? remove(expenseToDelete.id) : undefined)}
			/>
		</div>
	)
}
