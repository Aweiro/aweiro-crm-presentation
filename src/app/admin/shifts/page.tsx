'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
	ShieldCheck,
	CalendarDays,
	TrendingUp,
	TrendingDown,
	Coins,
	CreditCard,
	History,
	Receipt,
	PlusCircle,
	LayoutDashboard,
	Info,
	Ban,
	Scissors,
	Package,
	Gift,
	Trash2,
	Building2,
	Zap,
	ListChecks,
	ChevronRight,
	Loader2
} from 'lucide-react'
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	LineChart,
	Line,
	AreaChart,
	Area
} from 'recharts'
import { formatCurrency } from '@/lib/currency'
import ConfirmModal from '@/components/ConfirmModal'
import PageSubTabs from '@/components/PageSubTabs'
import PageLoader from '@/components/PageLoader'
import { normalizeExpenseComment } from '@/lib/expenseComment'
import RentEditModal from '@/components/RentEditModal'

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
	serviceType?: 'BARBER' | 'COSMETICS'
	createdAt: string
	userId: number
	shiftId: number
	user: { id: number; name: string; login: string }
	discount?: number
	barberAmount?: number
	cosmeticsAmount?: number
}

type Expense = {
	id: number
	amount: number
	category: 'SALARY' | 'RENT' | 'UTILITIES' | 'OTHER'
	salaryUserId?: number | null
	comment?: string
	createdAt: string
	shiftId: number
}

type ShiftsByMonth = {
	[key: string]: Shift[]
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function getExpenseCategory(expense: Pick<Expense, 'category' | 'comment'>) {
	if (
		expense.category === 'SALARY' ||
		expense.category === 'RENT' ||
		expense.category === 'UTILITIES' ||
		expense.category === 'OTHER'
	) {
		return expense.category
	}
	const text = (expense.comment || '').toLowerCase()
	if (/(зарплат|salary|зп|виплат)/i.test(text)) return 'SALARY'
	if (/(оренд|rent)/i.test(text)) return 'RENT'
	if (/(комунал|utility|utilities)/i.test(text)) return 'UTILITIES'
	return 'OTHER'
}

export default function ShiftsArchivePage() {
	const pathname = usePathname()
	const router = useRouter()
	const [shifts, setShifts] = useState<Shift[]>([])
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [expenses, setExpenses] = useState<Expense[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
	const [monthExpenseAmount, setMonthExpenseAmount] = useState('')
	const [monthExpenseComment, setMonthExpenseComment] = useState('')
	const [monthExpenseCategory, setMonthExpenseCategory] = useState<
		'RENT' | 'UTILITIES' | 'OTHER'
	>('OTHER')
	const [addingMonthExpense, setAddingMonthExpense] = useState(false)
	const [expensesView, setExpensesView] = useState<
		'ALL' | 'RENT' | 'UTILITIES' | 'OTHER' | 'SALARY'
	>('ALL')
	const [analyticsPeriod, setAnalyticsPeriod] = useState<'MONTH' | 'ALL_TIME'>('MONTH')
	const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
	const [deletingExpense, setDeletingExpense] = useState(false)
	const [formError, setFormError] = useState('')
	const [monthlyRentAmount, setMonthlyRentAmount] = useState(0)
	const [activeTab, setActiveTab] = useState<
		'ARCHIVE' | 'EXPENSES' | 'ANALYTICS'
	>(() => {
		if (pathname.endsWith('/expenses')) return 'EXPENSES'
		if (pathname.endsWith('/analytics')) return 'ANALYTICS'
		return 'ARCHIVE'
	})
	const [isRentModalOpen, setIsRentModalOpen] = useState(false)

	useEffect(() => {
		if (pathname.endsWith('/expenses')) setActiveTab('EXPENSES')
		else if (pathname.endsWith('/analytics')) setActiveTab('ANALYTICS')
		else setActiveTab('ARCHIVE')
	}, [pathname])

	const loadArchiveData = () =>
		Promise.all([
			fetch('/api/admin/shifts').then((res) => res.json()),
			fetch('/api/admin/transactions').then((res) => res.json()),
			fetch('/api/admin/expenses?archive=true').then((res) => res.json())
		])
			.then(([shiftsData, transactionsData, expensesData]) => {
				const sortedShifts = (
					Array.isArray(shiftsData.data) ? shiftsData.data : []
				).sort(
					(a: any, b: any) =>
						new Date(b.closedAt || '').getTime() -
						new Date(a.closedAt || '').getTime()
				)
				setShifts(sortedShifts)
				setTransactions(
					Array.isArray(transactionsData.data) ? transactionsData.data : []
				)
				setExpenses(Array.isArray(expensesData.data) ? expensesData.data : [])
				setMonthlyRentAmount(
					typeof expensesData.rentAmount === 'number' &&
						Number.isFinite(expensesData.rentAmount)
						? expensesData.rentAmount
						: 0
				)
				if (!selectedMonth && sortedShifts.length > 0 && sortedShifts[0].closedAt) {
					const firstMonth = new Date(sortedShifts[0].closedAt)
					setSelectedMonth(formatMonthKey(firstMonth))
				}
			})
			.catch((err) => console.error('Error loading data:', err))

	useEffect(() => {
		loadArchiveData().finally(() => setIsLoading(false))
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

	const formatMoney = (value: number | null) => {
		if (value === null) return '—'
		return formatCurrency(value)
	}

	const calculateDifference = (
		cashStart: number | null,
		cashEnd: number | null
	) => {
		if (cashStart === null || cashEnd === null) return null
		return cashEnd - cashStart
	}

	const monthStats = useMemo(() => {
		if (!selectedMonth) return null

		const monthShifts = shiftsByMonth[selectedMonth] || []
		const isInSelectedMonth = (dateString: string) =>
			formatMonthKey(new Date(dateString)) === selectedMonth

		// IMPORTANT:
		// Transactions are grouped by their own createdAt month (calendar month),
		// not by shift closedAt month. Otherwise end-of-month shifts are counted
		// into the next month and month analytics become inconsistent.
		const monthTransactions = transactions.filter((t) =>
			isInSelectedMonth(t.createdAt)
		)
		const monthExpenses = expenses.filter((e) =>
			isInSelectedMonth(e.createdAt)
		)

		const totalCashIncome = monthTransactions
			.filter((t) => t.paymentMethod === 'CASH')
			.reduce((sum, t) => sum + t.amount, 0)
		const totalCardIncome = monthTransactions
			.filter((t) => t.paymentMethod === 'CARD')
			.reduce((sum, t) => sum + t.amount, 0)

		const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
		const totalIncome = totalCashIncome + totalCardIncome

		const totalBarberIncome = monthTransactions.reduce((sum, t) => {
			const amount = typeof t.barberAmount === 'number' ? t.barberAmount : (t.serviceType !== 'COSMETICS' ? t.amount : 0)
			return sum + amount
		}, 0)
		const totalCosmeticsIncome = monthTransactions.reduce((sum, t) => {
			const amount = typeof t.cosmeticsAmount === 'number' ? t.cosmeticsAmount : (t.serviceType === 'COSMETICS' ? t.amount : 0)
			return sum + amount
		}, 0)

		// Day by day data for charts
		const dailyDataMap = new Map<string, { date: string, income: number, expenses: number }>()

		// Income days
		monthTransactions.forEach(t => {
			const date = new Date(t.createdAt).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })
			const entry = dailyDataMap.get(date) || { date, income: 0, expenses: 0 }
			entry.income += t.amount
			dailyDataMap.set(date, entry)
		})

		// Expense days
		monthExpenses.forEach(e => {
			const date = new Date(e.createdAt).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })
			const entry = dailyDataMap.get(date) || { date, income: 0, expenses: 0 }
			entry.expenses += e.amount
			dailyDataMap.set(date, entry)
		})

		const dailyData = Array.from(dailyDataMap.values()).sort((a, b) => {
			const [da, ma] = a.date.split('.')
			const [db, mb] = b.date.split('.')
			return (Number(ma) === Number(mb)) ? (Number(da) - Number(db)) : (Number(ma) - Number(mb))
		})

		// Статистика по працівниках
		const userStatsMap = new Map<number, any>()
		monthTransactions.forEach((t) => {
			const existing = userStatsMap.get(t.userId) || {
				id: t.userId,
				name: t.user.name || t.user.login,
				transactions: 0,
				amount: 0,
				barber: 0,
				cosmetics: 0
			}
			userStatsMap.set(t.userId, {
				...existing,
				transactions: existing.transactions + 1,
				amount: existing.amount + t.amount,
				barber: existing.barber + (typeof t.barberAmount === 'number' ? t.barberAmount : (t.serviceType !== 'COSMETICS' ? t.amount : 0)),
				cosmetics: existing.cosmetics + (typeof t.cosmeticsAmount === 'number' ? t.cosmeticsAmount : (t.serviceType === 'COSMETICS' ? t.amount : 0))
			})
		})

		return {
			shifts: monthShifts.length,
			totalIncome,
			totalCashIncome,
			totalCardIncome,
			totalBarberIncome,
			totalCosmeticsIncome,
			totalExpenses,
			profit: totalIncome - totalExpenses,
			transactionsCount: monthTransactions.length,
			userStats: Array.from(userStatsMap.values()).sort((a, b) => b.amount - a.amount),
			dailyData
		}
	}, [selectedMonth, shifts, transactions, expenses, shiftsByMonth])

	const allTimeStats = useMemo(() => {
		if (transactions.length === 0 && expenses.length === 0) return null

		const totalCashIncome = transactions
			.filter((t) => t.paymentMethod === 'CASH')
			.reduce((sum, t) => sum + t.amount, 0)
		const totalCardIncome = transactions
			.filter((t) => t.paymentMethod === 'CARD')
			.reduce((sum, t) => sum + t.amount, 0)

		const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
		const totalIncome = totalCashIncome + totalCardIncome

		const totalBarberIncome = transactions.reduce((sum, t) => {
			const amount = typeof t.barberAmount === 'number' ? t.barberAmount : (t.serviceType !== 'COSMETICS' ? t.amount : 0)
			return sum + amount
		}, 0)
		const totalCosmeticsIncome = transactions.reduce((sum, t) => {
			const amount = typeof t.cosmeticsAmount === 'number' ? t.cosmeticsAmount : (t.serviceType === 'COSMETICS' ? t.amount : 0)
			return sum + amount
		}, 0)

		// Month by month data for charts
		const monthlyDataMap = new Map<string, { date: string, income: number, expenses: number }>()

		// Income months
		transactions.forEach(t => {
			// e.g. "03.2024"
			const date = new Date(t.createdAt).toLocaleDateString('uk-UA', { month: '2-digit', year: 'numeric' })
			const entry = monthlyDataMap.get(date) || { date, income: 0, expenses: 0 }
			entry.income += t.amount
			monthlyDataMap.set(date, entry)
		})

		// Expense months
		expenses.forEach(e => {
			const date = new Date(e.createdAt).toLocaleDateString('uk-UA', { month: '2-digit', year: 'numeric' })
			const entry = monthlyDataMap.get(date) || { date, income: 0, expenses: 0 }
			entry.expenses += e.amount
			monthlyDataMap.set(date, entry)
		})

		const monthlyData = Array.from(monthlyDataMap.values()).sort((a, b) => {
			const [ma, ya] = a.date.split('.')
			const [mb, yb] = b.date.split('.')
			return (Number(ya) === Number(yb)) ? (Number(ma) - Number(mb)) : (Number(ya) - Number(yb))
		})

		const userStatsMap = new Map<number, { name: string; amount: number; barber: number; cosmetics: number; transactions: number }>()
		transactions.forEach((t) => {
			if (!t.user) return

			const existing = userStatsMap.get(t.user.id) || {
				name: t.user.name,
				amount: 0,
				transactions: 0,
				barber: 0,
				cosmetics: 0
			}

			userStatsMap.set(t.user.id, {
				...existing,
				transactions: existing.transactions + 1,
				amount: existing.amount + t.amount,
				barber: existing.barber + (typeof t.barberAmount === 'number' ? t.barberAmount : (t.serviceType !== 'COSMETICS' ? t.amount : 0)),
				cosmetics: existing.cosmetics + (typeof t.cosmeticsAmount === 'number' ? t.cosmeticsAmount : (t.serviceType === 'COSMETICS' ? t.amount : 0))
			})
		})

		return {
			shifts: shifts.length,
			totalIncome,
			totalCashIncome,
			totalCardIncome,
			totalBarberIncome,
			totalCosmeticsIncome,
			totalExpenses,
			profit: totalIncome - totalExpenses,
			transactionsCount: transactions.length,
			dailyData: monthlyData, // Reusing the same prop name for compatibility with charts
			userStats: Array.from(userStatsMap.values()).sort((a, b) => b.amount - a.amount)
		}
	}, [shifts, transactions, expenses])

	const selectedMonthExpenses = useMemo(() => {
		if (!selectedMonth) return []
		return expenses
			.filter((e) => formatMonthKey(new Date(e.createdAt)) === selectedMonth)
			.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)
	}, [selectedMonth, expenses])

	async function addMonthExpense() {
		setFormError('')
		const amount = Number(monthExpenseAmount)
		const comment = monthExpenseComment.trim()
		if (monthExpenseCategory !== 'RENT' && (!amount || amount <= 0)) {
			setFormError('Вкажіть коректну суму витрати')
			return
		}
		if (monthExpenseCategory !== 'RENT' && !comment) {
			setFormError('Додайте коментар до витрати')
			return
		}
		if (addingMonthExpense) return

		setAddingMonthExpense(true)
		try {
			const res = await fetch('/api/admin/expenses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					amount: monthExpenseCategory === 'RENT' ? undefined : amount,
					comment: monthExpenseCategory === 'RENT' ? 'Оренда' : comment,
					category: monthExpenseCategory
				})
			})

			if (!res.ok) {
				const json = await res.json().catch(() => ({}))
				setFormError(json?.message || 'Не вдалося додати витрату')
				return
			}

			setMonthExpenseAmount('')
			setMonthExpenseComment('')
			setMonthExpenseCategory('OTHER')
			await loadArchiveData()
		} finally {
			setAddingMonthExpense(false)
		}
	}

	async function confirmDeleteExpense() {
		if (!expenseToDelete || deletingExpense) return
		setDeletingExpense(true)
		try {
			await fetch(`/api/admin/expenses/${expenseToDelete.id}`, {
				method: 'DELETE'
			})
			setExpenseToDelete(null)
			await loadArchiveData()
		} finally {
			setDeletingExpense(false)
		}
	}

	if (isLoading) {
		return <PageLoader message="Завантаження архіву…" />
	}

	const hasData = shifts.length > 0
	const selectedMonthShifts = selectedMonth ? shiftsByMonth[selectedMonth] : undefined

	return (
		<main className="min-h-screen bg-slate-50 relative overflow-hidden">
			{/* Mesh Background Decorations */}
			<div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
			<div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

			<div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
				{/* ЗАГОЛОВОК */}
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
					<div className="space-y-3">
						<div className="inline-flex items-center gap-2.5 px-3 py-1 bg-slate-900/5 backdrop-blur-md rounded-full border border-slate-200 shadow-sm">
							<ShieldCheck size={14} className="text-slate-900" />
							<span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Архів та аналітика</span>
						</div>
						<h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight text-balance">
							Історія та звіти
						</h1>
						<div className="flex items-center gap-2 text-slate-500 font-bold">
							<CalendarDays size={18} className="text-slate-400" />
							<p>Всі закриті зміни та фінансові показники</p>
						</div>
					</div>

					<PageSubTabs
						className="mb-0"
						items={[
							{ key: 'ARCHIVE', label: 'Список змін' },
							{ key: 'EXPENSES', label: 'Витрати' },
							{ key: 'ANALYTICS', label: 'Аналітика' }
						]}
						activeKey={activeTab}
						onChange={(key) => {
							const tab = key as 'ARCHIVE' | 'EXPENSES' | 'ANALYTICS'
							const nextPath =
								tab === 'EXPENSES'
									? '/admin/shifts/expenses'
									: tab === 'ANALYTICS'
										? '/admin/shifts/analytics'
										: '/admin/shifts/archive'
							if (nextPath !== pathname) router.push(nextPath)
						}}
					/>
				</div>

				{!hasData ? (
					<div className="relative overflow-hidden rounded-[3rem] bg-white p-12 sm:p-20 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-200/60 flex flex-col items-center justify-center text-center group">
						<div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
						<div className="relative mb-8">
							<div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl">
								<Ban size={40} className="text-white" strokeWidth={2.5} />
							</div>
						</div>
						<h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
							Архів порожній
						</h3>
						<p className="text-slate-500 text-lg max-w-md leading-relaxed font-bold">
							Після закриття першої зміни тут з'являться всі записи та детальна аналітика.
						</p>
					</div>
				) : (
					<div className="space-y-10">
						{/* PERIOD SELECTOR / TOGGLE */}
						<div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/60 shadow-sm animate-in fade-in slide-in-from-top-5 duration-500">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-4">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-900">
										<ListChecks size={16} />
									</div>
									<h3 className="text-lg font-black text-slate-900">Оберіть період</h3>
								</div>

								{/* VIEW TOGGLE (Only in Analytics tab) */}
								{activeTab === 'ANALYTICS' && (
									<div className="inline-flex bg-slate-200/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
										<button
											onClick={() => setAnalyticsPeriod('MONTH')}
											className={`px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 ${analyticsPeriod === 'MONTH'
													? 'bg-white text-slate-900 shadow-sm scale-105'
													: 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
												}`}
										>
											По місяцях
										</button>
										<button
											onClick={() => setAnalyticsPeriod('ALL_TIME')}
											className={`px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 ${analyticsPeriod === 'ALL_TIME'
													? 'bg-slate-900 text-white shadow-md scale-105'
													: 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
												}`}
										>
											За весь час
										</button>
									</div>
								)}
							</div>

							{/* MONTH SELECTION GRID - Hidden when ALL_TIME is active in Analytics */}
							{(!(activeTab === 'ANALYTICS' && analyticsPeriod === 'ALL_TIME')) && (
								<div className="flex flex-wrap gap-3">
									{months.map((monthKey) => {
										const count = shiftsByMonth[monthKey].length
										const isActive = selectedMonth === monthKey
										return (
											<button
												key={monthKey}
												onClick={() => setSelectedMonth(monthKey)}
												className={`group relative flex flex-col items-center justify-center w-[150px] px-4 py-4 rounded-2xl border transition-all duration-300 ${isActive
														? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105'
														: 'bg-white/80 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
													}`}
											>
												<span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
													{monthKey.split('-')[0]}
												</span>
												<span className="text-lg font-black capitalize text-center">
													{new Date(parseInt(monthKey.split('-')[0]), parseInt(monthKey.split('-')[1]) - 1).toLocaleDateString('uk-UA', { month: 'long' })}
												</span>
												<div className={`mt-2 px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
													{count} {count % 10 === 1 && count !== 11 ? 'зміна' : 'змін'}
												</div>
											</button>
										)
									})}
								</div>
							)}
						</div>

						{activeTab === 'ARCHIVE' && selectedMonth && (
							<div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
								<div className="flex items-center justify-between px-2">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
											<History size={20} />
										</div>
										<h2 className="text-2xl font-black text-slate-900 tracking-tight">
											Зміни за {getMonthName(selectedMonth)}
										</h2>
									</div>
								</div>

								<div className="bg-white rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-200/60 overflow-hidden">
									<div className="overflow-x-auto">
										<table className="w-full">
											<thead>
												<tr className="bg-slate-800 border-b border-slate-700">
													<th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-200">ID</th>
													<th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-200">Період роботи</th>
													<th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-200">Старт</th>
													<th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-200">Кінець</th>
													<th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-200">Різниця</th>
													<th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-200">Дія</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-slate-50">
												{selectedMonthShifts?.map((shift) => {
													const diff = calculateDifference(shift.cashStart, shift.cashEnd)
													const isPos = diff !== null && diff >= 0
													return (
														<tr key={shift.id} className="group hover:bg-slate-50/50 transition-colors">
															<td className="px-6 py-5 text-sm font-black text-slate-400">#{shift.id}</td>
															<td className="px-6 py-5">
																<div className="flex flex-col">
																	<span className="text-sm font-black text-slate-900">{formatDate(shift.openedAt)}</span>
																	<span className="text-xs font-bold text-slate-400">{formatDate(shift.closedAt)}</span>
																</div>
															</td>
															<td className="px-6 py-5 text-right">
																<span className="text-sm font-bold text-slate-600">{formatMoney(shift.cashStart)}</span>
															</td>
															<td className="px-6 py-5 text-right">
																<span className="text-sm font-black text-slate-900">{formatMoney(shift.cashEnd)}</span>
															</td>
															<td className="px-6 py-5 text-right">
																{diff !== null && (
																	<span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-black ${isPos ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
																		{isPos ? '+' : ''}{formatMoney(diff)}
																	</span>
																)}
															</td>
															<td className="px-6 py-5 text-center">
																<a
																	href={`/admin/shifts/${shift.id}`}
																	className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-black transition-all duration-300"
																>
																	Деталі <ChevronRight size={14} />
																</a>
															</td>
														</tr>
													)
												})}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'EXPENSES' && selectedMonth && (
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
								<div className="space-y-6">
									<div className="flex items-center justify-between px-2">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
												<PlusCircle size={20} />
											</div>
											<h2 className="text-2xl font-black text-slate-900 tracking-tight">Нова витрата</h2>
										</div>
										<button
											onClick={() => setIsRentModalOpen(true)}
											className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black hover:bg-slate-50 transition-colors flex items-center gap-2"
										>
											<Building2 size={14} /> Налаштувати оренду
										</button>
									</div>

									<div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-slate-200/60">
										<div className="space-y-4">
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div className="space-y-1.5">
													<label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Категорія</label>
													<select
														value={monthExpenseCategory}
														onChange={(e) => setMonthExpenseCategory(e.target.value as 'RENT' | 'UTILITIES' | 'OTHER')}
														className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900"
													>
														<option value="OTHER">Інші витрати</option>
														<option value="UTILITIES">Комунальні</option>
														<option value="RENT">Оренда</option>
													</select>
												</div>
												<div className="space-y-1.5">
													<label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Сума</label>
													<input
														type="number"
														placeholder={monthExpenseCategory === 'RENT' ? formatCurrency(monthlyRentAmount) : '0'}
														value={monthExpenseAmount}
														onChange={(e) => setMonthExpenseAmount(e.target.value)}
														disabled={monthExpenseCategory === 'RENT'}
														className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 disabled:opacity-50"
													/>
												</div>
											</div>
											<div className="space-y-1.5">
												<label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Коментар</label>
												<input
													type="text"
													placeholder={monthExpenseCategory === 'RENT' ? 'Орендна плата' : 'Опис витрати'}
													value={monthExpenseComment}
													onChange={(e) => setMonthExpenseComment(e.target.value)}
													disabled={monthExpenseCategory === 'RENT'}
													className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-slate-900 disabled:opacity-50"
												/>
											</div>
											<button
												onClick={addMonthExpense}
												disabled={addingMonthExpense}
												className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-4 font-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
											>
												{addingMonthExpense ? <Loader2 className="animate-spin" /> : <TrendingDown size={20} />}
												Додати витрату за місяць
											</button>
											{formError && <p className="text-sm font-bold text-red-500 text-center">{formError}</p>}
										</div>
									</div>
								</div>

								<div className="space-y-6">
									<div className="flex items-center gap-3 px-2">
										<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
											<Receipt size={20} />
										</div>
										<h2 className="text-2xl font-black text-slate-900 tracking-tight">Історія витрат</h2>
									</div>

									<div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-slate-200/60 min-h-[400px]">
										<div className="flex flex-wrap gap-2 mb-8">
											{['ALL', 'SALARY', 'RENT', 'UTILITIES', 'OTHER'].map((v) => (
												<button
													key={v}
													onClick={() => setExpensesView(v as any)}
													className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${expensesView === v
														? 'bg-slate-900 text-white shadow-md'
														: 'bg-slate-50 text-slate-400 hover:bg-slate-100'
														}`}
												>
													{v === 'ALL' ? 'Усі' : v === 'SALARY' ? 'ЗП' : v === 'RENT' ? 'Оренда' : v === 'UTILITIES' ? 'Комунал' : 'Інше'}
												</button>
											))}
										</div>

										<div className="space-y-3">
											{selectedMonthExpenses
												.filter(e => expensesView === 'ALL' || getExpenseCategory(e) === expensesView)
												.map((expense) => {
													const cat = getExpenseCategory(expense)
													return (
														<div key={expense.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-slate-300 transition-all">
															<div className="flex items-center gap-4">
																<div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cat === 'SALARY' ? 'bg-emerald-50 text-emerald-600' :
																	cat === 'RENT' ? 'bg-blue-50 text-blue-600' :
																		cat === 'UTILITIES' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
																	}`}>
																	{cat === 'SALARY' ? <Coins size={20} /> :
																		cat === 'RENT' ? <Building2 size={20} /> :
																			cat === 'UTILITIES' ? <Zap size={20} /> : <Receipt size={20} />}
																</div>
																<div>
																	<p className="font-black text-slate-900 leading-tight">-{formatMoney(expense.amount)}</p>
																	<p className="text-xs font-bold text-slate-400 truncate max-w-[150px] sm:max-w-xs">{normalizeExpenseComment(expense.comment)}</p>
																	<p className="mt-1 text-[11px] font-bold text-slate-400">
																		{new Date(expense.createdAt).toLocaleString('uk-UA', {
																			day: '2-digit',
																			month: '2-digit',
																			hour: '2-digit',
																			minute: '2-digit'
																		})}
																	</p>
																</div>
															</div>
															<button
																onClick={() => setExpenseToDelete(expense)}
																className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
															>
																<Trash2 size={18} />
															</button>
														</div>
													)
												})
											}
										</div>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'ANALYTICS' && (
							<div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
								{/* RENDER STATS BASED ON PERIOD */}
								{((analyticsPeriod === 'MONTH' && monthStats) || (analyticsPeriod === 'ALL_TIME' && allTimeStats)) && (() => {
									const activeStats = (analyticsPeriod === 'MONTH' ? monthStats : allTimeStats)!

									return (
										<>
											{/* STAT CARDS */}
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
												{[
													{ label: 'Загальний дохід', value: activeStats.totalIncome, icon: TrendingUp, color: 'emerald' },
													{ label: 'Усі витрати', value: activeStats.totalExpenses, icon: TrendingDown, color: 'red' },
													{ label: 'Чистий прибуток', value: activeStats.profit, icon: Coins, color: 'blue' },
													{ label: 'Транзакцій', value: activeStats.transactionsCount, icon: History, color: 'slate', isMoney: false },
												].map((stat, i) => (
													<div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group">
														<div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150`} />
														<div className="relative">
															<div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 mb-6 shadow-sm border border-${stat.color}-100/50`}>
																<stat.icon size={22} />
															</div>
															<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
															<p className="text-3xl font-black text-slate-900 tracking-tight">
																{stat.isMoney === false ? stat.value : formatMoney(stat.value)}
															</p>
														</div>
													</div>
												))}
											</div>

											{/* CHARTS GRID */}
											<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
												{/* LINE CHART - DAILY/MONTHLY INCOME */}
												<div className="lg:col-span-2 bg-white rounded-[3rem] p-8 border border-slate-200/60 shadow-sm flex flex-col h-[460px]">
													<div className="flex items-center justify-between mb-8 px-2">
														<div className="flex items-center gap-3">
															<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
																<TrendingUp size={20} />
															</div>
															<h3 className="text-xl font-black text-slate-900 tracking-tight">Динаміка доходу</h3>
														</div>
														<div className="flex items-center gap-4">
															<div className="flex items-center gap-2">
																<div className="w-3 h-3 rounded-full bg-indigo-500"></div>
																<span className="text-[10px] font-black uppercase text-slate-400">Дохід</span>
															</div>
															<div className="flex items-center gap-2">
																<div className="w-3 h-3 rounded-full bg-rose-400"></div>
																<span className="text-[10px] font-black uppercase text-slate-400">Витрати</span>
															</div>
														</div>
													</div>
													<div className="flex-1 min-h-0">
														<ResponsiveContainer width="100%" height="100%">
															<AreaChart data={activeStats.dailyData}>
																<defs>
																	<linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
																		<stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
																		<stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
																	</linearGradient>
																</defs>
																<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
																<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
																<YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} tickFormatter={v => `${v / 1000}k`} />
																<Tooltip
																	contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
																	formatter={(v: any) => formatMoney(v)}
																/>
																<Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
																<Area type="monotone" dataKey="expenses" stroke="#fb7185" strokeWidth={2} fillOpacity={0} />
															</AreaChart>
														</ResponsiveContainer>
													</div>
												</div>

												{/* PIE CHART - SERVICE TYPE BREAKDOWN */}
												<div className="bg-white rounded-[3rem] p-8 border border-slate-200/60 shadow-sm flex flex-col h-[460px]">
													<div className="flex items-center gap-3 px-2">
														<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
															<Package size={20} />
														</div>
														<h3 className="text-xl font-black text-slate-900 tracking-tight">Розподіл послуг</h3>
													</div>
													<div className="flex-1 min-h-0 flex flex-col">
														<div className="min-h-[260px] flex-1">
															<ResponsiveContainer width="100%" height="100%">
																<PieChart>
																	<Pie
																		data={[
																			{ name: 'Барбер', value: activeStats.totalBarberIncome },
																			{ name: 'Косметика', value: activeStats.totalCosmeticsIncome }
																		]}
																		innerRadius={70}
																		outerRadius={100}
																		paddingAngle={10}
																		dataKey="value"
																		stroke="none"
																	>
																		<Cell fill="#6366f1" />
																		<Cell fill="#06b6d4" />
																	</Pie>
																	<Tooltip />
																</PieChart>
															</ResponsiveContainer>
														</div>
														<div className="pt-4 flex flex-col gap-3">
															<div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl">
																<div className="flex items-center gap-2">
																	<div className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></div>
																	<span className="text-xs font-black text-slate-600">Барбер</span>
																</div>
																<span className="text-xs font-black text-slate-900">{formatMoney(activeStats.totalBarberIncome)}</span>
															</div>
															<div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl">
																<div className="flex items-center gap-2">
																	<div className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></div>
																	<span className="text-xs font-black text-slate-600">Косметика</span>
																</div>
																<span className="text-xs font-black text-slate-900">{formatMoney(activeStats.totalCosmeticsIncome)}</span>
															</div>
														</div>
													</div>
												</div>
											</div>

											{/* LINE CHART - DAILY/MONTHLY PROFIT */}
											<div className="bg-white rounded-[3rem] p-8 border border-slate-200/60 shadow-sm flex flex-col h-[460px]">
												<div className="flex items-center justify-between mb-8 px-2">
													<div className="flex items-center gap-3">
														<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
															<Coins size={20} />
														</div>
														<h3 className="text-xl font-black text-slate-900 tracking-tight">Динаміка прибутку</h3>
													</div>
													<span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
														{analyticsPeriod === 'ALL_TIME' ? 'Місяць до місяця' : 'День за днем'}
													</span>
												</div>
												<div className="flex-1 min-h-0">
													<ResponsiveContainer width="100%" height="100%">
														<LineChart
															data={activeStats.dailyData.map((d: { date: string; income: number; expenses: number }) => ({
																...d,
																profit: d.income - d.expenses
															}))}
														>
															<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
															<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
															<YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
															<Tooltip
																contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
																formatter={(v: any) => formatMoney(Number(v) || 0)}
															/>
															<Line
																type="monotone"
																dataKey="profit"
																stroke="#0f172a"
																strokeWidth={3}
																dot={{ r: 3, fill: '#0f172a' }}
																activeDot={{ r: 5 }}
															/>
														</LineChart>
													</ResponsiveContainer>
												</div>
											</div>

											{/* STAFF PERFORMANCE BAR CHART */}
											{(activeStats.userStats && activeStats.userStats.length > 0) && (
												<div className="bg-white rounded-[3rem] p-8 border border-slate-200/60 shadow-sm flex flex-col h-[500px]">
													<div className="flex items-center gap-3 mb-10 px-2">
														<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
															<LayoutDashboard size={20} />
														</div>
														<h3 className="text-xl font-black text-slate-900 tracking-tight">Топ продажів касирів</h3>
													</div>
													<div className="flex-1 min-h-0">
														<ResponsiveContainer width="100%" height="100%">
															<BarChart data={activeStats.userStats} layout="vertical" margin={{ left: 40, right: 40 }}>
																<CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
																<XAxis type="number" hide />
																<YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'black', fill: '#475569' }} />
																<Tooltip
																	cursor={{ fill: '#f8fafc' }}
																	contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
																	formatter={(v: any) => formatMoney(v)}
																/>
																<Bar dataKey="amount" radius={[0, 10, 10, 0]} barSize={24}>
																	{activeStats.userStats.map((entry: any, index: number) => (
																		<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
																	))}
																</Bar>
															</BarChart>
														</ResponsiveContainer>
													</div>
												</div>
											)}
										</>
									)
								})()}
							</div>
						)}
					</div>
				)}

				<ConfirmModal
					isOpen={!!expenseToDelete}
					title="Видалити витрату?"
					description="Цю дію неможливо скасувати. Витрата буде назавжди видалена з бази даних."
					confirmText="Так, видалити"
					tone="danger"
					onConfirm={confirmDeleteExpense}
					onClose={() => setExpenseToDelete(null)}
					isLoading={deletingExpense}
				/>

				<RentEditModal
					isOpen={isRentModalOpen}
					onClose={() => setIsRentModalOpen(false)}
					initialRentAmount={monthlyRentAmount}
					onSaved={() => {
						setIsRentModalOpen(false)
						loadArchiveData()
					}}
				/>
			</div>
		</main>
	)
}
