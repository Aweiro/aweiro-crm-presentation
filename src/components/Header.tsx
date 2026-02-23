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
}

const NAV_LINKS: NavLink[] = [
	{ href: '/', label: 'Головна', roles: ['ADMIN', 'USER'] },
	{ href: '/cashier', label: 'Каса', roles: ['ADMIN', 'USER'] },
	{ href: '/user/sales', label: 'Мої продажі', roles: ['USER'] },
	{ href: '/admin/day', label: 'День', roles: ['ADMIN'] },
	{ href: '/admin/shifts', label: 'Архів', roles: ['ADMIN'] },
	{ href: '/admin/users', label: 'Користувачі', roles: ['ADMIN'] },
	{ href: '/admin/inventory', label: 'Склад', roles: ['ADMIN'] }
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
			className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm"
		>
			<div className="relative mx-auto max-w-7xl px-3 py-2.5 sm:px-6 md:py-2.5">
				<div className="flex items-center justify-between gap-3 md:hidden">
					<Link href="/" className="flex items-center h-10 shrink-0">
						<Image
							src="/logo.png"
							alt="Sirius"
							width={180}
							height={48}
							priority
							className="h-full w-auto object-contain"
						/>
					</Link>
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

				<div className="hidden md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-4">
					<Link href="/" className="flex items-center h-11 w-[200px] shrink-0">
						<Image
							src="/logo.png"
							alt="Sirius"
							width={200}
							height={52}
							priority
							className="h-full w-auto object-contain"
						/>
					</Link>

					<nav className="flex items-center justify-center gap-2 overflow-x-auto whitespace-nowrap pb-1 -mx-1 px-1 md:overflow-visible md:whitespace-normal md:pb-0 md:mx-0 md:px-0">
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

					<div className="flex min-w-[220px] items-center justify-end gap-3">
						{loading ? (
							<div className="h-9 w-24 rounded-lg bg-slate-100 animate-pulse" />
						) : user ? (
							<div className="flex items-center">
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
								</div>
								<div className="mx-3 h-7 w-px bg-slate-200" />
								<LogoutButton />
							</div>
						) : (
							<Link
								href="/login"
								className="inline-flex h-9 items-center gap-2 rounded-lg border border-blue-200 bg-blue-600 px-3 text-sm font-semibold text-white transition-colors hover:border-blue-300 hover:bg-blue-700"
							>
								<svg
									aria-hidden="true"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.8"
									className="h-4 w-4"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M18 12H9.75m0 0l2.25-2.25M9.75 12l2.25 2.25"
									/>
								</svg>
								<span>Логін</span>
							</Link>
						)}
					</div>
				</div>

				{menuOpen && (
					<div className="absolute inset-x-3 top-full z-50 mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg md:hidden">
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
							<div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
								<div className="text-left">
									<p className="font-semibold text-slate-900 text-sm leading-tight">
										{user.name || user.login}
									</p>
									<p className="text-xs text-slate-500">
										{user.role === 'ADMIN' ? '👨‍💼 Адміністратор' : '👤 Касир'}
									</p>
								</div>
								<div className="my-3 h-px bg-slate-200" />
								<div className="flex justify-end">
									<LogoutButton />
								</div>
							</div>
						) : (
							<Link
								href="/login"
								className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-600 px-3 text-sm font-semibold text-white transition-colors hover:border-blue-300 hover:bg-blue-700"
							>
								<svg
									aria-hidden="true"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.8"
									className="h-4 w-4"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M18 12H9.75m0 0l2.25-2.25M9.75 12l2.25 2.25"
									/>
								</svg>
								<span>Логін</span>
							</Link>
						)}
					</div>
				)}
			</div>
		</header>
	)
}
