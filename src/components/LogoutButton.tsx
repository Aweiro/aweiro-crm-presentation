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
			className="px-4 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105"
		>
			🚪 Вийти
		</button>
	)
}