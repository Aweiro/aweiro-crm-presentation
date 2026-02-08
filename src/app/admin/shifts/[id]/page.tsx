'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Transaction = {
	amount: number
	paymentMethod: 'CASH' | 'CARD'
	user: {
		id: number
		name: string
	}
}

type Expense = {
	amount: number
	comment?: string
}

export default function ShiftDetailsPage() {
	const params = useParams()
	const router = useRouter()

	const rawId = params.id
	const id = Array.isArray(rawId) ? rawId[0] : rawId

	const [data, setData] = useState<any>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!id) return

		fetch(`/api/admin/shifts/${id}`)
			.then(async (res) => {
				const json = await res.json()
				if (!res.ok) throw json
				return json
			})
			.then(setData)
			.catch((err) => {
				console.error(err)
				setError(err.message ?? 'Помилка завантаження зміни')
			})
	}, [id])

	const summary = useMemo(() => {
		if (!data) return null

		const transactions: Transaction[] = data.transactions ?? []
		const expenses: Expense[] = data.expenses ?? []

		const cashIncome = transactions
			.filter((t: any) => t.paymentMethod === 'CASH')
			.reduce((sum, t) => sum + t.amount, 0)

		const cardIncome = transactions
			.filter((t) => t.paymentMethod === 'CARD')
			.reduce((sum, t) => sum + t.amount, 0)

		const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

		return {
			cashIncome,
			cardIncome,
			expenses: totalExpenses
		}
	}, [data])

	const personalSales = useMemo(() => {
		const transactions: Transaction[] = data?.transactions ?? []
		const salesMap = new Map<
			number,
			{ userId: number; name: string; total: number; count: number; cash: number; card: number }
		>()

		transactions.forEach((t) => {
			const userId = t.user?.id
			if (!userId) return

			const entry = salesMap.get(userId) ?? {
				userId,
				name: t.user?.name || `Касир #${userId}`,
				total: 0,
				count: 0,
				cash: 0,
				card: 0
			}

			entry.total += t.amount
			entry.count += 1
			if (t.paymentMethod === 'CASH') entry.cash += t.amount
			if (t.paymentMethod === 'CARD') entry.card += t.amount
			salesMap.set(userId, entry)
		})

		return Array.from(salesMap.values()).sort((a, b) => b.total - a.total)
	}, [data?.transactions])

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('uk-UA', {
			style: 'currency',
			currency: 'UAH',
			minimumFractionDigits: 2
		}).format(value)
	}

	const formatDate = (dateString: string | null) => {
		if (!dateString) return '—'
		const date = new Date(dateString)
		return date.toLocaleDateString('uk-UA', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	if (error) {
		return (
			<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-0">
				<div className="max-w-4xl mx-auto">
					<button
						onClick={() => router.back()}
						className="mb-6 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-semibold"
					>
						← Назад
					</button>
					<div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-8 text-center">
						<p className="text-2xl text-red-900 font-bold">❌ {error}</p>
					</div>
				</div>
			</main>
		)
	}

	if (!summary) {
		return (
			<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-0">
				<div className="max-w-4xl mx-auto flex items-center justify-center py-20">
					<div className="text-center">
						<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<p className="text-slate-600 text-lg">Завантаження деталей зміни…</p>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-0">
			<div className="max-w-4xl mx-auto">
				<button
					onClick={() => router.back()}
					className="mb-6 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-semibold"
				>
					← Назад до архіву
				</button>

				<div className="bg-white rounded-lg shadow-lg border border-slate-200 p-4 sm:p-8 mb-6 sm:mb-8">
					<div className="flex justify-between items-start mb-5 sm:mb-6">
						<div>
							<h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
								📊 Зміна #{data.shift.id}
							</h1>
							<p className="text-slate-600 mt-2 text-sm sm:text-base">Деталіз звіту про работу</p>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<p className="text-sm text-blue-700 font-semibold uppercase mb-1">📖 Відкрито</p>
							<p className="text-base sm:text-lg font-bold text-blue-900">{formatDate(data.shift.openedAt)}</p>
						</div>
						<div className="bg-slate-100 border border-slate-300 rounded-lg p-4">
							<p className="text-sm text-slate-700 font-semibold uppercase mb-1">🔒 Закрито</p>
							<p className="text-base sm:text-lg font-bold text-slate-900">{formatDate(data.shift.closedAt)}</p>
						</div>
					</div>
				</div>

				{data.transactions && data.transactions.length > 0 && (
					<div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden mb-8">
						<div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4">
							<h2 className="text-xl sm:text-2xl font-bold">💰 Платежі ({data.transactions.length})</h2>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-slate-50 border-b border-slate-200">
									<tr>
										<th className="px-3 sm:px-6 py-3 text-left font-bold text-slate-700">Працівник</th>
										<th className="px-3 sm:px-6 py-3 text-center font-bold text-slate-700">Спосіб</th>
										<th className="px-3 sm:px-6 py-3 text-right font-bold text-slate-700">Сума</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-200">
									{data.transactions.map((t: Transaction, i: number) => (
										<tr
											key={i}
											className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
										>
											<td className="px-3 sm:px-6 py-3 font-medium text-slate-900 break-words">
												👤 {t.user?.name ?? '—'}
											</td>
											<td className="px-3 sm:px-6 py-3 text-center">
												<span
													className={`inline-block px-2 sm:px-3 py-1 rounded-lg font-semibold text-xs sm:text-sm ${
														t.paymentMethod === 'CASH'
															? 'bg-green-100 text-green-700'
															: 'bg-blue-100 text-blue-700'
													}`}
												>
													{t.paymentMethod === 'CASH' ? '💵 Готівка' : '💳 Карта'}
												</span>
											</td>
											<td className="px-3 sm:px-6 py-3 text-right">
												<span className="font-bold text-slate-900 break-all">
													{formatCurrency(t.amount)}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{data.expenses && data.expenses.length > 0 && (
					<div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden mb-8">
						<div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4">
							<h2 className="text-xl sm:text-2xl font-bold">📉 Витрати ({data.expenses.length})</h2>
						</div>
						<div className="space-y-2 p-4 sm:p-6">
							{data.expenses.map((e: Expense, i: number) => (
								<div
									key={i}
									className="flex justify-between items-start p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
								>
									<div className="flex-1">
										<p className="font-semibold text-slate-900">
											{e.comment || 'Витрата'}
										</p>
										{e.comment && (
											<p className="text-sm text-slate-600 mt-1">
												{e.comment}
											</p>
										)}
									</div>
									<span className="font-bold text-red-700 ml-3 sm:ml-4 text-sm sm:text-base break-all text-right">
										−{formatCurrency(e.amount)}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{personalSales.length > 0 && (
					<div className="bg-white rounded-lg shadow-lg border border-slate-200 p-4 sm:p-6 mb-8">
						<h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
							👥 Особисті продажі касирів
						</h2>
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
												{item.count} {item.count === 1 ? 'продаж' : 'продажів'}
											</p>
										</div>
										<p className="font-bold text-slate-900 text-sm sm:text-base break-all text-right">
											{formatCurrency(item.total)}
										</p>
									</div>
									<div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:text-sm">
										<p className="text-green-700 break-all">💵 {formatCurrency(item.cash)}</p>
										<p className="text-blue-700 break-all text-right">💳 {formatCurrency(item.card)}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				<div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-4 sm:p-8">
					<h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">📈 Зведення зміни</h2>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
						<div className="bg-white/20 rounded-lg p-4 sm:p-6 backdrop-blur">
							<p className="text-blue-100 text-sm font-semibold uppercase mb-2">
								💰 Каса на старт
							</p>
							<p className="text-xl sm:text-3xl font-bold break-all leading-tight">
								{formatCurrency(data.shift.cashStart ?? 0)}
							</p>
						</div>

						<div className="bg-white/20 rounded-lg p-4 sm:p-6 backdrop-blur">
							<p className="text-blue-100 text-sm font-semibold uppercase mb-2">
								🟢 Готівка приймана
							</p>
							<p className="text-xl sm:text-3xl font-bold text-green-300 break-all leading-tight">
								+{formatCurrency(summary.cashIncome)}
							</p>
						</div>

						<div className="bg-white/20 rounded-lg p-4 sm:p-6 backdrop-blur">
							<p className="text-blue-100 text-sm font-semibold uppercase mb-2">
								💳 Карти приймано
							</p>
							<p className="text-xl sm:text-3xl font-bold text-purple-300 break-all leading-tight">
								+{formatCurrency(summary.cardIncome)}
							</p>
						</div>

						<div className="bg-white/20 rounded-lg p-4 sm:p-6 backdrop-blur">
							<p className="text-blue-100 text-sm font-semibold uppercase mb-2">
								📉 Витрати
							</p>
							<p className="text-xl sm:text-3xl font-bold text-red-300 break-all leading-tight">
								−{formatCurrency(summary.expenses)}
							</p>
						</div>
					</div>

					<div className="border-t-2 border-white/30 pt-5 sm:pt-6">
						<p className="text-blue-100 text-sm font-semibold uppercase mb-3">
							🔒 Каса на закрит (фактична)
						</p>
						<p className="text-3xl sm:text-5xl font-bold break-all leading-tight">
							{formatCurrency(data.shift.cashEnd ?? 0)}
						</p>
						<p className="text-blue-200 text-sm mt-4">
							Розраховано:{' '}
							<span className="font-bold">
								{formatCurrency(
									(data.shift.cashStart ?? 0) +
										summary.cashIncome -
										summary.expenses
								)}
							</span>
						</p>
					</div>
				</div>
			</div>
		</main>
	)
}
