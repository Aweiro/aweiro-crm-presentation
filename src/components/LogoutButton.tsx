'use client'

import { logout } from '@/lib/api'

export default function LogoutButton() {
	async function handleLogout() {
		await logout()
		window.location.href = '/login'
	}

	return (
		<button
			onClick={handleLogout}
			className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
		>
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				className="h-4 w-4"
			>
				<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
				<path strokeLinecap="round" strokeLinejoin="round" d="M18 12H9.75m0 0l2.25-2.25M9.75 12l2.25 2.25" />
			</svg>
			<span>Вийти</span>
		</button>
	)
}
