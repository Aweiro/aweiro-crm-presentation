'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login } from '@/lib/api'

function LoginPageContent() {
	const searchParams = useSearchParams()

	const [loginValue, setLoginValue] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	// 👉 звідки прийшли
	const rawFrom = searchParams.get('from')
	const from = rawFrom && rawFrom.startsWith('/') ? rawFrom : null

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError('')
		setIsLoading(true)

		try {
			const user = await login(loginValue, password)

			// ✅ ADMIN може всюди
			if (user.role === 'ADMIN') {
				window.location.href = from ?? '/admin/day'
				return
			}

			// ✅ USER тільки cashier
			window.location.href = '/cashier'
		} catch {
			setError('Невірний логін або пароль')
			setIsLoading(false)
		}
	}

	return (
		<main className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				{/* Card */}
				<div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
					{/* Logo/Header */}
					<div className="text-center mb-8">
						<div className="text-6xl mb-4">💰</div>
						<h1 className="text-3xl font-bold text-slate-900">SIRIUS</h1>
						<p className="text-slate-600 text-sm mt-2 font-medium">
							Система управління касою
						</p>
					</div>

					{/* Error Message */}
					{error && (
						<div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
							<p className="text-red-900 font-semibold">⚠️ {error}</p>
							<p className="text-red-700 text-sm mt-1">
								Перевірте логін та пароль
							</p>
						</div>
					)}

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-5">
						{/* Login Field */}
						<div>
							<label className="block text-sm font-bold text-slate-700 mb-2">
								🔑 Логін
							</label>
							<input
								type="text"
								placeholder="Введіть ваш логін"
								value={loginValue}
								onChange={(e) => setLoginValue(e.target.value)}
								disabled={isLoading}
								className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed font-medium"
								required
								autoFocus
							/>
						</div>

						{/* Password Field */}
						<div>
							<label className="block text-sm font-bold text-slate-700 mb-2">
								🔐 Пароль
							</label>
							<input
								type="password"
								placeholder="Введіть ваш пароль"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={isLoading}
								className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed font-medium"
								required
							/>
						</div>

						{/* Submit Button */}
						<button
							type="submit"
							disabled={isLoading}
							className={`w-full py-3 px-4 rounded-lg font-bold text-lg transition-all mt-6 ${
								isLoading
									? 'bg-slate-300 text-slate-500 cursor-not-allowed'
									: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl active:shadow-md'
							}`}
						>
							{isLoading ? (
								<span className="flex items-center justify-center gap-2">
									<span className="animate-spin">⏳</span>
									Вхід…
								</span>
							) : (
								<span className="flex items-center justify-center gap-2">
									🚀 Увійти до системи
								</span>
							)}
						</button>
					</form>

					{/* Footer Info */}
					<div className="mt-8 pt-6 border-t border-slate-200 text-center">
						<p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">
							🧑‍💼 Касова система для малих бізнесів
						</p>
						<div className="flex gap-4 justify-center text-xs text-slate-500">
							<div className="flex items-center gap-1">
								<span>📱</span>
								<span>Адміністратор</span>
							</div>
							<span>•</span>
							<div className="flex items-center gap-1">
								<span>👥</span>
								<span>Касир</span>
							</div>
						</div>
					</div>
				</div>

				{/* Decorative Elements */}
				<div className="mt-8 text-center text-white/60 text-sm">
					<p>© 2026 Sirius. Усі права захищені.</p>
				</div>
			</div>

			{/* Background Blur Elements */}
			<div className="fixed top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10 animate-blob"></div>
			<div className="fixed top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10 animate-blob animation-delay-2s"></div>
			<div className="fixed -bottom-8 left-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10 animate-blob animation-delay-4s"></div>
		</main>
	)
}

export default function LoginPage() {
	return (
		<Suspense fallback={<main className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 p-4" />}>
			<LoginPageContent />
		</Suspense>
	)
}
