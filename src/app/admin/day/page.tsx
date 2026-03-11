'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
	CalendarDays,
	History,
	Receipt,
	LayoutDashboard,
	ShieldCheck,
	Info,
	Ban,
	PlusCircle,
	TrendingUp,
	Scissors,
	Package,
	Gift,
	CircleDollarSign,
	CreditCard,
	Loader2,
	PieChart as PieChartIcon,
	Zap,
	TrendingDown,
	Coins,
	Activity,
	Lock
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import ShiftControl from '@/components/ShiftControl'
import AdminTable from '@/components/AdminTable'
import CashSummary from '@/components/CashSummary'
import ExpenseForm from '@/components/ExpenseForm'
import ExpensesList from '@/components/ExpensesList'
import PageSubTabs from '@/components/PageSubTabs'
import PageLoader from '@/components/PageLoader'
import { fetcher } from '@/lib/fetcher'
import { formatCurrency } from '@/lib/currency'

export default function AdminDayPage() {
	const pathname = usePathname()
	const router = useRouter()
	const { data, isLoading, mutate } = useSWR('/api/admin/day', fetcher)
	const COLORS = ['#6366f1', '#06b6d4']
	const resolveTabFromPath = (
		path: string
	): 'SHIFT_CASH' | 'SALES' | 'EXPENSES' => {
		if (path.endsWith('/sales')) return 'SALES'
		if (path.endsWith('/expenses')) return 'EXPENSES'
		return 'SHIFT_CASH'
	}
	const routeByTab: Record<'SHIFT_CASH' | 'SALES' | 'EXPENSES', string> = {
		SHIFT_CASH: '/admin/day/shift-cash',
		SALES: '/admin/day/sales',
		EXPENSES: '/admin/day/expenses'
	}
	const [activeTab, setActiveTab] = useState<
		'SHIFT_CASH' | 'SALES' | 'EXPENSES'
	>(resolveTabFromPath(pathname))

	useEffect(() => {
		setActiveTab(resolveTabFromPath(pathname))
	}, [pathname])

	const stats = useMemo(() => {
		if (!data?.transactions) return null

		const validTx = data.transactions.filter((t: any) => t.amount > 0)
		const totalIncome = validTx.reduce(
			(sum: number, t: any) => sum + t.amount,
			0
		)
		const totalExpenses = data.expenses
			? data.expenses.reduce(
				(sum: number, e: { amount: number }) => sum + e.amount,
				0
			)
			: 0
		const profit = totalIncome - totalExpenses

		const barberIncome = validTx.reduce(
			(sum: number, t: any) => sum + (t.barberAmount || 0),
			0
		)
		const cosmeticsIncome = validTx.reduce(
			(sum: number, t: any) => sum + (t.cosmeticsAmount || 0),
			0
		)

		const pieData = [
			{ name: 'Барбер', value: barberIncome },
			{ name: 'Косметика', value: cosmeticsIncome }
		].filter((d) => d.value > 0)

		const totalTransactions = validTx.length
		const averageTicket = totalTransactions > 0 ? totalIncome / totalTransactions : 0
		const totalItemsSold = validTx.reduce((sum: number, t: any) => sum + (t.items?.length > 0 ? t.items.length : 1), 0)
		const averageTicketLength = totalTransactions > 0 ? totalItemsSold / totalTransactions : 0
		const totalDiscounts = validTx.reduce((sum: number, t: any) => sum + (t.discount || 0), 0)

		return {
			totalIncome,
			totalExpenses,
			profit,
			barberIncome,
			cosmeticsIncome,
			pieData,
			totalTransactions,
			averageTicket,
			averageTicketLength,
			totalDiscounts
		}
	}, [data?.transactions, data?.expenses])

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
				discount: number
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
				cosmetics: 0,
				discount: 0
			}

			entry.total += t.amount
			entry.count += 1
			if (t.paymentMethod === 'CASH') entry.cash += t.amount
			if (t.paymentMethod === 'CARD') entry.card += t.amount
			const barberAmount =
				typeof t.barberAmount === 'number'
					? t.barberAmount
					: t.serviceType === 'COSMETICS'
						? 0
						: t.amount
			const cosmeticsAmount =
				typeof t.cosmeticsAmount === 'number'
					? t.cosmeticsAmount
					: t.serviceType === 'COSMETICS'
						? t.amount
						: 0
			entry.barber += barberAmount
			entry.cosmetics += cosmeticsAmount
			entry.discount += t.discount || 0
			salesMap.set(userId, entry)
		})

		return Array.from(salesMap.values()).sort((a, b) => b.total - a.total)
	}, [data?.transactions])

	if (isLoading) {
		return <PageLoader message="Завантаження робочого дня…" />
	}

	const shift = data?.shift

	return (
		<main className="min-h-screen bg-slate-50 relative overflow-hidden">
			{/* Mesh Background Decorations */}
			<div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
			<div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

			<div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
				{/* ЗАГОЛОВОК */}
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
					<div className="space-y-3">
						<div className="flex flex-wrap items-center gap-3">
							<div className="inline-flex items-center gap-2.5 px-3 py-1 bg-slate-900/5 backdrop-blur-md rounded-full border border-slate-200 shadow-sm">
								<ShieldCheck size={14} className="text-slate-900" />
								<span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
									Панель адміністратора
								</span>
							</div>

							{shift && (
								<div className="inline-flex items-center gap-2.5 px-3 py-1 bg-blue-50/50 backdrop-blur-md rounded-full border border-blue-200/50 shadow-sm">
									<div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
									<span className="text-[10px] font-black uppercase tracking-widest text-blue-700">
										Час відкриття: {new Date(shift.openedAt).toLocaleString('uk-UA', {
											day: '2-digit',
											month: '2-digit',
											hour: '2-digit',
											minute: '2-digit'
										})}
									</span>
								</div>
							)}
						</div>
						<h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight text-balance">
							Управління днем
						</h1>
						<div className="flex items-center gap-2 text-slate-500 font-bold">
							<CalendarDays size={18} className="text-slate-400" />
							<p className="capitalize">
								{new Date().toLocaleDateString('uk-UA', {
									weekday: 'long',
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</p>
						</div>
					</div>

					<PageSubTabs
						className="mb-0"
						items={[
							{ key: 'SHIFT_CASH', label: 'Каса та зміна' },
							{ key: 'SALES', label: 'Транзакції' },
							{ key: 'EXPENSES', label: 'Витрати' }
						]}
						activeKey={activeTab}
						onChange={(key) => {
							const nextTab = key as 'SHIFT_CASH' | 'SALES' | 'EXPENSES'
							const nextPath = routeByTab[nextTab]
							if (nextPath !== pathname) router.push(nextPath)
						}}
					/>
				</div>

				{activeTab === 'SHIFT_CASH' && (
					<div className="space-y-10">
						<ShiftControl onChange={mutate} />

						{!shift ? (
							<div className="relative overflow-hidden rounded-[3rem] bg-white p-12 sm:p-20 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-200/60 flex flex-col items-center justify-center text-center group">
								<div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
								<div className="relative mb-8">
									<div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-500">
										<Lock size={40} className="text-white" strokeWidth={2.5} />
									</div>
									<div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 rounded-2xl border-4 border-white shadow-lg"></div>
								</div>
								<h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
									Зміна закрита
								</h3>
								<p className="text-slate-500 text-lg max-w-md leading-relaxed font-bold">
									Щоб почати роботу та фіксувати транзакції, необхідно спочатку
									відкрити нову зміну.
								</p>
							</div>
						) : data.summary ? (
							<div className="space-y-6">
								<div className="flex items-center gap-3 px-2">
									<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
										<TrendingUp size={20} />
									</div>
									<h2 className="text-2xl font-black text-slate-900 tracking-tight">
										Фінансовий підсумок
									</h2>
								</div>
								<CashSummary summary={data.summary} />
							</div>
						) : (
							<div className="flex items-center justify-center py-20 text-slate-400">
								<Loader2 className="animate-spin mr-3" />
								<span className="font-black uppercase tracking-widest text-sm">
									Оновлення даних…
								</span>
							</div>
						)}
					</div>
				)}

				{activeTab === 'SALES' && (
					!shift ? (
						<div className="relative overflow-hidden rounded-[3rem] bg-white p-12 sm:p-20 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-200/60 flex flex-col items-center justify-center text-center group">
							<div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white pointer-events-none" />
							<div className="relative mb-8">
								<div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
									<Ban size={40} className="text-slate-300" strokeWidth={2.5} />
								</div>
							</div>
							<h3 className="relative text-3xl font-black text-slate-900 mb-4 tracking-tight">
								Статистика недоступна
							</h3>
							<p className="relative text-slate-500 text-lg max-w-md leading-relaxed font-bold">
								Транзакції відображаються тільки під час відкритої зміни.
							</p>
						</div>
					) : (
						<div className="space-y-12">
							{/* SUMMARY STATS GRID */}
							{stats && (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 mb-10">
									{[
										{
											label: 'Каса на старт',
											value: shift.cashStart || 0,
											icon: Coins,
											color: 'slate'
										},
										{
											label: 'Загальний дохід',
											value: stats.totalIncome,
											icon: TrendingUp,
											color: 'emerald'
										},
										{
											label: 'Усі витрати',
											value: stats.totalExpenses,
											icon: TrendingDown,
											color: 'red'
										},
										{
											label: 'Чистий прибуток',
											value: stats.profit,
											icon: Zap,
											color: 'blue'
										}
									].map((stat, i) => (
										<div
											key={i}
											className="bg-white rounded-[2.5rem] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group"
										>
											<div
												className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150`}
											/>
											<div className="relative">
												<div
													className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 mb-6 shadow-sm border border-${stat.color}-100/50`}
												>
													<stat.icon size={22} />
												</div>
												<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
													{stat.label}
												</p>
												<p className="text-3xl font-black text-slate-900 tracking-tight">
													{formatCurrency(stat.value)}
												</p>
											</div>
										</div>
									))}
								</div>
							)}

							<div className="space-y-6">
								<div className="flex items-center gap-3 px-2">
									<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
										<History size={20} />
									</div>
									<h2 className="text-2xl font-black text-slate-900 tracking-tight">
										Останні транзакції
									</h2>
								</div>
								<AdminTable
									transactions={data?.transactions ?? []}
									isLoading={isLoading}
								/>
							</div>

							{/* ANALYTICS AND SALES BREAKDOWN */}
							{stats && (
								<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
									{/* PIE CHART - SERVICE BREAKDOWN */}
									<div className="bg-white rounded-[3rem] p-8 border border-slate-200/60 shadow-sm flex flex-col h-[460px]">
										<div className="flex items-center gap-3 px-2">
											<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
												<PieChartIcon size={20} />
											</div>
											<h3 className="text-xl font-black text-slate-900 tracking-tight">
												Розподіл послуг
											</h3>
										</div>
										<div className="flex-1 min-h-0 flex flex-col">
											<div className="min-h-[260px] flex-1">
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
															{stats.pieData.map(
																(_entry: any, index: number) => (
																	<Cell
																		key={`cell-${index}`}
																		fill={COLORS[index % COLORS.length]}
																	/>
																)
															)}
														</Pie>
														<Tooltip
															contentStyle={{
																borderRadius: '20px',
																border: 'none',
																boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
																fontWeight: 'bold'
															}}
															formatter={(v: any) => formatCurrency(v)}
														/>
													</PieChart>
												</ResponsiveContainer>
											</div>
											<div className="pt-4 flex flex-col gap-3">
												<div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl">
													<div className="flex items-center gap-2">
														<div className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></div>
														<span className="text-xs font-black text-slate-600">
															Барбер
														</span>
													</div>
													<span className="text-xs font-black text-slate-900">
														{formatCurrency(stats.barberIncome)}
													</span>
												</div>
												<div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl">
													<div className="flex items-center gap-2">
														<div className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></div>
														<span className="text-xs font-black text-slate-600">
															Косметика
														</span>
													</div>
													<span className="text-xs font-black text-slate-900">
														{formatCurrency(stats.cosmeticsIncome)}
													</span>
												</div>
											</div>
										</div>
									</div>

									{/* DETAILED STATS AND PAYMENT METHODS */}
									<div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
										{/* DETAILED STATS */}
										<div className="bg-white rounded-[3rem] p-8 border border-slate-200/60 shadow-sm flex flex-col justify-between relative overflow-hidden group h-[460px]">
											<div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 pointer-events-none" />
											<div>
												<div className="flex items-center gap-3 mb-8 px-2 relative">
													<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
														<Activity className="w-5 h-5" />
													</div>
													<h3 className="text-xl font-black text-slate-900 tracking-tight">Детальна статистика</h3>
												</div>

												<div className="space-y-4 relative">
													<div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
														<div className="flex items-center gap-3">
															<div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
																<Receipt className="w-4 h-4" />
															</div>
															<span className="font-bold text-slate-600">Кількість переказів</span>
														</div>
														<span className="text-xl font-black text-slate-900">{stats.totalTransactions}</span>
													</div>

													<div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
														<div className="flex items-center gap-3">
															<div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
																<TrendingUp className="w-4 h-4" />
															</div>
															<span className="font-bold text-slate-600">Середній чек</span>
														</div>
														<span className="text-xl font-black text-slate-900">{formatCurrency(stats.averageTicket)}</span>
													</div>

													<div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
														<div className="flex items-center gap-3">
															<div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
																<Package className="w-4 h-4" />
															</div>
															<span className="font-bold text-slate-600">Середня довжина</span>
														</div>
														<span className="text-xl font-black text-slate-900">{stats.averageTicketLength.toFixed(1)}</span>
													</div>

													<div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
														<div className="flex items-center gap-3">
															<div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
																<Gift className="w-4 h-4" />
															</div>
															<span className="font-bold text-slate-600">Надано знижок</span>
														</div>
														<span className="text-xl font-black text-emerald-600">{formatCurrency(stats.totalDiscounts)}</span>
													</div>
												</div>
											</div>
										</div>

										{/* PAYMENT METHODS (DARK CARD) */}
										<div className="bg-slate-900 rounded-[3rem] p-8 border border-slate-800 shadow-lg flex flex-col justify-between relative overflow-hidden group h-[460px]">
											<div className="absolute top-0 right-0 w-32 h-32 bg-slate-800 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 pointer-events-none" />
											<div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none" />
											<div>
												<div className="flex items-center gap-3 mb-8 px-2 relative">
													<div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-center text-white">
														<CreditCard className="w-5 h-5" />
													</div>
													<h3 className="text-xl font-black text-white tracking-tight">Методи оплати</h3>
												</div>

												<div className="space-y-4 relative">
													{/* Card Payment */}
													<div className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
														<div className="flex items-center justify-between mb-3">
															<div className="flex items-center gap-2 text-blue-400">
																<CreditCard className="w-4 h-4" />
																<span className="text-[10px] font-black uppercase tracking-widest">Картка</span>
															</div>
															<span className="text-xl font-black text-white">{formatCurrency(data.summary?.cardIncome || 0)}</span>
														</div>
														{/* Progress bar */}
														<div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
															<div
																className="h-full bg-blue-500 rounded-full transition-all duration-1000"
																style={{ width: `${stats.totalIncome > 0 ? ((data.summary?.cardIncome || 0) / stats.totalIncome) * 100 : 0}%` }}
															/>
														</div>
													</div>

													{/* Cash Payment */}
													<div className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
														<div className="flex items-center justify-between mb-3">
															<div className="flex items-center gap-2 text-emerald-400">
																<Coins className="w-4 h-4" />
																<span className="text-[10px] font-black uppercase tracking-widest">Готівка</span>
															</div>
															<span className="text-xl font-black text-white">{formatCurrency(data.summary?.cashIncome || 0)}</span>
														</div>
														{/* Progress bar */}
														<div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
															<div
																className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
																style={{ width: `${stats.totalIncome > 0 ? ((data.summary?.cashIncome || 0) / stats.totalIncome) * 100 : 0}%` }}
															/>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* --- OLD SALES BLOCK FOR COMPARISON --- */}
							<div className="space-y-6">
								<div className="flex items-center gap-3 px-2">
									<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
										<LayoutDashboard size={20} />
									</div>
									<h2 className="text-2xl font-black text-slate-900 tracking-tight">
										Продажі касирів
									</h2>
								</div>
								{personalSales.length === 0 ? (
									<div className="bg-white rounded-[2.5rem] p-10 border border-slate-200/60 text-center">
										<p className="text-slate-400 font-bold">
											Ще немає продажів у поточному періоді.
										</p>
									</div>
								) : (
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
										{personalSales.map((item) => (
											<div
												key={item.userId}
												className="group relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200/60 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
											>
												<div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
												<div className="relative flex items-start justify-between mb-8">
													<div>
														<h4 className="text-xl font-black text-slate-900 leading-tight mb-1">
															{item.name}
														</h4>
														<div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-900/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">
															<Receipt size={12} /> {item.count} закритих чеків
														</div>
													</div>
													<p className="text-2xl font-black text-slate-900 tracking-tight">
														{formatCurrency(item.total)}
													</p>
												</div>

												<div className="mt-auto space-y-4">
													<div className="grid grid-cols-2 gap-3">
														<div className="rounded-2xl bg-emerald-50/50 border border-emerald-100/50 p-3">
															<p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Готівка</p>
															<p className="font-black text-emerald-700">{formatCurrency(item.cash)}</p>
														</div>
														<div className="rounded-2xl bg-blue-50/50 border border-blue-100/50 p-3">
															<p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Карта</p>
															<p className="font-black text-blue-700">{formatCurrency(item.card)}</p>
														</div>
													</div>

													<div className="pt-4 border-t border-slate-100 space-y-2">
														<div className="flex items-center justify-between text-xs font-bold">
															<span className="flex items-center gap-2 text-slate-400"><Scissors size={14} /> Послуги</span>
															<span className="text-slate-900">{formatCurrency(item.barber)}</span>
														</div>
														<div className="flex items-center justify-between text-xs font-bold">
															<span className="flex items-center gap-2 text-slate-400"><Package size={14} /> Товари</span>
															<span className="text-slate-900">{formatCurrency(item.cosmetics)}</span>
														</div>
														{item.discount > 0 && (
															<div className="flex items-center justify-between text-xs font-bold">
																<span className="flex items-center gap-2 text-red-400"><Gift size={14} /> Знижки</span>
																<span className="text-red-500">−{formatCurrency(item.discount)}</span>
															</div>
														)}
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
							{/* --- END OLD SALES BLOCK --- */}
						</div>
					))}

				{activeTab === 'EXPENSES' && (
					!shift ? (
						<div className="relative overflow-hidden rounded-[3rem] bg-white p-12 sm:p-20 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-200/60 flex flex-col items-center justify-center text-center group">
							<div className="absolute inset-0 bg-slate-50/50 pointer-events-none" />
							<div className="relative mb-8">
								<div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
									<Ban size={40} className="text-slate-200" strokeWidth={2.5} />
								</div>
							</div>
							<h3 className="relative text-3xl font-black text-slate-900 mb-4 tracking-tight">
								Витрати призупинено
							</h3>
							<p className="relative text-slate-500 text-lg max-w-md leading-relaxed font-bold">
								Для фіксації витрат необхідно відкрити робочу зміну.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
							<div className="space-y-6">
								<div className="flex items-center gap-3 px-2">
									<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
										<PlusCircle size={20} />
									</div>
									<h2 className="text-2xl font-black text-slate-900 tracking-tight">
										Нова витрата
									</h2>
								</div>
								<div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-slate-200/60">
									<ExpenseForm onAdded={mutate} />
								</div>
							</div>

							<div className="space-y-6">
								<div className="flex items-center gap-3 px-2">
									<div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
										<Receipt size={20} />
									</div>
									<h2 className="text-2xl font-black text-slate-900 tracking-tight">
										Список витрат
									</h2>
								</div>
								<div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-slate-200/60 min-h-[400px]">
									<ExpensesList
										expenses={data?.expenses ?? []}
										isLoading={isLoading}
									/>
								</div>
							</div>
						</div>
					))}
			</div>
		</main>
	)
}
