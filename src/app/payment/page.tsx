'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/currency'

function PaymentPageContent() {
	const router = useRouter()
	const searchParams = useSearchParams()

	const userId = useMemo(
		() => Number(searchParams.get('user')),
		[searchParams]
	)

	const amount = useMemo(
		() => Number(searchParams.get('amount')),
		[searchParams]
	)

	const userName = searchParams.get('userName')

	// 🔐 захист від прямого заходу
	useEffect(() => {
		if (!userId || !amount) {
			router.replace('/cashier')
		}
	}, [userId, amount, router])

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handlePayment(method: 'CASH' | 'CARD') {
		if (loading) return
		setLoading(true)
		setError(null)

		try {
			const res = await fetch('/api/cashier/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId,
					amount,
					paymentMethod: method
				})
			})

			if (!res.ok) {
				const json = await res.json()
				throw new Error(json.message || 'Помилка оплати')
			}

			router.replace('/cashier')
		} catch (e: any) {
			setError(e.message)
			setLoading(false)
		}
	}

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-8">
		<div className="max-w-2xl mx-auto h-screen sm:h-auto flex flex-col sm:justify-center sm:items-center">
			<button
				onClick={() => router.back()}
				className="p-2 text-slate-700 hover:text-slate-900 transition-colors sm:hidden mb-4 self-start"
			>
				← Назад
			</button>				<div className="flex-1 sm:flex-none flex flex-col justify-center w-full">
					<div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              💳 Як платити?
            </h1>
            {userName && <p className="text-slate-600 font-semibold text-lg">для {userName}</p>}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
            <p className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
              💰 До сплати
            </p>
			<div className="text-5xl font-bold text-blue-700">
								{formatCurrency(amount)}
							</div>
						</div>

						{error && (
							<div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
								<p className="text-red-900 font-semibold">❌ {error}</p>
							</div>
						)}

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
							<button
								disabled={loading}
								onClick={() => handlePayment('CASH')}
								className={`py-6 px-6 rounded-xl font-bold text-lg transition-all border-2 flex items-center justify-center gap-3 ${
									loading
										? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
										: 'bg-gradient-to-br from-green-50 to-emerald-50 text-green-900 border-green-300 hover:from-green-100 hover:to-emerald-100 hover:shadow-lg active:shadow-md'
								}`}
							>
								{loading ? '👆' : '💵'}
								<div className="text-left">
									<div className="font-bold">Готівка</div>
									<div className="text-xs opacity-75">у касу</div>
								</div>
							</button>

							<button
								disabled={loading}
								onClick={() => handlePayment('CARD')}
								className={`py-6 px-6 rounded-xl font-bold text-lg transition-all border-2 flex items-center justify-center gap-3 ${
									loading
										? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
										: 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-900 border-blue-300 hover:from-blue-100 hover:to-indigo-100 hover:shadow-lg active:shadow-md'
								}`}
							>
								{loading ? '👆' : '💳'}
								<div className="text-left">
									<div className="font-bold">Карта</div>
									<div className="text-xs opacity-75">безготівка</div>
								</div>
							</button>
						</div>

						<button
							onClick={() => router.back()}
							className="w-full py-3 px-4 rounded-lg font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors hidden sm:block"
						>
							← Назад
						</button>
					</div>

				<p className="text-center text-slate-600 text-sm font-medium">
					{loading ? '⏳ Обробка платежу…' : '👆 Виберіть спосіб оплати'}
				</p>
				</div>
			</div>
		</main>
	)
}

export default function PaymentPage() {
	return (
		<Suspense fallback={<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-8" />}>
			<PaymentPageContent />
		</Suspense>
	)
}
