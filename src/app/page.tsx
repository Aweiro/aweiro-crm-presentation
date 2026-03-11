'use client'

import Link from 'next/link'
import { useUser } from '@/lib/useUser'
import {
	Wallet,
	Calendar,
	TrendingUp,
	CalendarRange,
	Archive,
	Users,
	Package,
	ChevronRight,
	ShieldCheck,
	Clock,
	PieChart,
	CreditCard,
	LogIn,
	BookOpen,
	Scissors,
	ShoppingBag,
	Banknote,
	LayoutDashboard,
	Settings
} from 'lucide-react'

type Role = 'ADMIN' | 'USER'

type HomeSection = {
	href: string
	title: string
	description: string
	icon: any
	accent: string
	badge: string
	roles: Role[]
}

const HOME_SECTIONS: HomeSection[] = [
	{
		href: '/cashier',
		title: 'Каса і чеки',
		description: 'Оплата послуг і товарів, знижки та чек в одному місці',
		icon: Wallet,
		accent: 'from-blue-500 to-cyan-500',
		badge: 'bg-blue-100 text-blue-700',
		roles: ['ADMIN', 'USER']
	},
	{
		href: '/appointments',
		title: 'Записи клієнтів',
		description: 'Календар бронювань: послуги, майстри, вільні години',
		icon: Calendar,
		accent: 'from-indigo-500 to-purple-500',
		badge: 'bg-indigo-100 text-indigo-700',
		roles: ['ADMIN', 'USER']
	},
	{
		href: '/user/sales',
		title: 'Моя статистика продажів',
		description: 'Особисті результати за день і місяць',
		icon: TrendingUp,
		accent: 'from-teal-500 to-emerald-500',
		badge: 'bg-teal-100 text-teal-700',
		roles: ['USER']
	},
	{
		href: '/admin/day/shift-cash',
		title: 'Робочий день',
		description: 'Зміна, каса, транзакції та витрати поточного дня',
		icon: CalendarRange,
		accent: 'from-green-500 to-lime-500',
		badge: 'bg-green-100 text-green-700',
		roles: ['ADMIN']
	},
	{
		href: '/admin/shifts/archive',
		title: 'Архів і аналітика',
		description: 'Закриті зміни, місячні витрати та фінансові графіки',
		icon: Archive,
		accent: 'from-purple-500 to-pink-500',
		badge: 'bg-purple-100 text-purple-700',
		roles: ['ADMIN']
	},
	{
		href: '/admin/users/team',
		title: 'Команда та налаштування',
		description: 'Працівники, ролі, послуги, графіки та виплати',
		icon: Users,
		accent: 'from-orange-500 to-amber-500',
		badge: 'bg-orange-100 text-orange-700',
		roles: ['ADMIN']
	},
	{
		href: '/admin/inventory/list',
		title: 'Склад товарів',
		description: 'Товари, залишки, поставки, списання та історія',
		icon: Package,
		accent: 'from-cyan-500 to-blue-500',
		badge: 'bg-cyan-100 text-cyan-700',
		roles: ['ADMIN']
	}
]

export default function HomePage() {
	const { user, loading } = useUser()
	const visibleSections = loading
		? []
		: HOME_SECTIONS.filter((section) =>
			user?.role ? section.roles.includes(user.role) : false
		)

	if (loading) {
		return (
			<main className="min-h-screen bg-[#fafafa] flex items-center justify-center">
				<div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
			</main>
		)
	}

	if (user) {
		return (
			<main className="min-h-screen bg-[#fafafa] overflow-hidden relative">
				{/* Mesh Background Decorations */}
				<div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />
				<div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-purple-200/20 rounded-full blur-[100px] pointer-events-none" />
				<div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-indigo-200/10 rounded-full blur-[80px] pointer-events-none" />

				<div className="page-container py-12 sm:py-20 lg:py-28 relative z-10">
					<div className="max-w-3xl mb-12 sm:mb-20">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/5 border border-slate-900/10 mb-6 backdrop-blur-sm">
							<span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
							<span className="text-xs font-bold text-slate-600 tracking-wider uppercase">Система управління Sirius</span>
						</div>
						<h2 className="text-4xl sm:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1] text-balance">
							Ласкаво просимо! 👋
						</h2>
						<p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl text-balance">
							Ваш інструмент для ефективного управління касою, записами та аналітикою в реальному часі.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
						{visibleSections.map((section) => {
							const Icon = section.icon;
							return (
								<Link key={section.href} href={section.href} className="group h-full">
									<div className="relative h-full bg-white rounded-3xl p-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:border-slate-300/50 transition-all duration-500 sm:group-hover:-translate-y-2 overflow-hidden flex flex-col">
										<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700" />
										<div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${section.accent} flex items-center justify-center text-white mb-8 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
											<Icon size={28} strokeWidth={2.5} />
										</div>
										<h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
											{section.title}
										</h3>
										<p className="text-slate-500 text-[15px] leading-relaxed mb-8 flex-1">
											{section.description}
										</p>
										<div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
											<div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-900 transition-colors font-bold text-sm">
												Відкрити <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
											</div>
										</div>
									</div>
								</Link>
							)
						})}
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20 animate-in fade-in slide-in-from-bottom-12 duration-1000">
						<div className="bg-white rounded-[2rem] p-8 sm:p-12 border border-slate-200/60 shadow-sm relative overflow-hidden group">
							<div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
								<ShieldCheck size={200} />
							</div>
							<h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
								<span className="p-2 rounded-lg bg-blue-100 text-blue-600">
									<ShieldCheck size={24} />
								</span>
								Можливості системи
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
								{[
									{ icon: ShieldCheck, title: 'Безпека', text: 'Контроль доступу за ролями' },
									{ icon: Clock, title: 'Зміни', text: 'Відкриття та закриття каси' },
									{ icon: PieChart, title: 'Аналітика', text: 'Детальна статистика доходів' },
									{ icon: CreditCard, title: 'Фінанси', text: 'Готівка та карткові платежі' }
								].map((item, id) => (
									<div key={id} className="flex gap-4">
										<div className="mt-1">
											<item.icon size={18} className="text-blue-500" />
										</div>
										<div>
											<h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
											<p className="text-xs text-slate-500 mt-1">{item.text}</p>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 text-white relative overflow-hidden flex flex-col justify-center">
							<div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[80px]" />
							<h3 className="text-2xl font-black mb-6 relative z-10">Швидкий доступ</h3>
							<div className="flex flex-wrap gap-2 relative z-10">
								{visibleSections.map((section) => (
									<Link
										key={section.href}
										href={section.href}
										className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-bold text-sm backdrop-blur-md flex items-center gap-2"
									>
										<section.icon size={16} /> {section.title.replace(' (Адмін)', '')}
									</Link>
								))}
							</div>
						</div>
					</div>
				</div>

				<footer className="bg-white border-t border-slate-100 py-16 relative z-10">
					<div className="page-container">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
							<div className="col-span-1 md:col-span-2">
								<h4 className="text-2xl font-black mb-4 tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
									Sirius System
								</h4>
								<p className="text-slate-500 text-[15px] leading-relaxed max-w-sm mb-6">
									Професійне рішення для автоматизації барбершопів та салонів краси. Все, що потрібно в одному місці.
								</p>
							</div>
							<div>
								<h4 className="font-black text-slate-900 mb-6 text-sm uppercase tracking-widest text-balance border-b border-slate-100 pb-2">Система</h4>
								<ul className="space-y-4 text-slate-500 text-sm font-bold">
									<li><Link href="/admin/day" className="hover:text-blue-600 transition">Панель управління</Link></li>
									<li><Link href="/cashier" className="hover:text-blue-600 transition">Каса та платежі</Link></li>
									<li><Link href="/appointments" className="hover:text-blue-600 transition">Журнал записів</Link></li>
								</ul>
							</div>
							<div>
								<h4 className="font-black text-slate-900 mb-6 text-sm uppercase tracking-widest text-balance border-b border-slate-100 pb-2">Підтримка</h4>
								<ul className="space-y-3 text-slate-500 text-sm">
									<li className="flex items-center gap-2">
										<span className="w-1.5 h-1.5 rounded-full bg-green-500" />
										support@sirius.local
									</li>
									<li className="text-xs text-slate-400 mt-4 leading-relaxed">
										Розроблено v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
										<br />© 2026 Sirius Admin.
									</li>
								</ul>
							</div>
						</div>
					</div>
				</footer>
			</main>
		)
	}

	// ==========================================
	// MARKETING LANDING PAGE (Unauthenticated)
	// ==========================================
	return (
		<main className="min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
			<div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-[120px]" />
			<div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-[120px]" />

			<nav className="relative z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
				<div className="page-container flex h-20 items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
							<ShieldCheck className="h-6 w-6" />
						</div>
						<span className="text-xl font-black tracking-tight">Sirius</span>
					</div>
					<div className="flex items-center gap-3">
						<Link
							href="/book"
							className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 sm:inline-flex"
						>
							Онлайн-запис
						</Link>
						<Link
							href="/login"
							className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-black text-slate-900 transition hover:bg-slate-100"
						>
							Вхід у CRM <ChevronRight className="h-4 w-4" />
						</Link>
					</div>
				</div>
			</nav>

			<section className="relative z-10 pb-20 pt-16 sm:pb-24 sm:pt-20">
				<div className="page-container">
					<div className="mx-auto max-w-4xl text-center">
						<p className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">
							Для клієнта, власника та команди
						</p>
						<h1 className="text-balance text-4xl font-black leading-tight tracking-tight sm:text-6xl">
							Клієнту — швидкий запис.
							<span className="block">Власнику — потужна CRM.</span>
							<span className="block bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
								Працівнику — зручний вхід і робота.
							</span>
						</h1>
						<p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">
							Запис на стрижку в кілька кліків, повний контроль бізнесу для власника
							та персональний кабінет для працівників в одній системі.
						</p>
						<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
							<Link
								href="/book"
								className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-7 py-3.5 text-base font-black text-slate-950 shadow-[0_10px_30px_-12px_rgba(56,189,248,0.9)] transition hover:from-cyan-300 hover:via-sky-300 hover:to-blue-400"
							>
								<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/70">
									<Scissors className="h-4 w-4" />
								</span>
								Записатись онлайн
								<ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
							</Link>
							<Link
								href="/login"
								className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-base font-black text-white transition hover:bg-white/10"
							>
								<LogIn className="h-5 w-5" />
								Увійти в CRM
							</Link>
						</div>
					</div>
				</div>
			</section>

			<section className="relative z-10 border-y border-white/10 bg-white/[0.03] py-14 sm:py-16">
				<div className="page-container">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
						{[
							{
								icon: Calendar,
								title: 'Простий запис',
								desc: 'Обрати послугу, майстра і час можна за хвилину — без дзвінків.'
							},
							{
								icon: Wallet,
								title: 'Власнику: контроль каси',
								desc: 'Один чек: послуги, товари, знижка, оплата — все в CRM.'
							},
							{
								icon: Package,
								title: 'Власнику: склад без хаосу',
								desc: 'Залишки, поставки, списання та історія операцій в одному місці.'
							},
							{
								icon: TrendingUp,
								title: 'Власнику: аналітика',
								desc: 'Дохід, витрати, архів змін і результати по кожному працівнику.'
							}
						].map((item) => (
							<div
								key={item.title}
								className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-sm"
							>
								<div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
									<item.icon className="h-5 w-5" />
								</div>
								<h3 className="text-lg font-black text-white">{item.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-slate-300">{item.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="relative z-10 py-16 sm:py-20">
				<div className="page-container">
					<div className="mb-8 sm:mb-10">
						<h2 className="text-2xl font-black tracking-tight sm:text-3xl">
							Що отримує власник з Sirius CRM
						</h2>
						<p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
							Система закриває повний цикл: від онлайн-запису клієнта до зарплат,
							складу та фінансової аналітики.
						</p>
					</div>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
						{[
							{
								icon: LayoutDashboard,
								title: 'Операційний день',
								items: ['Відкриття/закриття зміни', 'Каса на старт/кінець', 'Контроль витрат дня']
							},
							{
								icon: CreditCard,
								title: 'Каса та чеки',
								items: ['Один чек: послуги + товари', 'Готівка/карта/знижка', 'Видалення чеку з відкатом товарів']
							},
							{
								icon: CalendarRange,
								title: 'Онлайн-запис',
								items: ['Підбір майстра по послузі', 'Слоти з урахуванням тривалості', 'Окремий потік для клієнта онлайн']
							},
							{
								icon: Users,
								title: 'Працівники та зарплати',
								items: ['Ролі та доступи', 'Індивідуальні ціни послуг', 'Розрахунок % і виплати']
							},
							{
								icon: Package,
								title: 'Склад',
								items: ['Поставки і списання', 'Історія операцій', 'Відновлення видалених позицій']
							},
							{
								icon: Archive,
								title: 'Архів і звіти',
								items: ['Звіти по днях/місяцях', 'Розподіл доходів', 'Динаміка прибутку і витрат']
							}
						].map((card) => (
							<div
								key={card.title}
								className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
							>
								<div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
									<card.icon className="h-5 w-5" />
								</div>
								<h3 className="text-lg font-black text-white">{card.title}</h3>
								<ul className="mt-3 space-y-1.5 text-sm text-slate-300">
									{card.items.map((line) => (
										<li key={line}>• {line}</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="relative z-10 py-16 sm:py-20">
				<div className="page-container">
					<div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl sm:p-10">
						<div className="mb-8 flex items-center justify-between gap-3">
							<h2 className="text-2xl font-black tracking-tight sm:text-3xl">Як це працює</h2>
							<span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-slate-300">
								3 кроки
							</span>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							{[
								{
									n: '01',
									title: 'Клієнт обирає послугу',
									desc: 'Система одразу показує доступних майстрів.'
								},
								{
									n: '02',
									title: 'Бронює зручний час',
									desc: 'Слоти рахуються з урахуванням тривалості послуг.'
								},
								{
									n: '03',
									title: 'Команда працює в CRM',
									desc: 'Запис, каса, склад та аналітика оновлюються автоматично.'
								}
							].map((step) => (
								<div
									key={step.n}
									className="rounded-2xl border border-white/10 bg-slate-950/60 p-5"
								>
									<p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
										{step.n}
									</p>
									<h3 className="text-lg font-black text-white">{step.title}</h3>
									<p className="mt-2 text-sm text-slate-300">{step.desc}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="relative z-10 border-y border-white/10 bg-white/[0.03] py-14 sm:py-16">
				<div className="page-container">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
							<p className="text-xs font-black uppercase tracking-widest text-cyan-300">Для адміністратора</p>
							<p className="mt-3 text-sm text-slate-300">
								Фокус на бізнес: виручка, витрати, зміни, зарплати, архів і звіти.
							</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
							<p className="text-xs font-black uppercase tracking-widest text-cyan-300">Робочий кабінет</p>
							<p className="mt-3 text-sm text-slate-300">
								Фокус на роботу: вхід у CRM, свої записи, продажі та персональна статистика.
							</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
							<p className="text-xs font-black uppercase tracking-widest text-cyan-300">Для клієнта</p>
							<p className="mt-3 text-sm text-slate-300">
								Фокус на простоті: запис на стрижку онлайн за 1 хвилину.
							</p>
						</div>
					</div>
				</div>
			</section>

			<footer className="relative z-10 border-t border-white/10 py-10">
				<div className="page-container flex flex-col items-center justify-between gap-4 text-sm text-slate-400 sm:flex-row">
					<p>© 2026 Sirius CRM</p>
					<div className="flex items-center gap-4">
						<Link href="/book" className="transition hover:text-white">Онлайн-запис</Link>
						<Link href="/login" className="transition hover:text-white">Вхід у CRM</Link>
						<a
							href="https://t.me/sergsxdxv"
							target="_blank"
							rel="noreferrer"
							className="transition hover:text-white"
						>
							Підтримка
						</a>
					</div>
				</div>
			</footer>
		</main>
	)
}
