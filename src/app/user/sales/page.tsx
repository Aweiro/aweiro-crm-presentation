'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '@/lib/currency'

type Stats = {
	count: number
	cash: number
	card: number
	total: number
}

type RecentTx = {
	id: number
	amount: number
	paymentMethod: string
	createdAt: string
}

type SalesResponse = {
	user: {
		id: number
		name: string
	}
	day: Stats
	month: Stats
	recent: RecentTx[]
	allCashiers: {
		day: Stats & {
			cashiersCount: number
			top: { userId: number; name: string; total: number; count: number }[]
		}
		month: Stats & {
			cashiersCount: number
			top: { userId: number; name: string; total: number; count: number }[]
		}
		list: { userId: number; name: string; dayTotal: number; totalMonth: number }[]
	}
}

export default function UserSalesPage() {
	const [data, setData] = useState<SalesResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showAllRecent, setShowAllRecent] = useState(false)

	useEffect(() => {
		fetch('/api/user/sales', { cache: 'no-store', credentials: 'include' })
			.then(async (res) => {
				const json = await res.json()
				if (!res.ok) throw new Error(json.message || 'Помилка завантаження')
				return json as SalesResponse
			})
			.then((json) => setData(json))
			.catch((err: Error) => setError(err.message))
			.finally(() => setLoading(false))
	}, [])

	const monthLabel = useMemo(
		() => new Date().toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' }),
		[]
	)

	if (loading) {
		return (
			<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-8">
				<div className="page-container flex items-center justify-center py-20">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4" />
						<p className="text-slate-600">Завантаження статистики…</p>
					</div>
				</div>
			</main>
		)
	}

	if (error || !data) {
		return (
			<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-8">
				<div className="page-container">
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
						<p className="text-red-800 font-semibold">❌ {error || 'Немає даних'}</p>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-8">
			<div className="page-container space-y-6">
				<div>
					<h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Мої продажі</h1>
					<p className="text-slate-600 text-sm sm:text-base mt-2">
						Касир: {data.user.name}
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
					<div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
						<p className="text-sm text-slate-500 uppercase font-semibold">За сьогодні</p>
						<p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 break-all">
							{formatCurrency(data.day.total)}
						</p>
						<p className="text-xs sm:text-sm text-slate-500 mt-2">
							{data.day.count} {data.day.count === 1 ? 'продаж' : 'продажів'}
						</p>
						<div className="mt-3 flex items-center justify-between text-sm">
							<span className="text-green-700 break-all">💵 {formatCurrency(data.day.cash)}</span>
							<span className="text-blue-700 break-all text-right">💳 {formatCurrency(data.day.card)}</span>
						</div>
					</div>

					<div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
						<p className="text-sm text-slate-500 uppercase font-semibold">За місяць</p>
						<p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 break-all">
							{formatCurrency(data.month.total)}
						</p>
						<p className="text-xs sm:text-sm text-slate-500 mt-2">
							{monthLabel} • {data.month.count}{' '}
							{data.month.count === 1 ? 'продаж' : 'продажів'}
						</p>
						<div className="mt-3 flex items-center justify-between text-sm">
							<span className="text-green-700 break-all">💵 {formatCurrency(data.month.cash)}</span>
							<span className="text-blue-700 break-all text-right">💳 {formatCurrency(data.month.card)}</span>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
					<h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
						Касири з продажами
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4">
							<p className="text-sm font-semibold text-slate-600 uppercase">За день (всі касири)</p>
							<p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 break-all">
								{formatCurrency(data.allCashiers.day.total)}
							</p>
							<p className="text-xs sm:text-sm text-slate-500 mt-1">
								{data.allCashiers.day.cashiersCount} касир(ів), {data.allCashiers.day.count} продажів
							</p>
						</div>
						<div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4">
							<p className="text-sm font-semibold text-slate-600 uppercase">Загальна (місяць)</p>
							<p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 break-all">
								{formatCurrency(data.allCashiers.month.total)}
							</p>
							<p className="text-xs sm:text-sm text-slate-500 mt-1">
								{data.allCashiers.month.cashiersCount} касир(ів), {data.allCashiers.month.count} продажів
							</p>
						</div>
					</div>

					{data.allCashiers.list.length === 0 ? (
						<p className="text-sm text-slate-500">Немає продажів по касирах.</p>
					) : (
						<div className="space-y-2">
							{data.allCashiers.list.map((u) => (
								<div
									key={u.userId}
									className="rounded-lg border border-slate-200 bg-slate-50 p-3"
								>
									<p className="font-semibold text-slate-900 break-words">{u.name}</p>
									<div className="mt-1 grid grid-cols-2 gap-2 text-xs sm:text-sm">
										<p className="text-blue-700 break-all">
											За день: {formatCurrency(u.dayTotal)}
										</p>
										<p className="text-slate-800 break-all text-right">
											Загальна: {formatCurrency(u.totalMonth)}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
					<h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Останні операції</h2>
					{data.recent.length === 0 ? (
						<p className="text-slate-500 text-sm sm:text-base">За цей місяць ще немає продажів.</p>
					) : (
						<div className="space-y-2">
							{(showAllRecent ? data.recent : data.recent.slice(0, 5)).map((tx) => (
								<div
									key={tx.id}
									className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
								>
									<div className="min-w-0">
										<p className="text-xs sm:text-sm text-slate-500">
											{new Date(tx.createdAt).toLocaleDateString('uk-UA', {
												day: '2-digit',
												month: '2-digit',
												hour: '2-digit',
												minute: '2-digit'
											})}
										</p>
										<p className="text-xs sm:text-sm font-semibold text-slate-700">
											{tx.paymentMethod === 'CASH' ? '💵 Готівка' : '💳 Карта'}
										</p>
									</div>
									<p className="font-bold text-slate-900 text-sm sm:text-base break-all text-right">
										{formatCurrency(tx.amount)}
									</p>
								</div>
							))}
							{data.recent.length > 5 && (
								<button
									type="button"
									onClick={() => setShowAllRecent((prev) => !prev)}
									className="w-full mt-2 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
								>
									{showAllRecent ? 'Показати менше' : 'Показати всі'}
								</button>
							)}
						</div>
					)}
				</div>
			</div>
		</main>
	)
}
