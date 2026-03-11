'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/currency'
import {
	Coins,
	Building2,
	Zap,
	FileText,
	Trash2,
	ListChecks,
	Receipt
} from 'lucide-react'
import ConfirmModal from './ConfirmModal'
import { normalizeExpenseComment } from '@/lib/expenseComment'

type Expense = {
	id: number
	amount: number
	category?: 'SALARY' | 'RENT' | 'UTILITIES' | 'OTHER'
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

	if (isLoading) return (
		<div className="flex items-center justify-center py-12 text-slate-400 animate-pulse">
			<p className="font-bold uppercase tracking-widest text-sm">Завантаження витрат…</p>
		</div>
	)

	if (expenses.length === 0) {
		return (
			<div className="text-center py-12 group">
				<div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300 group-hover:scale-110 transition-transform">
					<ListChecks size={32} />
				</div>
				<p className="text-slate-500 font-bold">Витрат ще немає</p>
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
		<div className="space-y-4">
			{expenses.map((e) => {
				const categoryIcon = e.category === 'SALARY' ? <Coins size={14} /> :
					e.category === 'RENT' ? <Building2 size={14} /> :
						e.category === 'UTILITIES' ? <Zap size={14} /> : <FileText size={14} />

				const categoryLabel = e.category === 'SALARY' ? 'Зарплата' :
					e.category === 'RENT' ? 'Оренда' :
						e.category === 'UTILITIES' ? 'Комунальні' : 'Інше'

				return (
					<div
						key={e.id}
						className="group flex items-center justify-between p-5 bg-white border border-slate-200/60 rounded-[2rem] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-300/50 transition-all duration-300"
					>
						<div className="flex items-center gap-5">
							<div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
								<Receipt size={22} />
							</div>
							<div className="flex-1">
								<p className="text-lg font-black text-slate-900 tracking-tight">
									-{formatCurrency(e.amount)}
								</p>
								<div className="flex items-center gap-3 mt-1">
									<div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">
										{categoryIcon} {categoryLabel}
									</div>
									{e.comment && (
										<p className="text-sm font-bold text-slate-500 italic line-clamp-1">
											{normalizeExpenseComment(e.comment)}
										</p>
									)}
								</div>
							</div>
						</div>
						<button
							onClick={() => setExpenseToDelete(e)}
							className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100 group-hover:opacity-100 md:opacity-0"
							title="Видалити витрату"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)
			})}

			<ConfirmModal
				isOpen={Boolean(expenseToDelete)}
				title="Видалити витрату?"
				description={
					expenseToDelete
						? `Ви впевнені, що хочете видалити витрату на суму ${formatCurrency(expenseToDelete.amount)}?`
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
