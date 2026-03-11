'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { useState } from 'react'
import {
	Sun,
	Moon,
	Power,
	Lock,
	ShieldAlert,
	CheckCircle2,
	Clock
} from 'lucide-react'
import ConfirmModal from './ConfirmModal'
import ShiftOpenModal from './ShiftOpenModal'

type Shift = {
	isOpen: boolean
	cashStart: number | null
}

export default function ShiftControl({ onChange }: { onChange?: () => void }) {
	const { data, mutate, isLoading } = useSWR('/api/admin/shift', fetcher)
	const [confirmAction, setConfirmAction] = useState<'open' | 'close' | null>(
		null
	)
	const [isSubmittingAction, setIsSubmittingAction] = useState(false)

	if (isLoading) {
		return (
			<div className="flex items-center gap-3 text-slate-400 animate-pulse py-4">
				<Clock size={20} />
				<span className="text-sm font-bold">Завантаження зміни…</span>
			</div>
		)
	}

	const shift: Shift | null = data.shift

	async function confirmShiftAction() {
		if (!confirmAction || isSubmittingAction) return
		setIsSubmittingAction(true)
		try {
			await fetch('/api/admin/shift', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: confirmAction })
			})

			onChange?.()
			mutate()
			setConfirmAction(null)
		} finally {
			setIsSubmittingAction(false)
		}
	}

	async function confirmShiftOpen(selectedUserIds: number[], cashStartAmount: number) {
		if (isSubmittingAction) return
		setIsSubmittingAction(true)
		try {
			// 1. Fetch all users to know exactly who needs true/false
			const usersRes = await fetch('/api/admin/users')
			if (!usersRes.ok) throw new Error('Failed to fetch users')
			const usersJson = await usersRes.json()
			const allUsers = (usersJson.data || []).filter((u: any) => u.isActive)

			// 2. Open the shift
			const shiftRes = await fetch('/api/admin/shift', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'open' })
			})
			if (!shiftRes.ok) throw new Error('Failed to open shift')

			// 3. Update the daily schedule for all users
			const todayStr = (() => {
				const d = new Date()
				return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
			})()

			const selectedSet = new Set(selectedUserIds)

			// Update schedule sequentially for all active workers
			for (const u of allUsers) {
				const isWorking = selectedSet.has(u.id)
				await fetch('/api/appointments/schedule', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						barberId: u.id,
						schedule: [
							{
								date: todayStr,
								isWorking,
								startHour: 9,
								endHour: 20
							}
						]
					})
				})
			}

			// 4. Set the starting cash
			const cashRes = await fetch('/api/admin/shift', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'cashStart', amount: cashStartAmount })
			})
			if (!cashRes.ok) throw new Error('Failed to set starting cash')

			onChange?.()
			mutate()
			setConfirmAction(null)
		} catch (error) {
			console.error('Failed to open shift with workers:', error)
			alert('Помилка відкриття зміни.')
		} finally {
			setIsSubmittingAction(false)
		}
	}

	if (!shift) {
		return (
			<>
				<div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 sm:p-12 shadow-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8">
					<div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
					<div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

					<div className="relative flex flex-col sm:flex-row items-center gap-8 z-10">
						<div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-inner backdrop-blur-md shrink-0">
							<Sun size={40} className="text-amber-400 animate-pulse" />
						</div>
						<div className="text-center sm:text-left">
							<h2 className="text-3xl font-black text-white mb-2 tracking-tight">
								Зміна не відкрита
							</h2>
							<p className="text-slate-400 text-base max-w-sm leading-relaxed">
								Відкрийте нову зміну, щоб почати прийом платежів та керування касою.
							</p>
						</div>
					</div>
					<button
						onClick={() => setConfirmAction('open')}
						className="relative z-10 group px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.2)] transition-all duration-300 hover:-translate-y-1 active:scale-95 whitespace-nowrap flex items-center gap-3"
					>
						<Power size={22} strokeWidth={3} />
						Відкрити зміну
					</button>
				</div>

				<ShiftOpenModal
					isOpen={confirmAction === 'open'}
					isSubmitting={isSubmittingAction}
					onClose={() => setConfirmAction(null)}
					onConfirm={confirmShiftOpen}
				/>
			</>
		)
	}

	return (
		<>
			<div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
				<div className="relative bg-gradient-to-r from-emerald-50/50 to-teal-50/50 px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
					<div className="flex items-center gap-6">
						<div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
							<div className="relative">
								<Sun size={32} className="text-emerald-500" />
								<div className="absolute -top-1 -right-1 flex h-4 w-4">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
									<span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
								</div>
							</div>
						</div>
						<div>
							<h2 className="text-xl font-black text-slate-900 tracking-tight">
								Поточна зміна
							</h2>
							<p className="text-sm font-bold text-emerald-600/80 uppercase tracking-widest mt-1">
								Активна в реальному часі
							</p>
						</div>
					</div>

					<button
						onClick={() => setConfirmAction('close')}
						className="group px-8 py-4 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 font-black rounded-2xl shadow-sm transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-3 active:scale-95"
					>
						<Moon size={20} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
						Закрити зміну
					</button>
				</div>
			</div>

			<ConfirmModal
				isOpen={confirmAction === 'close'}
				title="Підтвердьте закриття зміни"
				description="Поточна зміна буде завершена і перенесена в архів. Всі дані каси будуть зафіксовані."
				confirmText="Закрити зміну"
				cancelText="Скасувати"
				tone="danger"
				isLoading={isSubmittingAction}
				onClose={() => setConfirmAction(null)}
				onConfirm={confirmShiftAction}
			/>
		</>
	)
}
