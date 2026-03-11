'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
	ShieldCheck,
	CalendarDays,
	TrendingUp,
	TrendingDown,
	Coins,
	CreditCard,
	History,
	Receipt,
	Scissors,
	Package,
	LayoutDashboard,
	ArrowLeft,
	ChevronRight,
	Zap,
	Info
} from 'lucide-react'
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip
} from 'recharts'
import { formatCurrency } from '@/lib/currency'
import PageLoader from '@/components/PageLoader'

type Transaction = {
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
	createdAt: string
	user: {
		id: number
		name: string
	}
}

type Expense = {
	amount: number
	comment?: string
	category?: 'RENT' | 'UTILITIES' | 'SALARY' | 'OTHER'
	createdAt: string
}

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

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

	const stats = useMemo(() => {
		if (!data) return null

		const transactions: Transaction[] = data.transactions ?? []
		const expenses: Expense[] = data.expenses ?? []

		const getBarberAmount = (t: Transaction) =>
			typeof t.barberAmount === 'number' ? t.barberAmount : (t.serviceType === 'COSMETICS' ? 0 : t.amount)

		const getCosmeticsAmount = (t: Transaction) =>
			typeof t.cosmeticsAmount === 'number' ? t.cosmeticsAmount : (t.serviceType === 'COSMETICS' ? t.amount : 0)

		const cashIncome = transactions.filter(t => t.paymentMethod === 'CASH').reduce((sum, t) => sum + t.amount, 0)
		const cardIncome = transactions.filter(t => t.paymentMethod === 'CARD').reduce((sum, t) => sum + t.amount, 0)
		const barberIncome = transactions.reduce((sum, t) => sum + getBarberAmount(t), 0)
		const cosmeticsIncome = transactions.reduce((sum, t) => sum + getCosmeticsAmount(t), 0)
		const totalDiscounts = transactions.reduce((sum, t) => sum + (t.discount || 0), 0)
		const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
		const totalIncome = cashIncome + cardIncome

		const pieData = [
			{ name: 'Барбер', value: barberIncome },
			{ name: 'Косметика', value: cosmeticsIncome }
		].filter(d => d.value > 0)

		return {
			cashIncome,
			cardIncome,
			barberIncome,
			cosmeticsIncome,
			totalDiscounts,
			totalExpenses,
			totalIncome,
			profit: totalIncome - totalExpenses,
			pieData
		}
	}, [data])

	const personalSales = useMemo(() => {
		const transactions: Transaction[] = data?.transactions ?? []
		const salesMap = new Map<number, any>()

		transactions.forEach((t) => {
			const userId = t.user?.id
			if (!userId) return

			const existing = salesMap.get(userId) || {
				userId,
				name: t.user?.name || `Касир #${userId}`,
				total: 0,
				count: 0,
				cash: 0,
				card: 0,
				barber: 0,
				cosmetics: 0,
				discounts: 0
			}

			existing.total += t.amount
			existing.count += 1
			if (t.paymentMethod === 'CASH') existing.cash += t.amount
			if (t.paymentMethod === 'CARD') existing.card += t.amount

			const bAmt = typeof t.barberAmount === 'number' ? t.barberAmount : (t.serviceType === 'COSMETICS' ? 0 : t.amount)
			const cAmt = typeof t.cosmeticsAmount === 'number' ? t.cosmeticsAmount : (t.serviceType === 'COSMETICS' ? t.amount : 0)

			existing.barber += bAmt
			existing.cosmetics += cAmt
			existing.discounts += (t.discount || 0)
			salesMap.set(userId, existing)
		})

		return Array.from(salesMap.values()).sort((a, b) => b.total - a.total)
	}, [data?.transactions])

	const formatDate = (dateString: string | null) => {
		if (!dateString) return '—'
		return new Date(dateString).toLocaleDateString('uk-UA', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const formatTime = (dateString: string) => {
		return new Date(dateString).toLocaleTimeString('uk-UA', {
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const formatMoney = (amount: number) => formatCurrency(amount)
	const formatReceiptItemName = (item: NonNullable<Transaction['items']>[number]) =>
		item.itemId ? `🧴 ${item.itemName}` : item.itemName

	if (error) {
		return (
			<main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
				<div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-red-100 text-center">
					<div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
						<Info size={40} />
					</div>
					<h2 className="text-2xl font-black text-slate-900 mb-2">Помилка</h2>
					<p className="text-slate-500 font-bold mb-8">{error}</p>
					<button
						onClick={() => router.back()}
						className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
					>
						Повернутися назад
					</button>
				</div>
			</main>
		)
	}

	if (!data || !stats) {
		return <PageLoader message="Завантаження деталей зміни…" />
	}

	return (
		<main className="min-h-screen bg-slate-50 relative overflow-hidden">
			{/* Mesh Background Decorations */}
			<div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
			<div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

			<div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
				{/* HEADER AND NAVIGATION */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
					<div className="space-y-3">
						<button
							onClick={() => router.back()}
							className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-colors mb-2"
						>
							<ArrowLeft size={14} /> Назад до архіву
						</button>
						<div className="flex items-center gap-3">
							<div className="inline-flex items-center gap-2.5 px-3 py-1 bg-slate-900/5 backdrop-blur-md rounded-full border border-slate-200 shadow-sm">
								<ShieldCheck size={14} className="text-slate-900" />
								<span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Деталі зміни</span>
							</div>
							<span className="text-slate-300 font-bold">#{data.shift.id}</span>
						</div>
						<h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight text-balance">
							Звіт за {new Date(data.shift.openedAt).toLocaleDateString('uk-UA', { day: '2-digit', month: 'long' })}
						</h1>
					</div>

					<div className="flex flex-col sm:flex-row gap-4">
						<div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white shadow-sm flex items-center gap-4">
							<div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
								<CalendarDays size={20} />
							</div>
							<div>
								<p className="text-[10px] font-black uppercase text-slate-400">Початок зміни</p>
								<p className="text-sm font-black text-slate-900">{formatTime(data.shift.openedAt)}</p>
							</div>
						</div>
						<div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white shadow-sm flex items-center gap-4">
							<div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
								<History size={20} />
							</div>
							<div>
								<p className="text-[10px] font-black uppercase text-slate-400">Закриття</p>
								<p className="text-sm font-black text-slate-900">{formatTime(data.shift.closedAt)}</p>
							</div>
						</div>
					</div>
				</div>

				{/* SUMMARY STATS GRID */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
					{[
						{ label: 'Каса на старт', value: data.shift.cashStart, icon: Coins, color: 'slate' },
						{ label: 'Загальний дохід', value: stats.totalIncome, icon: TrendingUp, color: 'emerald' },
						{ label: 'Усі витрати', value: stats.totalExpenses, icon: TrendingDown, color: 'red' },
						{ label: 'Чистий прибуток', value: stats.profit, icon: Zap, color: 'blue' },
					].map((stat, i) => (
						<div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group">
							<div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150`} />
							<div className="relative">
								<div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 mb-6 shadow-sm border border-${stat.color}-100/50`}>
									<stat.icon size={22} />
								</div>
								<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
								<p className="text-3xl font-black text-slate-900 tracking-tight">
									{formatMoney(stat.value)}
								</p>
							</div>
						</div>
					))}
				</div>

				{/* ANALYTICS AND SALES BREAKDOWN */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
					{/* PIE CHART - SERVICE BREAKDOWN */}
					<div className="bg-white rounded-[3rem] p-8 border border-slate-200/60 shadow-sm flex flex-col h-[450px]">
						<div className="flex items-center gap-3 mb-8 px-2">
							<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
								<Package size={20} />
							</div>
							<h3 className="text-xl font-black text-slate-900 tracking-tight">Розподіл послуг</h3>
						</div>
						<div className="flex-1 min-h-0 relative">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={stats.pieData}
										innerRadius={70}
										outerRadius={100}
										paddingAngle={10}
										dataKey="value"
										stroke="none"
									>
										{stats.pieData.map((_entry, index) => (
											<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>
									<Tooltip
										contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
										formatter={(v: any) => formatMoney(v)}
									/>
								</PieChart>
							</ResponsiveContainer>
							<div className="absolute inset-x-0 bottom-0 py-4 flex flex-col gap-3">
								<div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl">
									<div className="flex items-center gap-2">
										<div className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></div>
										<span className="text-xs font-black text-slate-600">Барбер</span>
									</div>
									<span className="text-xs font-black text-slate-900">{formatMoney(stats.barberIncome)}</span>
								</div>
								<div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl">
									<div className="flex items-center gap-2">
										<div className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></div>
										<span className="text-xs font-black text-slate-600">Косметика</span>
									</div>
									<span className="text-xs font-black text-slate-900">{formatMoney(stats.cosmeticsIncome)}</span>
								</div>
							</div>
						</div>
					</div>

					{/* STAFF PERFORMANCE */}
					<div className="lg:col-span-2 bg-white rounded-[3rem] p-8 border border-slate-200/60 shadow-sm flex flex-col">
						<div className="flex items-center gap-3 mb-8 px-2">
							<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
								<LayoutDashboard size={20} />
							</div>
							<h3 className="text-xl font-black text-slate-900 tracking-tight">Ефективність працівників</h3>
						</div>
						<div className="space-y-4">
							{personalSales.map((item, index) => (
								<div key={item.userId} className="group flex items-center justify-between p-5 bg-slate-50/50 hover:bg-white hover:shadow-md border border-slate-100 rounded-3xl transition-all duration-300">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center font-black text-slate-900">
											{index + 1}
										</div>
										<div>
											<p className="font-black text-slate-900 leading-tight">{item.name}</p>
											<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{item.count} послуг</p>
										</div>
									</div>
									<div className="text-right flex flex-col items-end">
										<div className="flex items-center gap-2 mb-1">
											<span className="text-xs font-black text-emerald-600">✂️ {formatMoney(item.barber)}</span>
											<span className="text-xs font-black text-violet-600">🧴 {formatMoney(item.cosmetics)}</span>
										</div>
										<p className="text-lg font-black text-slate-900">{formatMoney(item.total)}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* TRANSACTIONS TABLE */}
				<div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-sm overflow-hidden mb-10">
					<div className="p-8 border-b border-slate-100 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
								<Receipt size={20} />
							</div>
							<h3 className="text-xl font-black text-slate-900 tracking-tight">Деталізовані транзакції</h3>
						</div>
						<div className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
							{data.transactions.length} операцій
						</div>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="bg-slate-50/50">
									<th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Час</th>
									<th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Працівник</th>
									<th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Метод</th>
									<th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Послуги / Товари</th>
									<th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Сума</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{data.transactions.map((t: Transaction) => (
									<tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
										<td className="px-8 py-5">
											<span className="text-xs font-black text-slate-400">{formatTime(t.createdAt)}</span>
										</td>
										<td className="px-8 py-5 font-black text-slate-900">{t.user?.name ?? '—'}</td>
										<td className="px-8 py-5">
											<div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${t.paymentMethod === 'CASH' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
												}`}>
												{t.paymentMethod === 'CASH' ? <Coins size={12} /> : <CreditCard size={12} />}
												{t.paymentMethod === 'CASH' ? 'Готівка' : 'Карта'}
											</div>
										</td>
										<td className="px-8 py-5">
											<div className="flex flex-col gap-1">
												{(t.barberAmount ?? 0) > 0 && (
													<span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
														<Scissors size={12} className="text-slate-400" /> {formatMoney(t.barberAmount!)}
													</span>
												)}
												{(t.cosmeticsAmount ?? 0) > 0 && (
													<span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
														<Package size={12} className="text-slate-400" /> {formatMoney(t.cosmeticsAmount!)}
													</span>
												)}
												{t.items && t.items.length > 0 && (
													<div className="flex flex-wrap gap-1 mt-1">
														{t.items.map((item, idx) => (
															<span key={idx} className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md">
																{formatReceiptItemName(item)} ×{item.quantity}
															</span>
														))}
													</div>
												)}
												{(t.discount ?? 0) > 0 && (
													<span className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">
														🎁 Знижка: -{formatMoney(t.discount!)}
													</span>
												)}
											</div>
										</td>
										<td className="px-8 py-5 text-right font-black text-slate-900">{formatMoney(t.amount)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* EXPENSES LIST */}
				{data.expenses && data.expenses.length > 0 && (
					<div className="bg-white rounded-[3rem] p-8 border border-slate-200/60 shadow-sm mb-10">
						<div className="flex items-center gap-3 mb-8 px-2">
							<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
								<Receipt size={20} />
							</div>
							<h3 className="text-xl font-black text-slate-900 tracking-tight">Витрати зміни</h3>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{data.expenses.map((e: Expense, i: number) => (
								<div key={i} className="group p-5 bg-red-50/50 hover:bg-white hover:shadow-md border border-red-100/50 rounded-3xl transition-all duration-300 flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-red-500">
											<TrendingDown size={20} />
										</div>
										<div>
											<p className="font-black text-slate-900 leading-tight">{e.comment || 'Інші витрати'}</p>
											<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Витрата каси</p>
										</div>
									</div>
									<p className="text-lg font-black text-red-600">-{formatMoney(e.amount)}</p>
								</div>
							))}
						</div>
					</div>
				)}

				{/* FINAL BALANCE FOOTER */}
				<div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
					<div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
					<div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
						<div className="space-y-4 text-center md:text-left">
							<div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-300">
								<ShieldCheck size={12} /> Фінальний результат
							</div>
							<h3 className="text-4xl font-black tracking-tight">Каса на закриття</h3>
							<div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-400 font-bold">
								<span className="flex items-center gap-1.5"><Coins size={14} /> Старт: {formatMoney(data.shift.cashStart)}</span>
								<span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-400" /> Прихід (Готівка): {formatMoney(stats.cashIncome)}</span>
								<span className="flex items-center gap-1.5"><TrendingDown size={14} className="text-red-400" /> Витрати: {formatMoney(stats.totalExpenses)}</span>
							</div>
						</div>

						<div className="flex flex-col items-center md:items-end gap-2">
							<p className="text-6xl font-black tracking-tighter text-white">{formatMoney(data.shift.cashEnd)}</p>
							<div className="px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-3">
								<div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
								<span className="text-xs font-bold text-slate-300">Фактична касова різниця порахована</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
