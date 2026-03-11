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
	Lock,
	Loader2
} from 'lucide-react'
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
	const [activeTab, setActiveTab] = useState<'SHIFT_CASH' | 'SALES' | 'EXPENSES'>(
		resolveTabFromPath(pathname)
	)

	useEffect(() => {
		setActiveTab(resolveTabFromPath(pathname))
	}, [pathname])

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
			entry.discount += (t.discount || 0)
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
						<div className="inline-flex items-center gap-2.5 px-3 py-1 bg-slate-900/5 backdrop-blur-md rounded-full border border-slate-200 shadow-sm">
							<ShieldCheck size={14} className="text-slate-900" />
							<span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Панель адміністратора</span>
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
									Щоб почати роботу та фіксувати транзакції, необхідно спочатку відкрити нову зміну.
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
								<span className="font-black uppercase tracking-widest text-sm">Оновлення даних…</span>
							</div>
						)}
					</div>
				)}

				{activeTab === 'SALES' &&
					(!shift ? (
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
						</div>
					))}

				{activeTab === 'EXPENSES' &&
					(!shift ? (
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

			</div >
		</main >
	)
}
