'use client'

import { useEffect, useState } from 'react'

type Shift = {
	id: number
	cashStart: number | null
	cashEnd: number | null
	openedAt: string | null
	closedAt: string | null
}

type Transaction = {
	id: number
	amount: number
	paymentMethod: string
	createdAt: string
	userId: number
	shiftId: number
	user: { id: number; name: string; login: string }
}

type Expense = {
	id: number
	amount: number
	comment?: string
	createdAt: string
	shiftId: number
}

type ShiftsByMonth = {
	[key: string]: Shift[]
}

export default function ShiftsArchivePage() {
	const [shifts, setShifts] = useState<Shift[]>([])
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [expenses, setExpenses] = useState<Expense[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

	useEffect(() => {
		Promise.all([
			fetch('/api/admin/shifts').then((res) => res.json()),
			fetch('/api/admin/transactions').then((res) => res.json()),
			fetch('/api/admin/expenses?archive=true').then((res) => res.json())
		])
			.then(([shiftsData, transactionsData, expensesData]) => {
				console.log('Raw Shifts Data:', shiftsData)
				console.log('Shifts.data:', shiftsData.data)
				console.log('Is array?', Array.isArray(shiftsData.data))
				const sortedShifts = (
					Array.isArray(shiftsData.data) ? shiftsData.data : []
				).sort(
					(a: any, b: any) =>
						new Date(b.closedAt || '').getTime() -
						new Date(a.closedAt || '').getTime()
				)
				console.log('Sorted shifts:', sortedShifts)
				setShifts(sortedShifts)
				setTransactions(
					Array.isArray(transactionsData.data) ? transactionsData.data : []
				)
				setExpenses(Array.isArray(expensesData.data) ? expensesData.data : [])
				if (sortedShifts.length > 0 && sortedShifts[0].closedAt) {
					const firstMonth = new Date(sortedShifts[0].closedAt)
					setSelectedMonth(formatMonthKey(firstMonth))
				}
			})
			.catch((err) => console.error('Error loading data:', err))
			.finally(() => setIsLoading(false))
	}, [])

	const formatMonthKey = (date: Date) => {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		return `${year}-${month}`
	}

	const getMonthName = (monthKey: string) => {
		const [year, month] = monthKey.split('-')
		const date = new Date(parseInt(year), parseInt(month) - 1, 1)
		return date.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })
	}

	const shiftsByMonth: ShiftsByMonth = shifts.reduce((acc, shift) => {
		if (!shift.closedAt) return acc
		const monthKey = formatMonthKey(new Date(shift.closedAt))
		if (!acc[monthKey]) acc[monthKey] = []
		acc[monthKey].push(shift)
		return acc
	}, {} as ShiftsByMonth)

	const months = Object.keys(shiftsByMonth).sort().reverse()

	console.log(
		'RENDER: shifts.length=' +
			shifts.length +
			', months.length=' +
			months.length
	)

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

	const formatCurrency = (value: number | null) => {
		if (value === null) return '—'
		return new Intl.NumberFormat('uk-UA', {
			style: 'currency',
			currency: 'UAH',
			minimumFractionDigits: 2
		}).format(value)
	}

	const calculateDifference = (
		cashStart: number | null,
		cashEnd: number | null
	) => {
		if (cashStart === null || cashEnd === null) return null
		return cashEnd - cashStart
	}

	const getDaysCount = () => {
		if (shifts.length === 0) return 0
		const totalCash = shifts.reduce((sum, shift) => {
			if (shift.cashEnd !== null) return sum + shift.cashEnd
			return sum
		}, 0)
		return totalCash
	}

	const getAverageCash = () => {
		if (shifts.length === 0) return 0
		return getDaysCount() / shifts.length
	}

	const getMonthStats = () => {
		if (!selectedMonth) return null

		const monthShifts = shiftsByMonth[selectedMonth] || []
		const monthShiftIds = monthShifts.map((s) => s.id)

		const monthTransactions = transactions.filter((t) =>
			monthShiftIds.includes(t.shiftId)
		)
		const monthExpenses = expenses.filter((e) =>
			monthShiftIds.includes(e.shiftId)
		)

		const cashTransactions = monthTransactions.filter(
			(t) => t.paymentMethod === 'CASH'
		)
		const cardTransactions = monthTransactions.filter(
			(t) => t.paymentMethod === 'CARD'
		)

		const totalCashIncome = cashTransactions.reduce(
			(sum, t) => sum + t.amount,
			0
		)
		const totalCardIncome = cardTransactions.reduce(
			(sum, t) => sum + t.amount,
			0
		)
		const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
		const totalIncome = totalCashIncome + totalCardIncome

		// Статистика по працівниках
		const userStats = new Map<
			number,
			{ name: string; transactions: number; amount: number }
		>()
		monthTransactions.forEach((t) => {
			const existing = userStats.get(t.userId) || {
				name: t.user.name || t.user.login,
				transactions: 0,
				amount: 0
			}
			userStats.set(t.userId, {
				name: existing.name,
				transactions: existing.transactions + 1,
				amount: existing.amount + t.amount
			})
		})

		return {
			shifts: monthShifts.length,
			totalIncome,
			totalCashIncome,
			totalCardIncome,
			totalExpenses,
			profit: totalIncome - totalExpenses,
			transactions: monthTransactions.length,
			userStats: Array.from(userStats.entries())
				.map(([id, data]) => ({ id, ...data }))
				.sort((a, b) => b.amount - a.amount)
		}
	}

	if (isLoading) {
		return (
			<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-0">
				<div className="w-full">
					<div className="flex items-center justify-center py-20">
						<div className="text-center">
							<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
							<p className="text-slate-600 text-lg">Завантаження архіву…</p>
						</div>
					</div>
				</div>
			</main>
		)
	}

	const hasData = shifts.length > 0

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-0">
			<div className="w-full">
				<div className="mb-6 sm:mb-8">
					<h1 className="text-3xl sm:text-4xl font-bold text-slate-900">📋 Архів змін</h1>
					<p className="text-slate-600 mt-2 text-base sm:text-lg">
						Історія всіх закритих змін і звітів
					</p>
				</div>

				{!hasData && (
					<div className="bg-white rounded-lg shadow-md p-12 text-center border border-slate-200">
						<p className="text-3xl mb-4">📭</p>
						<p className="text-slate-600 text-lg font-medium">
							Поки що немає закритих змін
						</p>
						<p className="text-slate-500 mt-2">
							Архив буде заповнюватися по мірі закриття змін
						</p>
					</div>
				)}

				{hasData && (
					<div className="space-y-6">
						{/* Календар місяців */}
						<div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
							<h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
								<span className="text-2xl">🗓️</span>
								Архів по місяцях
							</h2>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
								{months.map((monthKey) => {
									const count = shiftsByMonth[monthKey].length
									return (
										<button
											key={monthKey}
											onClick={() => setSelectedMonth(monthKey)}
											className={`px-4 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
												selectedMonth === monthKey
													? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg ring-2 ring-blue-400'
													: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
											}`}
										>
											<div className="text-2xl leading-tight">
												{monthKey.split('-')[0]}
											</div>
											<div className="text-xs text-opacity-75 mt-0.5">
												{new Date(
													parseInt(monthKey.split('-')[0]),
													parseInt(monthKey.split('-')[1]) - 1
												).toLocaleDateString('uk-UA', { month: 'short' })}
											</div>
											<div
												className={`text-sm font-bold mt-1 ${selectedMonth === monthKey ? 'text-blue-100' : 'text-slate-600'}`}
											>
												{count}{' '}
												{count % 10 === 1 && count !== 11 ? 'зміна' : 'змін'}
											</div>
										</button>
									)
								})}
							</div>
						</div>

						{/* Таблиця змін для вибраного місяця */}
						{selectedMonth && shiftsByMonth[selectedMonth] && (
							<div className="space-y-6">
								<div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
									<div className="bg-gradient-to-br from-blue-600 via-blue-650 to-blue-700 text-white px-8 py-6 flex items-center justify-between">
										<div>
											<h3 className="text-2xl font-bold">
												📅 {getMonthName(selectedMonth)}
											</h3>
											<p className="text-blue-100 text-sm mt-2">
												{shiftsByMonth[selectedMonth].length}{' '}
												{shiftsByMonth[selectedMonth].length % 10 === 1 &&
												shiftsByMonth[selectedMonth].length !== 11
													? 'зміна'
													: 'змін'}
											</p>
										</div>
										<div className="text-right">
											<div className="text-3xl sm:text-4xl font-bold text-blue-100">
												{shiftsByMonth[selectedMonth].length}
											</div>
										</div>
									</div>

									<div className="overflow-x-auto">
										<table className="w-full">
											<thead className="bg-slate-50 border-b border-slate-200">
												<tr>
													<th className="px-6 py-4 text-left font-bold text-slate-900">
														ID
													</th>
													<th className="px-6 py-4 text-left font-bold text-slate-900">
														Відкрито
													</th>
													<th className="px-6 py-4 text-left font-bold text-slate-900">
														Закрито
													</th>
													<th className="px-6 py-4 text-right font-bold text-slate-900">
														Каса на старт
													</th>
													<th className="px-6 py-4 text-right font-bold text-slate-900">
														Каса на закрит
													</th>
													<th className="px-6 py-4 text-right font-bold text-slate-900">
														Різниця
													</th>
													<th className="px-6 py-4 text-center font-bold text-slate-900">
														Деталі
													</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-slate-200">
												{shiftsByMonth[selectedMonth].map((shift, index) => {
													const difference = calculateDifference(
														shift.cashStart,
														shift.cashEnd
													)
													const isProfit = difference && difference > 0

													return (
														<tr
															key={shift.id}
															className={`transition-colors hover:bg-slate-50 ${
																index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
															}`}
														>
															<td className="px-6 py-4">
																<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
																	{shift.id}
																</span>
															</td>
															<td className="px-6 py-4 text-sm text-slate-700">
																<div className="font-medium">
																	{formatDate(shift.openedAt)}
																</div>
															</td>
															<td className="px-6 py-4 text-sm text-slate-700">
																<div className="font-medium">
																	{formatDate(shift.closedAt)}
																</div>
															</td>
															<td className="px-6 py-4 text-right text-sm">
																<span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-semibold">
																	{formatCurrency(shift.cashStart)}
																</span>
															</td>
															<td className="px-6 py-4 text-right text-sm">
																<span className="inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-semibold">
																	{formatCurrency(shift.cashEnd)}
																</span>
															</td>
															<td className="px-6 py-4 text-right text-sm">
																{difference !== null && (
																	<span
																		className={`inline-block px-3 py-1 rounded-lg font-bold ${
																			isProfit
																				? 'bg-green-100 text-green-700'
																				: 'bg-red-100 text-red-700'
																		}`}
																	>
																		{isProfit ? '+' : ''}
																		{formatCurrency(difference)}
																	</span>
																)}
															</td>
															<td className="px-6 py-4 text-center">
																<a
																	href={`/admin/shifts/${shift.id}`}
																	className="inline-block px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors"
																>
																	Детальніше →
																</a>
															</td>
														</tr>
													)
												})}
											</tbody>
										</table>
									</div>

									<div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-4 border-t border-slate-200 flex items-center justify-between">
										<p className="text-sm text-slate-700">
											<span className="font-bold text-slate-900">
												{shiftsByMonth[selectedMonth].length}
											</span>{' '}
											{shiftsByMonth[selectedMonth].length % 10 === 1 &&
											shiftsByMonth[selectedMonth].length !== 11
												? 'зміна'
												: 'змін'}{' '}
											у {getMonthName(selectedMonth).toLowerCase()}
										</p>
										<div className="text-right text-xs text-slate-500">
											Прокрутіть для див. деталей →
										</div>
									</div>
								</div>

								{/* Статистика по місяцю */}
								{getMonthStats() && (
									<div className="space-y-6">
										{/* Основні показники */}
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
											<div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
												<p className="text-slate-500 text-sm uppercase tracking-wider font-semibold">
													Загальний дохід
												</p>
												<p className="text-xl sm:text-3xl font-bold text-green-600 mt-2 break-all leading-tight">
													{formatCurrency(getMonthStats()!.totalIncome)}
												</p>
												<p className="text-xs text-slate-400 mt-2">
													{getMonthStats()!.transactions} операцій
												</p>
											</div>

											<div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
												<p className="text-slate-500 text-sm uppercase tracking-wider font-semibold">
													Готівка
												</p>
												<p className="text-xl sm:text-3xl font-bold text-blue-600 mt-2 break-all leading-tight">
													{formatCurrency(getMonthStats()!.totalCashIncome)}
												</p>
												<p className="text-xs text-slate-400 mt-2">
													{getMonthStats()!.totalCashIncome > 0 ? '💵' : ''}
												</p>
											</div>

											<div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
												<p className="text-slate-500 text-sm uppercase tracking-wider font-semibold">
													Карта
												</p>
												<p className="text-xl sm:text-3xl font-bold text-purple-600 mt-2 break-all leading-tight">
													{formatCurrency(getMonthStats()!.totalCardIncome)}
												</p>
												<p className="text-xs text-slate-400 mt-2">
													{getMonthStats()!.totalCardIncome > 0 ? '💳' : ''}
												</p>
											</div>

											<div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-200">
												<p className="text-slate-500 text-sm uppercase tracking-wider font-semibold">
													Витрати
												</p>
												<p className="text-xl sm:text-3xl font-bold text-red-600 mt-2 break-all leading-tight">
													{formatCurrency(getMonthStats()!.totalExpenses)}
												</p>
												<p className="text-xs text-slate-400 mt-2">
													Усього видатків
												</p>
											</div>
										</div>

										{/* Прибуток */}
										<div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-5 sm:p-8 border border-green-200">
											<h4 className="text-lg font-bold text-green-900 mb-2">
												📈 Чистий прибуток
											</h4>
											<p className="text-3xl sm:text-5xl font-bold text-green-600 break-all leading-tight">
												{formatCurrency(getMonthStats()!.profit)}
											</p>
											<p className="text-sm text-green-700 mt-3">
												Дохід: {formatCurrency(getMonthStats()!.totalIncome)} -
												Витрати:{' '}
												{formatCurrency(getMonthStats()!.totalExpenses)}
											</p>
										</div>

										{/* Особисті продажі касирів */}
										{getMonthStats()!.userStats.length > 0 && (
											<div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6">
												<h4 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
													<span className="text-2xl">👥</span>
													Особисті продажі касирів
												</h4>
												<div className="space-y-3">
													{getMonthStats()!.userStats.map((user, index) => (
														<div
															key={user.id}
															className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-lg border border-slate-200"
														>
															<div className="flex items-center gap-4 flex-1">
																<div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm">
																	{index + 1}
																</div>
																<div>
																	<p className="font-semibold text-slate-900">
																		{user.name}
																	</p>
																	<p className="text-xs text-slate-500">
																		{user.transactions} операцій
																	</p>
																</div>
															</div>
															<div className="text-right min-w-0">
																<p className="font-bold text-sm sm:text-lg text-slate-900 break-all leading-tight">
																	{formatCurrency(user.amount)}
																</p>
															</div>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								)}
							</div>
						)}

						{/* Загальна статистика */}
						<div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg p-5 sm:p-8 border border-slate-700 text-white">
							<div className="flex items-start justify-between">
								<div>
									<h3 className="text-lg font-bold mb-2 flex items-center gap-2">
										<span className="text-3xl">📊</span>
										Статистика архіву
									</h3>
									<p className="text-slate-300 text-sm">
										Усього зберігається в системі
									</p>
								</div>
								<div className="text-right">
									<div className="text-3xl sm:text-5xl font-bold text-blue-400">
										{shifts.length}
									</div>
									<p className="text-slate-400 text-sm mt-1 font-medium">
										{shifts.length % 10 === 1 && shifts.length !== 11
											? 'зміна'
											: 'змін'}
									</p>
								</div>
							</div>

							{/* Додатково статистика */}
							<div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-700">
								<div className="text-center">
									<p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
										Місяців
									</p>
									<p className="text-2xl font-bold text-blue-400">
										{months.length}
									</p>
								</div>
								<div className="text-center">
									<p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
										Загальна сума кас
									</p>
									<p className="text-sm sm:text-lg font-bold text-green-400 break-all leading-tight">
										{formatCurrency(getDaysCount())}
									</p>
								</div>
								<div className="text-center">
									<p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
										Середня каса
									</p>
									<p className="text-sm sm:text-lg font-bold text-purple-400 break-all leading-tight">
										{formatCurrency(getAverageCash())}
									</p>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</main>
	)
}
