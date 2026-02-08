'use client'

import Link from 'next/link'
import { useUser } from '@/lib/useUser'

type Role = 'ADMIN' | 'USER'

type HomeSection = {
	href: string
	title: string
	description: string
	icon: string
	accent: string
	quickClass: string
	roles: Role[]
}

const HOME_SECTIONS: HomeSection[] = [
	{
		href: '/cashier',
		title: 'Касир',
		description: 'Реєстрація операцій, розрахунки з клієнтами',
		icon: '💰',
		accent: 'text-blue-600',
		quickClass: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
		roles: ['ADMIN', 'USER']
	},
	{
		href: '/user/sales',
		title: 'Мої продажі',
		description: 'Особиста статистика продажів за день і місяць',
		icon: '📈',
		accent: 'text-teal-600',
		quickClass: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
		roles: ['USER']
	},
	{
		href: '/admin/day',
		title: 'День (Адмін)',
		description: 'Управління змінами, видатками та звітами',
		icon: '📅',
		accent: 'text-green-600',
		quickClass: 'bg-green-100 text-green-700 hover:bg-green-200',
		roles: ['ADMIN']
	},
	{
		href: '/admin/shifts',
		title: 'Архів змін',
		description: 'Перегляд закритих змін, статистика, аналітика',
		icon: '📦',
		accent: 'text-purple-600',
		quickClass: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
		roles: ['ADMIN']
	},
	{
		href: '/admin/users',
		title: 'Користувачі',
		description: 'Управління співробітниками та їх ролями',
		icon: '👥',
		accent: 'text-orange-600',
		quickClass: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
		roles: ['ADMIN']
	}
]

export default function HomePage() {
	const { user, loading } = useUser()
	const visibleSections = loading
		? []
		: HOME_SECTIONS.filter(section => (user?.role ? section.roles.includes(user.role) : false))

	return (
		<main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50">
			<div className="page-container py-8 sm:py-12 lg:py-16">
				<div className="mb-8 sm:mb-12">
					<h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Ласкаво просимо! 👋</h2>
					<p className="text-base sm:text-xl text-slate-600">Система управління касою та змінами</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
					{visibleSections.map(section => (
						<Link key={section.href} href={section.href}>
							<div className="group h-full bg-white rounded-xl shadow-md p-5 sm:p-8 border border-slate-200 hover:shadow-lg hover:border-blue-300 transition-all sm:hover:scale-105 cursor-pointer">
								<div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{section.icon}</div>
								<h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{section.title}</h3>
								<p className="text-slate-600 text-sm mb-4">{section.description}</p>
								<div className={`inline-flex items-center font-semibold text-sm group-hover:gap-2 transition-all ${section.accent}`}>
									Перейти <span className="ml-2">→</span>
								</div>
							</div>
						</Link>
					))}
					{!loading && !user && (
						<Link href="/login">
							<div className="group h-full bg-white rounded-xl shadow-md p-5 sm:p-8 border border-slate-200 hover:shadow-lg hover:border-indigo-300 transition-all sm:hover:scale-105 cursor-pointer">
								<div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🔐</div>
								<h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Логін</h3>
								<p className="text-slate-600 text-sm mb-4">Увійдіть, щоб побачити доступні розділи</p>
								<div className="inline-flex items-center text-indigo-600 font-semibold text-sm group-hover:gap-2 transition-all">
									Перейти <span className="ml-2">→</span>
								</div>
							</div>
						</Link>
					)}
				</div>

				<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-5 sm:p-8 mb-8">
					<h3 className="text-lg font-bold text-slate-900 mb-3">ℹ️ Про систему</h3>
					<ul className="space-y-2 text-sm sm:text-base text-slate-700">
						<li>✓ <strong>Безпечна авторизація</strong> - контроль доступу за ролями</li>
						<li>✓ <strong>Управління змінами</strong> - відкриття, закриття, видатки</li>
						<li>✓ <strong>Аналітика</strong> - детальна статистика доходів та видатків</li>
						<li>✓ <strong>Касові операції</strong> - готівка та карткові платежі</li>
						<li>✓ <strong>Управління користувачами</strong> - ролі та дозволи</li>
					</ul>
				</div>

				<div className="bg-white rounded-xl shadow-md p-5 sm:p-8 border border-slate-200">
					<h3 className="text-lg font-bold text-slate-900 mb-4">⚡ Швидкі посилання</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
						{visibleSections.map(section => (
							<Link
								key={section.href}
								href={section.href}
								className={`inline-block px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition ${section.quickClass}`}
							>
								{section.icon} {section.title.replace(' (Адмін)', '')}
							</Link>
						))}
						{!loading && !user && (
							<Link href="/login" className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-indigo-200 transition">
								🔐 Логін
							</Link>
						)}
					</div>
				</div>
			</div>

			<footer className="bg-slate-900 text-white mt-12 sm:mt-20 py-8 border-t border-slate-800">
				<div className="page-container">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
						<div>
							<h4 className="font-bold mb-2">🌟 Sirius</h4>
							<p className="text-slate-400 text-sm">Система управління касою та змінами</p>
						</div>
						<div>
							<h4 className="font-bold mb-3">Документація</h4>
							<ul className="space-y-2 text-slate-400 text-sm">
								<li><a href="/admin/day" className="hover:text-white transition">Як працювати з днем</a></li>
								<li><a href="/cashier" className="hover:text-white transition">Касові операції</a></li>
								<li><a href="/admin/shifts" className="hover:text-white transition">Архів змін</a></li>
							</ul>
						</div>
						<div>
							<h4 className="font-bold mb-3">Підтримка</h4>
							<ul className="space-y-2 text-slate-400 text-sm">
								<li>Email: support@sirius.local</li>
								<li>Version: 1.0.0</li>
								<li className="text-slate-500 text-xs mt-3">© 2026 Sirius System</li>
							</ul>
						</div>
					</div>
					<div className="border-t border-slate-800 pt-6 text-slate-400 text-sm text-center">
						<p>Версия {process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'} • Розроблено для покращення роботи</p>
					</div>
				</div>
			</footer>
		</main>
	)
}
