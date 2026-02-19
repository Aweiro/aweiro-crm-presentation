'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import ShiftControl from '@/components/ShiftControl'
import AdminTable from '@/components/AdminTable'
import CashSummary from '@/components/CashSummary'
import ExpenseForm from '@/components/ExpenseForm'
import ExpensesList from '@/components/ExpensesList'
import { fetcher } from '@/lib/fetcher'
import { formatCurrency } from '@/lib/currency'

export default function AdminDayPage() {
	const { data, isLoading, mutate } = useSWR('/api/admin/day', fetcher)
	const personalSales = useMemo(() => {
		const transactions = data?.transactions ?? []
		const salesMap = new Map<
			number,
			{
				userId: number
				name: string
				total: number
				count: number
				cash: number
				card: number
				barber: number
				cosmetics: number
			}
		>()

		transactions.forEach((t: any) => {
			const userId = t.user?.id
			if (!userId) return

			const entry = salesMap.get(userId) ?? {
				userId,
				name: t.user?.name || t.user?.login || `Касир #${userId}`,
				total: 0,
				count: 0,
				cash: 0,
				card: 0,
				barber: 0,
				cosmetics: 0
			}

			entry.total += t.amount
			entry.count += 1
			if (t.paymentMethod === 'CASH') entry.cash += t.amount
			if (t.paymentMethod === 'CARD') entry.card += t.amount
			if (t.serviceType === 'COSMETICS') entry.cosmetics += t.amount
			else entry.barber += t.amount
			salesMap.set(userId, entry)
		})

		return Array.from(salesMap.values()).sort((a, b) => b.total - a.total)
	}, [data?.transactions])

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-slate-600">Завантаження дня…</p>
				</div>
			</div>
		)
	}

	const shift = data?.shift

	return (
		<>
			{/* ЗАГОЛОВОК */}
			<div className="mb-6 sm:mb-8">
				<h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
					Управління днем
				</h1>
				<p className="text-slate-600 text-sm sm:text-base">
					{new Date().toLocaleDateString('uk-UA', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</p>
			</div>

			{/* КЕРУВАННЯ ЗМІНОЮ */}
			<div className="mb-8">
				<ShiftControl onChange={mutate} />
			</div>

			{/* ⛔ ЗМІНА ЗАКРИТА */}
			{!shift && (
				<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 sm:p-6 rounded-lg shadow-sm">
					<div className="flex items-center">
						<span className="text-2xl sm:text-3xl mr-3 sm:mr-4">⛔</span>
						<div>
							<h3 className="text-base sm:text-lg font-semibold text-yellow-800">
								Зміна закрита
							</h3>
							<p className="text-yellow-700 mt-1 text-sm sm:text-base">
								Відкрий нову зміну для початку роботи
							</p>
						</div>
					</div>
				</div>
			)}

			{/* ✅ ЗМІНА ВІДКРИТА */}
			{shift && (
				<div className="space-y-8">
					{/* СТАТИСТИКА */}
					{data.summary && (
						<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-slate-200">
							<h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
								Касса
							</h2>
							<CashSummary summary={data.summary} />
						</div>
					)}

					{/* ТАБЛИЦЯ ТРАНЗАКЦІЙ */}
					<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-slate-200">
						<h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
							Транзакції
						</h2>
						<AdminTable
							transactions={data?.transactions ?? []}
							isLoading={isLoading}
						/>
					</div>

					{/* ОСОБИСТІ ПРОДАЖІ */}
					<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-slate-200">
						<h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
							Особисті продажі касирів
						</h2>
						{personalSales.length === 0 ? (
							<p className="text-slate-500 text-sm sm:text-base">
								Ще немає продажів у поточній зміні.
							</p>
						) : (
							<div className="space-y-3">
								{personalSales.map((item) => (
									<div
										key={item.userId}
										className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="font-semibold text-slate-900 break-words">
													{item.name}
												</p>
												<p className="text-xs sm:text-sm text-slate-500">
													{item.count}{' '}
													{item.count === 1 ? 'продаж' : 'продажів'}
												</p>
											</div>
											<p className="font-bold text-slate-900 text-sm sm:text-base break-all text-right">
												{formatCurrency(item.total)}
											</p>
										</div>
										<div className="mt-2 flex items-start justify-between gap-4 text-xs sm:text-sm">
											<div className="space-y-1 min-w-0">
												<p className="text-emerald-700 break-all">
													✂️ {formatCurrency(item.barber)}
												</p>
												<p className="text-violet-700 break-all">
													🧴 {formatCurrency(item.cosmetics)}
												</p>
											</div>
											<div className="space-y-1 min-w-0 text-right">
												<p className="text-green-700 break-all">
													💵 {formatCurrency(item.cash)}
												</p>
												<p className="text-blue-700 break-all">
													💳 {formatCurrency(item.card)}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* ВИТРАТИ */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
						<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-slate-200">
							<h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
								Додати витрати
							</h2>
							<ExpenseForm onAdded={mutate} />
						</div>

						<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-slate-200">
							<h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
								Список витрат
							</h2>
							<ExpensesList
								expenses={data?.expenses ?? []}
								isLoading={isLoading}
							/>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
