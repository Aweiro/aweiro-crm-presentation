'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/currency'
import ConfirmModal from './ConfirmModal'
import { Trash2, Receipt, Package, Scissors, Gift, CreditCard, Coins } from 'lucide-react'

type Tx = {
	id: number
	amount: number
	paymentMethod: 'CASH' | 'CARD'
	serviceType?: 'BARBER' | 'COSMETICS'
	barberAmount?: number
	cosmeticsAmount?: number
	discount?: number
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
		new Date(value).toLocaleString('uk-UA', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		})
	const formatService = (serviceType?: 'BARBER' | 'COSMETICS') =>
		serviceType === 'COSMETICS' ? '🧴 Косметика' : '✂️ Барбер'
	const formatReceiptItemName = (item: NonNullable<Tx['items']>[number]) =>
		item.itemId ? `🧴 ${item.itemName}` : item.itemName
	const hasReceiptFormat = transactions.some((t) => Array.isArray(t.items))
	const hasItems = (t: Tx) => (t.items ?? []).length > 0

	return (
		<>
			<div className="space-y-4">
				{transactions.map((t) => (
					<div
						key={`${Array.isArray(t.items) ? 'r' : 't'}-${t.id}`}
						className="group relative overflow-hidden rounded-[2rem] bg-white border border-slate-200/60 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
					>
						<div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 pointer-events-none" />

						{/* Left: Info */}
						<div className="relative flex items-start gap-4 sm:w-1/3">
							<div className="shrink-0 w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
								{hasReceiptFormat ? <Receipt size={24} /> : formatService(t.serviceType) === '🧴 Косметика' ? <Package size={24} /> : <Scissors size={24} />}
							</div>
							<div>
								<p className="font-black text-slate-900 leading-tight mb-1 text-lg">
									{t.user?.name ?? '—'}
								</p>
								<div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
									🕒 {formatTime(t.createdAt)}
								</div>
							</div>
						</div>

						{/* Center: Breakdown / Items */}
						<div className="relative flex-1">
							{hasReceiptFormat ? (
								<div className="flex flex-col gap-2">
									<div className="flex flex-wrap gap-2">
										{(t.barberAmount ?? 0) > 0 ? (
											<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-100/60 text-[11px] font-black uppercase tracking-widest text-emerald-600 shadow-sm">
												<Scissors size={12} className="opacity-70" /> {formatCurrency(t.barberAmount ?? 0)}
											</span>
										) : null}
										{(t.cosmeticsAmount ?? 0) > 0 ? (
											<span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 border border-violet-100/60 text-[11px] font-black uppercase tracking-widest text-violet-600 shadow-sm">
												<Package size={12} className="opacity-70" /> {formatCurrency(t.cosmeticsAmount ?? 0)}
											</span>
										) : null}
										{(t.discount ?? 0) > 0 ? (
											<span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 border border-red-100/60 text-[11px] font-black uppercase tracking-widest text-red-600 shadow-sm">
												<Gift size={12} className="opacity-70" /> −{formatCurrency(t.discount ?? 0)}
											</span>
										) : null}
									</div>
									{hasItems(t) ? (
										<div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 mt-1 space-y-2">
											<p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
												Склад чеку
											</p>
											<div className="grid gap-2">
												{(t.items ?? []).map((item, idx) => (
													<div
														key={`${t.id}-${idx}`}
														className="flex items-center justify-between gap-3 text-sm"
													>
														<p className="font-bold text-slate-700 break-words flex-1">
															{formatReceiptItemName(item)}
															<span className="text-slate-400 font-bold ml-1 text-xs">
																× {item.quantity}
															</span>
														</p>
														<p className="shrink-0 font-black text-slate-900">
															{formatCurrency(item.lineTotal)}
														</p>
													</div>
												))}
											</div>
										</div>
									) : null}
								</div>
							) : (
								<p className="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-100 text-xs font-black uppercase tracking-widest text-slate-600">
									{formatService(t.serviceType)}
								</p>
							)}
						</div>

						{/* Right: Total & Action */}
						<div className="relative flex items-center justify-between sm:justify-end sm:flex-col sm:items-end gap-4 sm:gap-2 sm:w-1/4">
							<div className="flex flex-col items-start sm:items-end">
								<span
									className={`inline-flex items-center gap-1.5 mb-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${t.paymentMethod === 'CASH'
										? 'bg-emerald-50 border border-emerald-100/60 text-emerald-600'
										: 'bg-blue-50 border border-blue-100/60 text-blue-600'
										}`}
								>
									{t.paymentMethod === 'CASH' ? (
										<><Coins size={12} className="opacity-70" /> Готівка</>
									) : (
										<><CreditCard size={12} className="opacity-70" /> Карта</>
									)}
								</span>
								<p className="font-black text-slate-900 text-2xl tracking-tight leading-none">
									{formatCurrency(t.amount)}
								</p>
							</div>

							<button
								onClick={() => setTransactionToDelete(t)}
								className="shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:-translate-x-2 sm:group-hover:translate-x-0 inline-flex items-center justify-center p-3 sm:p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-all duration-300 border border-transparent hover:border-rose-200"
								title="Видалити транзакцію"
							>
								<Trash2 size={16} />
							</button>
						</div>
					</div>
				))}
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
