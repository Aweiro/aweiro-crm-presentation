'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '@/lib/currency'

type InventoryItem = {
	id: number
	shortName: string
	description: string | null
	price: number
	quantity: number
}

function PaymentPageContent() {
	const router = useRouter()
	const searchParams = useSearchParams()

	const userId = useMemo(() => Number(searchParams.get('user')), [searchParams])
	const userName = searchParams.get('userName')
	const prefillAmount = useMemo(
		() => Number(searchParams.get('amount') || 0),
		[searchParams]
	)

	const [barberAmount, setBarberAmount] = useState(
		Number.isFinite(prefillAmount) && prefillAmount > 0
			? String(prefillAmount)
			: ''
	)
	const [selectedItems, setSelectedItems] = useState<Record<number, number>>({})
	const [inventory, setInventory] = useState<InventoryItem[]>([])
	const [loadingInventory, setLoadingInventory] = useState(true)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const barberValue = Number(barberAmount || 0)
	const cosmeticsTotal = useMemo(() => {
		return inventory.reduce((sum, item) => {
			const qty = selectedItems[item.id] || 0
			return sum + qty * item.price
		}, 0)
	}, [inventory, selectedItems])

	const selectedLines = useMemo(() => {
		return inventory
			.map((item) => ({ item, qty: selectedItems[item.id] || 0 }))
			.filter((row) => row.qty > 0)
	}, [inventory, selectedItems])
	const availableInventory = useMemo(
		() => inventory.filter((item) => item.quantity > 0),
		[inventory]
	)

	const total =
		(Number.isFinite(barberValue) ? barberValue : 0) + cosmeticsTotal

	useEffect(() => {
		if (!userId) {
			router.replace('/cashier')
			return
		}

		fetch('/api/admin/inventory')
			.then((res) => res.json())
			.then((json) => {
				setInventory(Array.isArray(json?.data) ? json.data : [])
			})
			.finally(() => setLoadingInventory(false))
	}, [userId, router])

	function setItemQty(itemId: number, qty: number) {
		setSelectedItems((prev) => {
			const next = { ...prev }
			if (qty <= 0) delete next[itemId]
			else next[itemId] = qty
			return next
		})
	}

	async function handlePayment(method: 'CASH' | 'CARD') {
		if (loading) return
		setLoading(true)
		setError(null)

		try {
			const cosmeticsItems = Object.entries(selectedItems)
				.map(([itemId, quantity]) => ({
					itemId: Number(itemId),
					quantity: Number(quantity)
				}))
				.filter((row) => row.quantity > 0)

			const res = await fetch('/api/cashier/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId,
					paymentMethod: method,
					barberAmount:
						Number.isFinite(barberValue) && barberValue > 0 ? barberValue : 0,
					cosmeticsItems
				})
			})

			if (!res.ok) {
				const json = await res.json().catch(() => ({}))
				throw new Error(json?.message || 'Помилка оплати')
			}

			router.replace('/cashier')
		} catch (e: any) {
			setError(e.message || 'Помилка оплати')
			setLoading(false)
		}
	}

	return (
		<main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
			<div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />

			<div className="relative mx-auto max-w-6xl">
				<button
					onClick={() => router.back()}
					className="mb-4 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur hover:bg-white"
				>
					← Назад
				</button>

				<div className="mb-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-lg backdrop-blur">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
								Каса
							</p>
							<h1 className="text-3xl font-bold text-slate-900">Оплата чеку</h1>
						</div>
						<p className="text-sm text-slate-500">Один чек: послуги + товари</p>
					</div>
					{userName ? (
						<p className="mt-2 text-slate-600">
							Працівник:{' '}
							<span className="font-semibold text-slate-900">{userName}</span>
						</p>
					) : null}
				</div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<div className="space-y-6 lg:col-span-2">
						<div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-lg">
							<div className="mb-4 flex items-center justify-between gap-2">
								<h2 className="text-xl font-bold text-slate-900">✂️ Послуги</h2>
								<span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
									Послуги
								</span>
							</div>

							<div className="relative">
								<input
									type="number"
									min={0}
									step="1"
									placeholder="Сума барбер-послуг"
									value={barberAmount}
									onChange={(e) => setBarberAmount(e.target.value)}
									className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-16 text-2xl font-bold text-slate-900 outline-none ring-blue-200 transition focus:border-blue-400 focus:ring-4"
								/>
								<span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
									zł
								</span>
							</div>

							<p className="mt-2 text-sm text-slate-500">
								Введи суму стрижки / послуг
							</p>
						</div>

						<div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-lg">
							<div className="mb-4 flex items-center justify-between gap-2">
								<h2 className="text-xl font-bold text-slate-900">
									🧴 Косметика зі складу
								</h2>
								<span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
									Товари
								</span>
							</div>

							{loadingInventory ? (
								<div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-500">
									Завантаження товарів...
								</div>
							) : availableInventory.length === 0 ? (
								<div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-500">
									На складі немає активних товарів.
								</div>
							) : (
								<div className="space-y-2.5">
									{availableInventory.map((item) => {
										const qty = selectedItems[item.id] || 0
										return (
											<div
												key={item.id}
												className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-3 transition hover:border-blue-300"
											>
												<div className="flex items-start justify-between gap-3">
													<div className="min-w-0">
														<p className="font-semibold text-slate-900">
															{item.shortName}
														</p>
														<p className="text-sm text-slate-600 break-words">
															{item.description || 'Без опису'}
														</p>
														<p className="mt-1 text-sm font-semibold text-cyan-700">
															{formatCurrency(item.price)} · в наявності{' '}
															{item.quantity}
														</p>
													</div>

													<div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1">
														<button
															type="button"
															onClick={() =>
																setItemQty(item.id, Math.max(0, qty - 1))
															}
															className="h-8 w-8 rounded-lg bg-slate-100 font-bold text-slate-700 transition hover:bg-slate-200"
														>
															-
														</button>
														<input
															type="text"
															inputMode="numeric"
															pattern="[0-9]*"
															value={qty}
															onChange={(e) => {
																const digitsOnly = e.target.value.replace(/\D/g, '')
																const normalized = digitsOnly.replace(/^0+(?=\d)/, '')
																const parsed =
																	normalized === '' ? 0 : Number(normalized)
																setItemQty(
																	item.id,
																	Math.max(0, Math.min(item.quantity, parsed))
																)
															}}
															onFocus={(e) => e.currentTarget.select()}
															className="w-14 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-semibold tabular-nums"
														/>
														<button
															type="button"
															onClick={() =>
																setItemQty(
																	item.id,
																	Math.min(item.quantity, qty + 1)
																)
															}
															className="h-8 w-8 rounded-lg bg-cyan-600 font-bold text-white transition hover:bg-cyan-700"
														>
															+
														</button>
													</div>
												</div>
											</div>
										)
									})}
								</div>
							)}
						</div>
					</div>

					<div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
						<div className="rounded-3xl border border-blue-200/80 bg-white/95 p-5 shadow-lg">
							<p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
								Чек
							</p>

							<div className="mt-3 space-y-2">
								<div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
									<span>✂️ Послуги</span>
									<span className="font-semibold">
										{formatCurrency(barberValue || 0)}
									</span>
								</div>
								<div className="flex items-center justify-between rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-800">
									<span>🧴 Косметика</span>
									<span className="font-semibold">
										{formatCurrency(cosmeticsTotal)}
									</span>
								</div>
							</div>

							{selectedLines.length > 0 ? (
								<div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
									<p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
										Позиції
									</p>
									<div className="space-y-1.5">
										{selectedLines.map(({ item, qty }) => (
											<div
												key={item.id}
												className="flex items-center justify-between gap-2 text-xs"
											>
												<span className="text-slate-700">
													{item.shortName} × {qty}
												</span>
												<span className="font-semibold text-slate-900">
													{formatCurrency(item.price * qty)}
												</span>
											</div>
										))}
									</div>
								</div>
							) : null}

							<div className="mt-4 border-t border-blue-100 pt-4">
								<p className="text-sm text-slate-600">До сплати</p>
								<p className="text-3xl font-bold text-blue-700">
									{formatCurrency(total)}
								</p>
							</div>
						</div>

						{error ? (
							<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
								{error}
							</div>
						) : null}

						<div className="space-y-2.5">
							<button
								type="button"
								disabled={loading || total <= 0}
								onClick={() => handlePayment('CASH')}
								className="w-full rounded-2xl border border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 py-4 font-bold text-green-800 shadow-sm transition hover:from-green-100 hover:to-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
							>
								💵 Оплата готівкою
							</button>
							<button
								type="button"
								disabled={loading || total <= 0}
								onClick={() => handlePayment('CARD')}
								className="w-full rounded-2xl border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 py-4 font-bold text-blue-800 shadow-sm transition hover:from-blue-100 hover:to-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
							>
								💳 Оплата карткою
							</button>
						</div>

						<p className="text-center text-xs text-slate-500">
							{loading
								? 'Обробка платежу...'
								: 'Один чек може містити послуги і товари'}
						</p>
					</div>
				</div>
			</div>
		</main>
	)
}

export default function PaymentPage() {
	return (
		<Suspense
			fallback={
				<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-8" />
			}
		>
			<PaymentPageContent />
		</Suspense>
	)
}
