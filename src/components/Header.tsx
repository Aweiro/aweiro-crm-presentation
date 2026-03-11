'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useUser } from '@/lib/useUser'
import LogoutButton from './LogoutButton'
import Image from 'next/image'

type Role = 'ADMIN' | 'USER'

type NavLink = {
	href: string
	label: string
	roles: Role[]
	activePrefix?: string
	subLinks?: Array<{
		href: string
		label: string
	}>
}

const NAV_LINKS: NavLink[] = [
	{ href: '/', label: 'Панель', roles: ['ADMIN', 'USER'] },
	{ href: '/cashier', label: 'Оплата', roles: ['ADMIN', 'USER'] },
	{ href: '/appointments', label: 'Календар', roles: ['ADMIN', 'USER'] },
	{ href: '/user/sales', label: 'Статистика', roles: ['USER'] },
	{
		href: '/admin/day/shift-cash',
		activePrefix: '/admin/day',
		label: 'Робочий день',
		roles: ['ADMIN'],
		subLinks: [
			{ href: '/admin/day/shift-cash', label: 'Зміна та каса' },
			{ href: '/admin/day/sales', label: 'Транзакції дня' },
			{ href: '/admin/day/expenses', label: 'Витрати дня' }
		]
	},
	{
		href: '/admin/shifts/archive',
		activePrefix: '/admin/shifts',
		label: 'Звіти',
		roles: ['ADMIN'],
		subLinks: [
			{ href: '/admin/shifts/archive', label: 'Зміни по місяцях' },
			{ href: '/admin/shifts/expenses', label: 'Місячні витрати' },
			{ href: '/admin/shifts/analytics', label: 'Аналітика' }
		]
	},
	{
		href: '/admin/users/team',
		activePrefix: '/admin/users',
		label: 'Команда',
		roles: ['ADMIN'],
		subLinks: [
			{ href: '/admin/users/team', label: 'Команда та ролі' },
			{ href: '/admin/users/services', label: 'Послуги та ціни' },
			{ href: '/admin/users/schedule', label: 'Графік роботи' },
			{ href: '/admin/users/finance', label: 'Зарплати і виплати' }
		]
	},
	{
		href: '/admin/inventory/list',
		activePrefix: '/admin/inventory',
		label: 'Товари',
		roles: ['ADMIN'],
		subLinks: [
			{ href: '/admin/inventory/list', label: 'Склад товарів' },
			{ href: '/admin/inventory/history', label: 'Історія складу' }
		]
	}
]

export default function Header() {
	const pathname = usePathname()
	const headerRef = useRef<HTMLElement>(null)
	const [menuOpen, setMenuOpen] = useState(false)
	const [hoveredDesktopDropdown, setHoveredDesktopDropdown] = useState<string | null>(
		null
	)
	const { user, loading } = useUser()
	const visibleLinks = loading
		? []
		: NAV_LINKS.filter((link) =>
			user?.role ? link.roles.includes(user.role) : false
		)

	useEffect(() => {
		if ('scrollRestoration' in window.history) {
			window.history.scrollRestoration = 'manual'
		}
	}, [])

	useEffect(() => {
		const el = headerRef.current
		if (!el) return

		const updateHeaderHeight = () => {
			document.documentElement.style.setProperty(
				'--app-header-height',
				`${el.offsetHeight}px`
			)
		}

		updateHeaderHeight()
		const observer = new ResizeObserver(updateHeaderHeight)
		observer.observe(el)
		window.addEventListener('resize', updateHeaderHeight)

		return () => {
			observer.disconnect()
			window.removeEventListener('resize', updateHeaderHeight)
		}
	}, [])

	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
		setMenuOpen(false)
		setHoveredDesktopDropdown(null)
	}, [pathname])

	const isSubLinkActive = (href: string) => pathname === href

	const isLandingPage = !loading && !user && pathname === '/'
	if (isLandingPage) return null

	return (
		<header
			ref={headerRef}
			className="sticky top-0 z-50 h-[64px] border-b border-slate-200/50 bg-white/70 shadow-[0_4px_24px_-16px_rgba(15,23,42,0.2)] backdrop-blur-xl transition-all duration-300"
		>
			<div className="relative mx-auto h-full max-w-7xl p-[10px]">
				<div className="flex h-full items-center justify-between gap-3 md:hidden">
					<Link href="/" className="block h-full shrink-0 hover:opacity-90 transition-opacity">
						<Image
							src="/logo.png"
							alt="Sirius"
							width={160}
							height={44}
							priority
							className="h-full w-auto object-contain"
						/>
					</Link>
					<button
						type="button"
						aria-label={menuOpen ? 'Закрити меню' : 'Відкрити меню'}
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((prev) => !prev)}
						className="inline-flex h-full aspect-square max-h-[44px] items-center justify-center text-slate-600 transition-colors hover:text-slate-900 active:scale-95"
					>
						{menuOpen ? (
							<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						) : (
							<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						)}
					</button>
				</div>

				<div className="hidden h-full md:flex md:items-center md:justify-between w-full">
					<div className="flex h-full shrink-0">
						<Link href="/" className="block h-full hover:opacity-90 transition-opacity">
							<Image
								src="/logo.png"
								alt="Sirius"
								width={160}
								height={44}
								priority
								className="h-full w-auto object-contain"
							/>
						</Link>
					</div>

					<nav className="flex h-full items-center justify-center gap-1 xl:gap-2">
						{visibleLinks.map((link) => {
							const isActive =
								link.href === '/'
									? pathname === '/'
									: pathname?.startsWith(link.activePrefix || link.href)
							const hasSubLinks = Boolean(link.subLinks?.length)
							const isDropdownOpen = hoveredDesktopDropdown === link.href

							return (
								<div
									key={link.href}
									className="relative group h-full flex items-center"
									onMouseEnter={() =>
										hasSubLinks ? setHoveredDesktopDropdown(link.href) : null
									}
									onMouseLeave={() =>
										hasSubLinks ? setHoveredDesktopDropdown(null) : null
									}
								>
									{hasSubLinks ? (
										<Link
											href={link.href}
											className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors duration-150 ${isActive
												? 'bg-blue-50 text-blue-700'
												: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
												}`}
										>
											{link.label}
											<svg
												className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
													}`}
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</Link>
									) : (
										<Link
											href={link.href}
											className={`inline-flex shrink-0 items-center rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors duration-150 ${isActive
												? 'bg-blue-50 text-blue-700'
												: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
												}`}
										>
											{link.label}
										</Link>
									)}

									{/* Dropdown Menu */}
									{hasSubLinks && (
										<div
											className={`absolute left-0 top-[100%] pt-2 z-50 origin-top-left transition-all duration-300 min-w-[220px] ${isDropdownOpen
												? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
												: 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
												}`}
										>
											<div className="rounded-2xl border border-slate-200/60 bg-white/95 p-1.5 shadow-[0_12px_40px_-15px_rgba(15,23,42,0.15)] ring-1 ring-slate-900/5 backdrop-blur-md">
												<div className="flex flex-col gap-0.5">
													{link.subLinks!.map((subLink) => {
														const isSubActive = isSubLinkActive(subLink.href)
														return (
															<Link
																key={subLink.href}
																href={subLink.href}
																onClick={() => {
																	setMenuOpen(false)
																	setHoveredDesktopDropdown(null)
																}}
																className={`group relative flex items-center rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 ${isSubActive
																	? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
																	: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
																	}`}
															>
																{subLink.label}
																<svg
																	className={`absolute right-3 h-3.5 w-3.5 transition-transform duration-300 ${isSubActive ? 'translate-x-0 opacity-100 text-white' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 text-slate-400'
																		}`}
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																>
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
																</svg>
															</Link>
														)
													})}
												</div>
											</div>
										</div>
									)}
								</div>
							)
						})}
					</nav>

					<div className="flex w-[220px] items-center justify-end gap-3">
						{loading ? (
							<div className="h-10 w-32 rounded-xl bg-slate-100 animate-pulse" />
						) : user ? (
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-3">
									<div className="text-right hidden xl:block">
										<p className="font-semibold text-slate-900 text-sm leading-tight tracking-tight">
											{user.name || user.login}
										</p>
										<p className="text-[11px] font-medium text-slate-500 mt-0.5">
											{user.role === 'ADMIN' ? 'Адміністратор' : 'Касир'}
										</p>
									</div>
									<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-bold shadow-sm border border-blue-100/50">
										{(user.name || user.login)[0].toUpperCase()}
									</div>
								</div>
								<div className="h-7 w-px bg-slate-200" />
								<div className="flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors">
									<LogoutButton />
								</div>
							</div>
						) : (
							<div className="flex items-center gap-2">
								<Link
									href="/book"
									className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-300"
								>
									Запис онлайн
								</Link>
								<Link
									href="/login"
									className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-4 text-[13px] font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
								>
									<span>Логін</span>
								</Link>
							</div>
						)}
					</div>
				</div>

				{/* Mobile Menu */}
				<div
					className={`absolute left-0 right-0 top-full mt-0 overflow-hidden border-b border-slate-200 bg-white shadow-xl transition-all duration-300 ease-in-out md:hidden origin-top ${menuOpen
						? 'opacity-100 scale-y-100 visible'
						: 'opacity-0 scale-y-0 invisible'
						}`}
				>
					<div className="px-4 py-3 flex flex-col gap-1 max-h-[75vh] overflow-y-auto overscroll-contain">
						{visibleLinks.map((link) => {
							const isActive =
								link.href === '/'
									? pathname === '/'
									: pathname?.startsWith(link.activePrefix || link.href)

							return (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setMenuOpen(false)}
									className={`flex items-center rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors ${isActive
										? 'bg-blue-50 text-blue-700'
										: 'text-slate-700 hover:bg-slate-50'
										}`}
								>
									{link.label}
								</Link>
							)
						})}

						{loading ? (
							<div className="h-16 w-full rounded-xl bg-slate-100 animate-pulse mt-2" />
						) : user ? (
							<div className="mt-3 rounded-xl bg-slate-50 p-4 border border-slate-200/60">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3.5">
										<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold text-lg">
											{(user.name || user.login)[0].toUpperCase()}
										</div>
										<div className="flex flex-col">
											<span className="font-bold text-slate-900 text-[15px] leading-tight">
												{user.name || user.login}
											</span>
											<span className="text-[13px] text-slate-500 mt-0.5">
												{user.role === 'ADMIN' ? 'Адміністратор' : 'Касир'}
											</span>
										</div>
									</div>
									<div className="text-slate-500 hover:text-slate-900 p-2">
										<LogoutButton />
									</div>
								</div>
							</div>
						) : (
							<div className="mt-3 flex flex-col gap-2 pt-2 border-t border-slate-100">
								<Link
									href="/book"
									onClick={() => setMenuOpen(false)}
									className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
								>
									Запис онлайн
								</Link>
								<Link
									href="/login"
									onClick={() => setMenuOpen(false)}
									className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-[15px] font-medium text-white transition-colors hover:bg-blue-700"
								>
									Увійти в систему
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	)
}
