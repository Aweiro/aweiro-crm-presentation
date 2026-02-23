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
	barberAmount?: number
	cosmeticsAmount?: number
	items?: Array<{
		id?: number
		itemId?: number
		itemName: string
		price: number
		quantity: number
		lineTotal: number
	}>
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
	const hasReceiptFormat = transactions.some((t) => Array.isArray(t.items))
	const hasItems = (t: Tx) => (t.items ?? []).length > 0

	return (
		<>
			<div className="md:hidden space-y-3">
				{transactions.map((t) => (
					<div
						key={t.id}
						className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100"
					>
						<div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 px-3 py-3 border-b border-slate-200">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
										Працівник
									</p>
									<p className="font-semibold text-slate-900 break-words text-[15px]">
										{t.user?.name ?? '—'}
									</p>
									<p className="mt-1 text-xs text-slate-500">
										🕒 {formatTime(t.createdAt)}
									</p>
								</div>
								<span
									className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
										t.paymentMethod === 'CASH'
											? 'bg-green-100 text-green-800'
											: 'bg-blue-100 text-blue-800'
									}`}
								>
									{t.paymentMethod === 'CASH' ? '💵 Готівка' : '💳 Карта'}
								</span>
							</div>
						</div>

						<div className="p-3.5">
							{hasReceiptFormat ? (
								<div className="text-xs text-slate-700 space-y-2.5">
									<div className="flex flex-wrap gap-2.5">
										{(t.barberAmount ?? 0) > 0 ? (
											<span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800 ring-1 ring-emerald-200">
												✂️ Барбер: {formatCurrency(t.barberAmount ?? 0)}
											</span>
										) : null}
										{(t.cosmeticsAmount ?? 0) > 0 ? (
											<span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-1 font-semibold text-violet-800 ring-1 ring-violet-200">
												🧴 Косметика: {formatCurrency(t.cosmeticsAmount ?? 0)}
											</span>
										) : null}
									</div>
									{hasItems(t) ? (
										<div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-2.5">
											<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-500 mb-2">
												🧴 Склад чеку
											</p>
											<div className="space-y-1.5">
												{(t.items ?? []).map((item, idx) => (
													<div
														key={`${t.id}-${idx}`}
														className="flex items-center justify-between gap-3 rounded-lg border border-violet-100 bg-white px-2.5 py-2"
													>
														<div className="min-w-0">
															<p className="text-slate-800 font-medium break-words">
																{item.itemName}
															</p>
															<p className="text-[11px] text-slate-500">
																{item.quantity} × {formatCurrency(item.price)}
															</p>
														</div>
														<p className="shrink-0 font-semibold text-slate-900">
															{formatCurrency(item.lineTotal)}
														</p>
													</div>
												))}
											</div>
										</div>
									) : null}
								</div>
							) : (
								<p className="text-sm font-medium text-slate-700">
									{formatService(t.serviceType)}
								</p>
							)}

							<div className="mt-3.5 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
								<p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
									Сума чеку
								</p>
								<p className="font-bold text-slate-900 text-xl break-all">
									{formatCurrency(t.amount)}
								</p>
							</div>

							<div className="mt-3 flex justify-end">
								<button
									onClick={() => setTransactionToDelete(t)}
									className="px-3 py-1.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg transition-all text-sm font-semibold"
									title="Видалити транзакцію"
								>
									🗑️ Видалити
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
				<table className="w-full border-collapse">
					<thead>
						<tr className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-300">
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
								Чек
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
								className={`border-b border-slate-200 hover:bg-slate-50/70 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
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
								<td className="px-4 py-3 text-slate-700 text-sm">
									{hasReceiptFormat ? (
										<div className="space-y-2">
											<div className="flex flex-wrap gap-1.5">
												{(t.barberAmount ?? 0) > 0 ? (
													<span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
														✂️ {formatCurrency(t.barberAmount ?? 0)}
													</span>
												) : null}
												{(t.cosmeticsAmount ?? 0) > 0 ? (
													<span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 font-semibold text-violet-800">
														🧴 {formatCurrency(t.cosmeticsAmount ?? 0)}
													</span>
												) : null}
											</div>
											{hasItems(t) ? (
												<div className="rounded-lg border border-violet-100 bg-violet-50/40 px-2.5 py-2 text-xs space-y-1">
													<p className="font-semibold uppercase tracking-[0.1em] text-violet-500">
														Позиції
													</p>
													{(t.items ?? []).map((item, idx) => (
														<div
															key={`${t.id}-${idx}`}
															className="flex items-center justify-between gap-3"
														>
															<p className="break-words text-slate-700">
																{item.itemName}{' '}
																<span className="text-slate-500">
																	× {item.quantity}
																</span>
															</p>
															<p className="shrink-0 font-semibold text-slate-900">
																{formatCurrency(item.lineTotal)}
															</p>
														</div>
													))}
												</div>
											) : null}
										</div>
									) : (
										formatService(t.serviceType)
									)}
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
