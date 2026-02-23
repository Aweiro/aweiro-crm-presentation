'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login } from '@/lib/api'
import Image from 'next/image'
import { Send } from 'lucide-react'

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
		<main className="min-h-screen overflow-hidden bg-slate-100">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.22),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(14,116,144,0.22),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(2,132,199,0.18),transparent_45%)]" />
			<div className="mx-auto flex min-h-full w-full max-w-md items-center p-4 sm:p-6">
				<div className="w-full rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur sm:p-8">
					<div className="mb-7 text-center">
						<div className="mx-auto mb-4 flex h-14 items-center justify-center">
							<Image
								src="/logo.png"
								alt="Sirius"
								width={180}
								height={50}
								priority
								className="h-full w-auto object-contain"
							/>
						</div>
						<h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
							Вхід до системи
						</h1>
						<p className="mt-2 text-sm text-slate-500">
							Каса та управління змінами
						</p>
					</div>

					{error && (
						<div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3">
							<p className="text-sm font-semibold text-red-800">{error}</p>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="mb-2 block text-sm font-semibold text-slate-700">
								Логін
							</label>
							<input
								type="text"
								placeholder="Введіть логін"
								value={loginValue}
								onChange={(e) => setLoginValue(e.target.value)}
								disabled={isLoading}
								className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
								required
								autoFocus
							/>
						</div>

						<div>
							<label className="mb-2 block text-sm font-semibold text-slate-700">
								Пароль
							</label>
							<input
								type="password"
								placeholder="Введіть пароль"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={isLoading}
								className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
								required
							/>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:border-blue-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-300"
						>
							{isLoading ? (
								<>
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
									Вхід...
								</>
							) : (
								'Увійти'
							)}
						</button>
					</form>

					<div className="mt-6 text-center">
						<p className="flex justify-center gap-2 text-sm text-slate-500">
							<Send size={16} className="text-blue-500" />

							<span>Підтримка:</span>

							<a
								href="https://t.me/arsenbogak"
								target="_blank"
								rel="noreferrer"
								className="font-semibold text-blue-600 hover:text-blue-700"
							>
								@arsenbogak
							</a>
						</p>
					</div>
				</div>
			</div>
		</main>
	)
}

export default function LoginPage() {
	return (
		<Suspense fallback={<main className="min-h-screen bg-slate-100 p-4" />}>
			<LoginPageContent />
		</Suspense>
	)
}
