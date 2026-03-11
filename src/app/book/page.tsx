'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { formatCurrency } from '@/lib/currency'
import Link from 'next/link'

type Service = {
	id: number
	name: string
	price: number
	durationMin: number
}

type Barber = {
	id: number
	name: string
}

type Slot = {
	time: string
}

type CalendarDay = {
	value: string
	weekday: string
	day: string
	month: string
}

function ymd(value: Date) {
	const y = value.getFullYear()
	const m = String(value.getMonth() + 1).padStart(2, '0')
	const d = String(value.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

function buildCalendarDays(startOffset = 0, length = 14): CalendarDay[] {
	const now = new Date()
	const days: CalendarDay[] = []
	for (let i = 0; i < length; i += 1) {
		const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + startOffset + i)
		days.push({
			value: ymd(d),
			weekday: d.toLocaleDateString('uk-UA', { weekday: 'short' }),
			day: String(d.getDate()),
			month: d.toLocaleDateString('uk-UA', { month: 'short' })
		})
	}
	return days
}

export default function PublicBookingPage() {
	const [serviceIds, setServiceIds] = useState<number[]>([])
	const [barberId, setBarberId] = useState<number | null>(null)
	const [date, setDate] = useState(ymd(new Date()))
	const [time, setTime] = useState('')
	const [clientName, setClientName] = useState('')
	const [clientPhone, setClientPhone] = useState('')
	const [comment, setComment] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
	const [dateOffset, setDateOffset] = useState(0)
	const calendarDays = useMemo(() => buildCalendarDays(dateOffset, 14), [dateOffset])

	const { data: servicesData, isLoading: servicesLoading } = useSWR('/api/appointments/services', fetcher)
	const services: Service[] = Array.isArray(servicesData?.data) ? servicesData.data : []

	const serviceIdsParam = serviceIds.join(',')
	const { data: barbersData, isLoading: barbersLoading } = useSWR(
		serviceIds.length > 0
			? `/api/appointments/barbers?serviceIds=${encodeURIComponent(serviceIdsParam)}`
			: null,
		fetcher
	)
	const barbers: Barber[] = Array.isArray(barbersData?.data) ? barbersData.data : []

	useEffect(() => {
		if (!barberId) return
		if (barbers.length === 0) return
		if (!barbers.some((barber) => barber.id === barberId)) {
			setBarberId(null)
			setTime('')
			if (step > 2) setStep(2)
		}
	}, [barbers, barberId, step])

	const { data: slotsData, isLoading: slotsLoading } = useSWR(
		barberId && serviceIds.length > 0
			? `/api/appointments/slots?barberId=${barberId}&date=${date}&serviceIds=${encodeURIComponent(serviceIdsParam)}`
			: null,
		fetcher
	)
	const slots: Slot[] = Array.isArray(slotsData?.data) ? slotsData.data : []

	const selectedServices = useMemo(
		() => services.filter((service) => serviceIds.includes(service.id)),
		[services, serviceIds]
	)
	const fallbackTotalPrice = selectedServices.reduce(
		(sum, service) => sum + service.price,
		0
	)
	const totalPrice =
		typeof slotsData?.summary?.totalPrice === 'number'
			? slotsData.summary.totalPrice
			: fallbackTotalPrice
	const totalDuration = selectedServices.reduce(
		(sum, service) => sum + service.durationMin,
		0
	)
	const hasServices = serviceIds.length > 0
	const hasBarber = Boolean(barberId)
	const hasTime = Boolean(time)
	const selectedBarber = barbers.find((b) => b.id === barberId)
	const selectedDay = calendarDays.find((d) => d.value === date)

	const breadcrumbs = [
		{ key: 1 as const, label: 'Послуги', value: selectedServices.length ? `${selectedServices.length} обрано` : null, enabled: true },
		{ key: 2 as const, label: 'Барбер', value: selectedBarber?.name ?? null, enabled: hasServices },
		{ key: 3 as const, label: 'День', value: selectedDay ? `${selectedDay.day} ${selectedDay.month}` : date, enabled: hasServices && hasBarber },
		{ key: 4 as const, label: 'Час', value: time || null, enabled: hasServices && hasBarber },
		{ key: 5 as const, label: 'Контакти', value: clientName || null, enabled: hasServices && hasBarber && hasTime }
	]
	const visibleBreadcrumbs = breadcrumbs.filter((crumb) => crumb.key <= step)

	function toggleService(id: number) {
		setTime('')
		setServiceIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		)
	}

	async function submitBooking() {
		setError(null)
		setSuccess(null)
		if (!clientName.trim() || !barberId || !time || serviceIds.length === 0) {
			setError('Заповніть всі обовʼязкові поля')
			return
		}

		setLoading(true)
		try {
			const res = await fetch('/api/appointments/bookings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					clientName: clientName.trim(),
					clientPhone: clientPhone.trim(),
					comment: comment.trim(),
					barberId,
					date,
					time,
					serviceIds
				})
			})
			const json = await res.json().catch(() => ({}))

			if (!res.ok) {
				setError(json?.message || 'Не вдалося створити запис')
				return
			}

			setSuccess('Запис створено успішно. Дякуємо! Наш адміністратор звʼяжеться з вами найближчим часом.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
			<div className="mx-auto max-w-3xl">
				{/* Header Section */}
				<div className="mb-6 flex items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
							Онлайн-запис
						</h1>
						<p className="mt-1 text-[15px] font-medium text-slate-500">
							Оберіть послуги, майстра та зручний час
						</p>
					</div>
					<Link
						href="/"
						className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-900"
					>
						На головну
					</Link>
				</div>

				<div className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
					{/* Progress Steps (Breadcrumbs) */}
					<div className="mb-8 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-inset ring-slate-100 p-1">
						<div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
							{visibleBreadcrumbs.map((crumb) => {
								const active = step === crumb.key
								const isPast = step > crumb.key

								return (
									<button
										key={crumb.key}
										type="button"
										onClick={() => {
											if (crumb.enabled) {
												setStep(crumb.key)
												setSuccess(null)
												setError(null)
											}
										}}
										disabled={!crumb.enabled}
										className={`group relative flex flex-1 items-center justify-between overflow-hidden rounded-xl px-4 py-3 text-left transition-all sm:justify-start sm:px-3 sm:py-2.5 ${active
											? 'bg-white shadow-sm ring-1 ring-slate-200/60 z-10'
											: crumb.enabled
												? 'hover:bg-slate-100 cursor-pointer'
												: 'opacity-60 grayscale cursor-not-allowed'
											}`}
									>
										<div className="flex items-center gap-3">
											<span
												className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${active
													? 'bg-blue-600 text-white'
													: isPast
														? 'bg-slate-900 text-white group-hover:bg-blue-600'
														: 'bg-slate-200/80 text-slate-500'
													}`}
											>
												{isPast ? (
													<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
													</svg>
												) : (
													crumb.key
												)}
											</span>
											<div className="flex flex-col">
												<span
													className={`text-[13px] font-bold tracking-tight transition-colors ${active ? 'text-blue-600' : isPast ? 'text-slate-900 group-hover:text-blue-700' : 'text-slate-600'
														}`}
												>
													{crumb.label}
												</span>
												{crumb.value && (
													<span className="text-[11px] font-medium text-slate-500 truncate max-w-[100px] sm:max-w-[80px]">
														{crumb.value}
													</span>
												)}
											</div>
										</div>
									</button>
								)
							})}
						</div>
					</div>

					<div className="mt-2 flex-1 flex flex-col min-h-0 overflow-x-hidden">
						{step === 1 ? (
							<div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
								<div className="flex-none">
									<h2 className="text-xl font-bold text-slate-900">Оберіть послуги</h2>
									<p className="mt-1 mb-6 text-sm text-slate-500">Ви можете обрати одну або декілька послуг</p>
								</div>

								<div className="flex-1 overflow-y-auto pr-2 -mr-2 pb-4 scrollbar-thin">
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
										{servicesLoading ? (
											Array.from({ length: 3 }).map((_, i) => (
												<div key={i} className="flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-inset ring-slate-100 h-[88px] animate-pulse">
													<div className="h-5 w-2/3 rounded-md bg-slate-200 mb-4"></div>
													<div className="flex items-center gap-2 mt-auto">
														<div className="h-6 w-16 rounded-md bg-slate-200"></div>
														<div className="h-4 w-10 rounded-md bg-slate-200"></div>
													</div>
												</div>
											))
										) : services.map((service) => {
											const active = serviceIds.includes(service.id)
											return (
												<button
													key={service.id}
													type="button"
													onClick={() => toggleService(service.id)}
													className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 text-left transition-all min-h-[90px] ${active
														? 'bg-blue-50/50 ring-2 ring-inset ring-blue-600 shadow-sm'
														: 'bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300'
														}`}
												>
													<div className="flex items-start gap-2 mb-3">
														<h3 className={`font-bold text-[14px] leading-snug transition-colors pr-1 ${active ? 'text-blue-900' : 'text-slate-900'}`}>
															{service.name}
														</h3>
													</div>
													<div className="flex items-center gap-2 mt-auto">
														<span className={`inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-bold ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200/60'}`}>
															{formatCurrency(service.price)}
														</span>
														<span className="text-[11px] font-medium text-slate-500">
															{service.durationMin} хв
														</span>
													</div>
												</button>
											)
										})}
									</div>
								</div>

								<div className="flex-none mt-auto flex justify-end pt-4 mt-2 border-t border-slate-100 bg-white">
									<button
										type="button"
										onClick={() => setStep(2)}
										disabled={!hasServices}
										className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3.5 text-[15px] font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
									>
										Продовжити
										<svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
										</svg>
									</button>
								</div>
							</div>
						) : null}

						{step === 2 ? (
							<div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
								<div className="flex-none">
									<h2 className="text-xl font-bold text-slate-900">Оберіть майстра</h2>
									<p className="mt-1 mb-6 text-sm text-slate-500">Ми показуємо тільки тих, хто виконує обрані послуги</p>
								</div>

								<div className="flex-1 overflow-y-auto pr-2 -mr-2 pb-4 scrollbar-thin">
									{barbersLoading ? (
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
											{Array.from({ length: 3 }).map((_, i) => (
												<div key={i} className="flex items-center gap-4 overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-inset ring-slate-100 h-[88px] animate-pulse">
													<div className="h-12 w-12 rounded-full bg-slate-200 shrink-0"></div>
													<div className="flex flex-col gap-2 w-full">
														<div className="h-5 w-2/3 rounded-md bg-slate-200"></div>
														<div className="h-4 w-1/3 rounded-md bg-slate-200"></div>
													</div>
												</div>
											))}
										</div>
									) : barbers.length === 0 ? (
										<div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center mb-8">
											<div className="rounded-full bg-white p-3 shadow-sm mb-4">
												<svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
												</svg>
											</div>
											<h3 className="text-[15px] font-bold text-slate-900">Немає вільних майстрів</h3>
											<p className="mt-1 text-sm text-slate-500 max-w-sm">На жаль, під вашу комбінацію послуг зараз немає вільних барберів.</p>
											<button type="button" onClick={() => setStep(1)} className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">Змінити послуги</button>
										</div>
									) : (
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
											{barbers.map((barber) => {
												const active = barberId === barber.id
												return (
													<button
														key={barber.id}
														type="button"
														onClick={() => { setTime(''); setBarberId(barber.id); setStep(3) }}
														className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl p-4 text-left transition-all ${active
															? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-transparent'
															: 'bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 hover:shadow-sm text-slate-900'
															}`}
													>
														<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold text-lg shadow-sm transition-colors ${active ? 'bg-white/20 text-white border border-white/30' : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 border border-slate-300/50'
															}`}>
															{barber.name[0].toUpperCase()}
														</div>
														<div className="flex flex-col">
															<span className="font-bold text-[16px]">{barber.name}</span>
															<span className={`text-[13px] font-medium leading-tight ${active ? 'text-blue-100' : 'text-slate-500'}`}>
																Топ-барбер
															</span>
														</div>
													</button>
												)
											})}
										</div>
									)}
								</div>

								<div className="flex-none mt-auto flex justify-between pt-4 mt-2 border-t border-slate-100 bg-white">
									<button
										type="button"
										onClick={() => setStep(1)}
										className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-[15px] font-bold text-slate-700 ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
									>
										Назад
									</button>
								</div>
							</div>
						) : null}

						{step === 3 ? (
							<div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
								<div className="flex-none">
									<h2 className="text-xl font-bold text-slate-900">Оберіть день</h2>
									<div className="mt-1 mb-6 flex items-center justify-between">
										<p className="text-sm text-slate-500">Графік майстра на найближчі дні</p>
										<div className="flex gap-1.5 ml-4">
											<button type="button" onClick={() => setDateOffset(prev => prev - 14)} disabled={dateOffset <= 0} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:pointer-events-none">
												<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
											</button>
											<button type="button" onClick={() => setDateOffset(prev => prev + 14)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
												<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
											</button>
										</div>
									</div>
								</div>

								<div className="flex-1 overflow-y-auto pr-2 -mr-2 pb-4 pt-1 px-1 scrollbar-thin">
									<div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
										{calendarDays.map((day) => {
											const active = date === day.value
											return (
												<button
													key={day.value}
													type="button"
													onClick={() => { setTime(''); setDate(day.value); setStep(4) }}
													className={`group relative flex min-w-[90px] flex-col items-center justify-center overflow-hidden rounded-2xl py-3 transition-all ${active
														? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2 z-10'
														: 'bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 hover:shadow-sm text-slate-700'
														}`}
												>
													<span className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${active ? 'text-blue-100' : 'text-slate-400 group-hover:text-blue-500'}`}>
														{day.weekday}
													</span>
													<span className="text-[22px] font-black tracking-tight leading-none mb-1">
														{day.day}
													</span>
													<span className={`text-[10px] uppercase font-bold ${active ? 'text-blue-100' : 'text-slate-500'}`}>
														{day.month}
													</span>
												</button>
											)
										})}
									</div>
								</div>

								<div className="flex-none mt-auto flex justify-between pt-4 mt-2 border-t border-slate-100 bg-white">
									<button
										type="button"
										onClick={() => setStep(2)}
										className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-[15px] font-bold text-slate-700 ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
									>
										Назад
									</button>
								</div>
							</div>
						) : null}

						{step === 4 ? (
							<div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
								<div className="flex-none">
									<h2 className="text-xl font-bold text-slate-900">Оберіть час</h2>
									<p className="mt-1 mb-6 text-sm text-slate-500">
										Вільні години на <span className="font-bold text-slate-700">{selectedDay ? `${selectedDay.day} ${selectedDay.month}` : date}</span>
									</p>
								</div>

								<div className="flex-1 overflow-y-auto pr-2 -mr-2 pb-4 pt-1 px-1 scrollbar-thin">
									{slotsLoading ? (
										<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-8">
											{Array.from({ length: 10 }).map((_, i) => (
												<div key={i} className="flex h-[52px] w-full items-center justify-center rounded-xl bg-white ring-1 ring-inset ring-slate-100 animate-pulse">
													<div className="h-4 w-12 rounded-md bg-slate-200"></div>
												</div>
											))}
										</div>
									) : slots.length === 0 ? (
										<div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center mb-8">
											<div className="rounded-full bg-white p-3 shadow-sm mb-4">
												<svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
											</div>
											<h3 className="text-[15px] font-bold text-slate-900">Немає вільних годин</h3>
											<p className="mt-1 text-sm text-slate-500 max-w-sm">На жаль, на цей день всі місця до майстра вже зайняті.</p>
											<button type="button" onClick={() => setStep(3)} className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">Обрати інший день</button>
										</div>
									) : (
										<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 mb-8">
											{slots.map((slot) => {
												const active = time === slot.time
												return (
													<button
														key={slot.time}
														type="button"
														onClick={() => { setTime(slot.time); setStep(5) }}
														className={`flex items-center justify-center rounded-xl py-3.5 text-[15px] font-bold transition-all ${active
															? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-transparent scale-105'
															: 'bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 hover:shadow-sm text-slate-700'
															}`}
													>
														{slot.time}
													</button>
												)
											})}
										</div>
									)}
								</div>

								<div className="flex-none mt-auto flex justify-between pt-4 mt-2 border-t border-slate-100 bg-white">
									<button
										type="button"
										onClick={() => setStep(3)}
										className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-[15px] font-bold text-slate-700 ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
									>
										Назад
									</button>
								</div>
							</div>
						) : null}

						{step === 5 ? (
							<div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
								{success ? (
									<div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
										<div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 mb-6 shadow-sm">
											<svg className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
											</svg>
										</div>
										<h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Запис підтверджено!</h2>
										<p className="text-[15px] font-medium text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
											Дякуємо, {clientName}! {success} Ми чекаємо на вас у визначений час.
										</p>
										<button
											type="button"
											onClick={() => {
												setStep(1)
												setSuccess(null)
												setServiceIds([])
												setBarberId(null)
												setDate(ymd(new Date()))
												setTime('')
												setClientName('')
												setClientPhone('')
												setComment('')
											}}
											className="inline-flex min-w-[200px] items-center justify-center rounded-xl bg-slate-900 px-8 py-4 text-[16px] font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
										>
											Новий запис
										</button>
									</div>
								) : (
									<>
										<div className="flex-none">
											<h2 className="text-xl font-bold text-slate-900">Ваші контакти</h2>
											<p className="mt-1 mb-6 text-sm text-slate-500">Залиште дані, щоб ми могли підтвердити запис</p>
										</div>

										<div className="flex-1 overflow-y-auto pr-2 -mr-2 pb-4 scrollbar-thin">
											<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
												<div className="space-y-1.5">
													<label htmlFor="clientName" className="text-[13px] font-bold text-slate-700">Ваше ім'я <span className="text-red-500">*</span></label>
													<input
														id="clientName"
														type="text"
														value={clientName}
														onChange={(e) => setClientName(e.target.value)}
														placeholder="Олександр"
														className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
													/>
												</div>
												<div className="space-y-1.5">
													<label htmlFor="clientPhone" className="text-[13px] font-bold text-slate-700">Телефон <span className="text-red-500">*</span></label>
													<input
														id="clientPhone"
														type="text"
														value={clientPhone}
														onChange={(e) => setClientPhone(e.target.value)}
														placeholder="+380 00 000 00 00"
														className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
													/>
												</div>
											</div>

											<div className="space-y-1.5 mb-6">
												<label htmlFor="comment" className="text-[13px] font-bold text-slate-700">Коментар <span className="text-slate-400 font-medium">(необов'язково)</span></label>
												<textarea
													id="comment"
													value={comment}
													onChange={(e) => setComment(e.target.value)}
													placeholder="Наприклад: хочу стрижку fade"
													className="min-h-[100px] w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 line-clamp-3"
												/>
											</div>

											<div className="mb-6 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-inset ring-slate-200">
												<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4">
													<div className="mb-2 sm:mb-0">
														<p className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">Підсумок</p>
														<p className="font-semibold text-slate-900 mt-0.5">{selectedServices.length} послуг(и), {selectedDay?.day} {selectedDay?.month} о {time}</p>
													</div>
													<div className="flex items-baseline gap-2 text-right">
														<span className="text-2xl font-black text-blue-600">{formatCurrency(totalPrice)}</span>
														<span className="text-[13px] font-bold text-slate-500">· {totalDuration} хв</span>
													</div>
												</div>
											</div>

											{error ? (
												<div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
													<svg className="h-5 w-5 mt-0.5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													<div>
														<h4 className="font-bold text-red-800 text-[14px]">Помилка</h4>
														<p className="text-[14px] text-red-700 mt-0.5 leading-snug">{error}</p>
													</div>
												</div>
											) : null}
										</div>

										<div className="flex-none mt-auto flex items-center justify-between pt-4 mt-2 border-t border-slate-100 bg-white">
											<button
												type="button"
												onClick={() => {
													setStep(4)
													setSuccess(null)
													setError(null)
												}}
												className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-[15px] font-bold text-slate-700 ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
											>
												Назад
											</button>
											<button
												type="button"
												onClick={submitBooking}
												disabled={loading || !!success}
												className="inline-flex min-w-[140px] items-center justify-center rounded-xl bg-blue-600 px-8 py-3.5 text-[15px] font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 disabled:pointer-events-none disabled:bg-slate-300 disabled:shadow-none"
											>
												{loading ? (
													<div className="flex items-center gap-2">
														<div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white" />
														<span>Обробка...</span>
													</div>
												) : (
													'Підтвердити запис'
												)}
											</button>
										</div>
									</>
								)}
							</div>
						) : null}
					</div>
				</div>
			</div >
		</main >
	)
}
