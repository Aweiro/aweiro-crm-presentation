'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useUser } from '@/lib/useUser'
import LogoutButton from './LogoutButton'

type Role = 'ADMIN' | 'USER'

type NavLink = {
	href: string
	label: string
	roles: Role[]
}

const NAV_LINKS: NavLink[] = [
	{ href: '/', label: 'Головна', roles: ['ADMIN', 'USER'] },
	{ href: '/cashier', label: 'Каса', roles: ['ADMIN', 'USER'] },
	{ href: '/user/sales', label: 'Мої продажі', roles: ['USER'] },
	{ href: '/admin/day', label: 'День', roles: ['ADMIN'] },
	{ href: '/admin/shifts', label: 'Архів', roles: ['ADMIN'] },
	{ href: '/admin/users', label: 'Користувачі', roles: ['ADMIN'] }
]

export default function Header() {
	const pathname = usePathname()
	const headerRef = useRef<HTMLElement>(null)
	const [menuOpen, setMenuOpen] = useState(false)
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
	}, [pathname])

	return (
		<header
			ref={headerRef}
			className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm"
		>
			<div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
				<div className="flex items-center justify-between gap-3 md:hidden">
					<div className="flex items-center gap-3">
						<span className="text-3xl">🌟</span>
						<div>
							<h1 className="text-lg font-bold text-slate-900">Sirius</h1>
						</div>
					</div>
					<button
						type="button"
						aria-label={menuOpen ? 'Закрити меню' : 'Відкрити меню'}
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((prev) => !prev)}
						className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-700 bg-white"
					>
						{menuOpen ? '✕' : '☰'}
					</button>
				</div>

				<div className="hidden md:flex md:flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div className="flex items-center gap-3">
						<span className="text-3xl">🌟</span>
						<div>
							<h1 className="text-lg sm:text-xl font-bold text-slate-900">
								Sirius
							</h1>
							<p className="text-slate-600 text-xs hidden sm:block">
								Каса та управління змінами
							</p>
						</div>
					</div>

					<nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 -mx-1 px-1 md:flex-wrap md:overflow-visible md:whitespace-normal md:pb-0 md:mx-0 md:px-0">
						{visibleLinks.map((link) => {
							const isActive =
								link.href === '/'
									? pathname === '/'
									: pathname?.startsWith(link.href)
							return (
								<Link
									key={link.href}
									href={link.href}
									className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
										isActive
											? 'bg-blue-100 text-blue-800'
											: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
									}`}
								>
									{link.label}
								</Link>
							)
						})}
					</nav>

					<div className="flex items-center gap-3">
						{loading ? (
							<div className="h-9 w-24 rounded-lg bg-slate-100 animate-pulse" />
						) : user ? (
							<div className="flex items-center gap-3">
								<div className="text-right hidden sm:block">
									<p className="font-semibold text-slate-900 text-sm">
										{user.name || user.login}
									</p>
									<p className="text-xs text-slate-500">
										{user.role === 'ADMIN' ? '👨‍💼 Адміністратор' : '👤 Касир'}
									</p>
								</div>
								<div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold">
									{(user.name || user.login)[0].toUpperCase()}
								</div>
								<LogoutButton />
							</div>
						) : (
							<Link
								href="/login"
								className="px-3 sm:px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm"
							>
								🔐 Логін
							</Link>
						)}
					</div>
				</div>

				{menuOpen && (
					<div className="md:hidden mt-3 border-t border-slate-200 pt-3">
						<nav className="flex flex-col text-center gap-2">
							{visibleLinks.map((link) => {
								const isActive =
									link.href === '/'
										? pathname === '/'
										: pathname?.startsWith(link.href)
								return (
									<Link
										key={link.href}
										href={link.href}
										className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
											isActive
												? 'bg-blue-100 text-blue-800'
												: 'text-slate-700 bg-slate-50'
										}`}
									>
										{link.label}
									</Link>
								)
							})}
						</nav>

						{loading ? (
							<div className="h-9 w-full rounded-lg bg-slate-100 animate-pulse mt-3" />
						) : user ? (
							<div className="flex items-center justify-between gap-3 mt-3">
								<div className="text-left">
									<p className="font-semibold text-slate-900 text-sm leading-tight">
										{user.name || user.login}
									</p>
									<p className="text-xs text-slate-500">
										{user.role === 'ADMIN' ? '👨‍💼 Адміністратор' : '👤 Касир'}
									</p>
								</div>
								<LogoutButton />
							</div>
						) : (
							<Link
								href="/login"
								className="mt-3 inline-flex w-full justify-center px-3 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition text-sm"
							>
								🔐 Логін
							</Link>
						)}
					</div>
				)}
			</div>
		</header>
	)
}
