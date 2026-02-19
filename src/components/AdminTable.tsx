'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/currency'
import ConfirmModal from './ConfirmModal'

type Tx = {
	id: number
	amount: number
	paymentMethod: 'CASH' | 'CARD'
	serviceType?: 'BARBER' | 'COSMETICS'
	createdAt: string | Date
	user: {
		id: number
		name: string
	}
}

type Props = {
	transactions?: Tx[]
	isLoading?: boolean
}

export default function AdminTable({
	transactions = [],
	isLoading = false
}: Props) {
	const [transactionToDelete, setTransactionToDelete] = useState<Tx | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)

	if (isLoading) return <p>Завантаження…</p>

	if (!isLoading && transactions.length === 0) {
		return <p>Список порожній</p>
	}

	async function remove(id: number) {
		if (isDeleting) return
		setIsDeleting(true)
		try {
			await fetch(`/api/admin/transactions/${id}`, {
				method: 'DELETE'
			})

			mutate('/api/admin/transactions/today')
			mutate('/api/admin/day')
			setTransactionToDelete(null)
		} finally {
			setIsDeleting(false)
		}
	}

	const formatTime = (value: string | Date) =>
		new Date(value).toLocaleTimeString('uk-UA', {
			hour: '2-digit',
			minute: '2-digit'
		})
	const formatService = (serviceType?: 'BARBER' | 'COSMETICS') =>
		serviceType === 'COSMETICS' ? '🧴 Косметика' : '✂️ Барбер'

	return (
		<>
			<div className="md:hidden space-y-3">
				{transactions.map((t) => (
					<div
						key={t.id}
						className="rounded-lg border border-slate-200 bg-slate-50 p-3"
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="text-xs text-slate-500">Працівник</p>
								<p className="font-medium text-slate-900 break-words">
									{t.user?.name ?? '—'}
								</p>
								<p className="mt-1 text-xs text-slate-500">
									🕒 {formatTime(t.createdAt)}
								</p>
								<p className="mt-1 text-xs text-slate-600">
									{formatService(t.serviceType)}
								</p>
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
							<p className="font-semibold text-slate-900 text-base break-all">
								{formatCurrency(t.amount)}
							</p>
							<button
								onClick={() => setTransactionToDelete(t)}
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
							<th className="px-4 py-3 text-left font-semibold text-slate-900">
								Працівник
							</th>
							<th className="px-4 py-3 text-left font-semibold text-slate-900">
								Час
							</th>
							<th className="px-4 py-3 text-left font-semibold text-slate-900">
								Метод
							</th>
							<th className="px-4 py-3 text-left font-semibold text-slate-900">
								Послуга
							</th>
							<th className="px-4 py-3 text-right font-semibold text-slate-900">
								Сума
							</th>
							<th className="px-4 py-3 text-center font-semibold text-slate-900">
								Дія
							</th>
						</tr>
					</thead>
					<tbody>
						{transactions.map((t, idx) => (
							<tr
								key={t.id}
								className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
							>
								<td className="px-4 py-3 text-slate-900 font-medium">
									{t.user?.name ?? '—'}
								</td>
								<td className="px-4 py-3 text-slate-700 font-medium">
									{formatTime(t.createdAt)}
								</td>
								<td className="px-4 py-3">
									<span
										className={`px-3 py-1 rounded-full text-sm font-semibold ${
											t.paymentMethod === 'CASH'
												? 'bg-green-100 text-green-800'
												: 'bg-blue-100 text-blue-800'
										}`}
									>
										{t.paymentMethod === 'CASH' ? '💵 Готівка' : '💳 Карта'}
									</span>
								</td>
								<td className="px-4 py-3 text-slate-700">
									{formatService(t.serviceType)}
								</td>
								<td className="px-4 py-3 text-right font-semibold text-slate-900">
									{formatCurrency(t.amount)}
								</td>
								<td className="px-4 py-3 text-center">
									<button
										onClick={() => setTransactionToDelete(t)}
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

			<ConfirmModal
				isOpen={Boolean(transactionToDelete)}
				title="Підтвердьте видалення доходу"
				description={
					transactionToDelete
						? `Транзакція на ${formatCurrency(transactionToDelete.amount)} буде видалена.`
						: ''
				}
				confirmText="Видалити"
				cancelText="Скасувати"
				tone="danger"
				isLoading={isDeleting}
				onClose={() => setTransactionToDelete(null)}
				onConfirm={() =>
					transactionToDelete ? remove(transactionToDelete.id) : undefined
				}
			/>
		</>
	)
}
