'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { useState } from 'react'
import { formatCurrency } from '@/lib/currency'

type Shift = {
	isOpen: boolean
	cashStart: number | null
}

export default function ShiftControl({ onChange }: { onChange?: () => void }) {
	const { data, mutate, isLoading } = useSWR('/api/admin/shift', fetcher)
	const [cashStart, setCashStart] = useState('')

	if (isLoading) {
		return <p>Завантаження зміни…</p>
	}

	const shift: Shift | null = data.shift

	async function openShift() {
		await fetch('/api/admin/shift', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'open' })
		})

		onChange?.()
		mutate() // 🔥 всі оновились
	}

	async function closeShift() {
		await fetch('/api/admin/shift', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'close' })
		})

		onChange?.()
		mutate()
	}

	async function saveCashStart() {
		await fetch('/api/admin/shift', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'cashStart',
				amount: Number(cashStart)
			})
		})

		onChange?.()
		setCashStart('')
		mutate()
	}

	if (!shift) {
		return (
			<div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-6 rounded-lg">
				<h2 className="text-xl font-bold text-blue-900 mb-4">⏰ Керування змінами</h2>
				<p className="text-blue-700 mb-4">Зміна ще не відкрита. Відкрий зміну для роботи.</p>
				<button 
					onClick={openShift}
					className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
				>
					🟢 Відкрити зміну
				</button>
			</div>
		)
	}

	return (
		<div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
			<div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-xl font-bold text-slate-900">⏰ Керування змінами</h2>
						<p className={`text-sm mt-1 font-semibold ${shift.isOpen ? 'text-green-600' : 'text-red-600'}`}>
							{shift.isOpen ? '🟢 Зміна відкрита' : '🔴 Зміна закрита'}
						</p>
					</div>
				</div>
			</div>

			{shift.isOpen && (
				<div className="p-6 space-y-6">
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<label className="block text-sm font-semibold text-slate-700 mb-2">
							Каса на початок (zł)
						</label>
						{shift.cashStart === null ? (
							<div className="flex gap-3">
								<input
									type="number"
									value={cashStart}
									onChange={(e) => setCashStart(e.target.value)}
									placeholder="Введіть суму"
									className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<button 
									onClick={saveCashStart}
									className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
								>
									💾 Зберегти
								</button>
							</div>
						) : (
							<p className="text-sm text-blue-700 mt-2">
								Поточна каса: <strong>{formatCurrency(shift.cashStart)}</strong>
							</p>
						)}
					</div>

					<button 
						onClick={closeShift}
						className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
					>
						🔴 Закрити зміну
					</button>
				</div>
			)}
		</div>
	)
}
