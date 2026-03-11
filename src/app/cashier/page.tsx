'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import EmployeeButton from '@/components/EmployeeButton'
import LogoutButton from '@/components/LogoutButton'
import PageLoader from '@/components/PageLoader'
import useSWR, { useSWRConfig } from 'swr'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/currency'
import BookingCompletionModal from '@/components/BookingCompletionModal'

const fetcher = (url: string) => fetch(url).then(res => res.json())

type Employee = {
	id: number
	name: string
}

type Shift = {
	isOpen: boolean
}

export default function CashierPage() {
	const router = useRouter()
	const { mutate } = useSWRConfig()
	const [shift, setShift] = useState<Shift | null | undefined>(undefined)
	const [completingBooking, setCompletingBooking] = useState<any>(null)

	const { data: session } = useSWR('/api/auth/session', fetcher)
	const { data: usersData, error, isLoading } = useSWR(shift?.isOpen ? '/api/cashier/users' : null, fetcher)
	const employees: Employee[] = Array.isArray(usersData?.data) ? usersData.data : []
	const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
	const bookingsApiUrl = shift?.isOpen ? `/api/appointments/bookings?date=${todayStr}` : null
	const { data: bookingsData, isLoading: bookingsLoading } = useSWR(bookingsApiUrl, fetcher)

	useEffect(() => {
		fetch('/api/cashier/shift')
			.then((res) => res.json())
			.then((json) => setShift(json.shift))
	}, [])

	if (shift === undefined) {
		return <PageLoader message="Завантаження касси…" />
	}

	if (shift === null) {
		return (
			<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-8">
				<div className="page-container">
					<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sm:mb-12">
						<Link href="/" className="flex items-center gap-3 no-underline">
							<div className="text-4xl">💰</div>
							<div>
								<h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
									Каса
								</h1>
								<p className="text-slate-600 text-sm mt-1 font-medium">
									Приймання платежів
								</p>
							</div>
						</Link>
					</div>

					<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 sm:p-12 shadow-xl border border-slate-700/50 flex flex-col items-center justify-center text-center">
						<div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay"></div>
						<div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
						<div className="relative mb-6">
							<div className="w-20 h-20 bg-slate-800/80 rounded-full flex items-center justify-center border border-slate-700 shadow-inner backdrop-blur-sm">
								<span className="text-4xl">🔐</span>
							</div>
							<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-4 border-slate-900"></div>
						</div>
						<h3 className="relative text-2xl font-bold text-white mb-2">
							Каса закрита
						</h3>
						<p className="relative text-slate-400 text-sm sm:text-base max-w-md font-medium">
							Просимо адміністратора відкрити зміну для початку роботи
						</p>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-8">
			<div className="page-container">
				<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
					<div className="flex items-center gap-3 no-underline">
						<div className="text-4xl">💰</div>
						<div>
							<h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
								Каса
							</h1>
							<p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">
								📅{' '}
								{new Date().toLocaleDateString('uk-UA', {
									weekday: 'long',
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</p>
						</div>
					</div>
				</div>

				{!shift.isOpen && (
					<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 sm:p-12 mb-6 sm:mb-8 shadow-xl border border-slate-700/50 flex flex-col items-center justify-center text-center">
						<div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay"></div>
						<div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
						<div className="relative mb-6">
							<div className="w-20 h-20 bg-slate-800/80 rounded-full flex items-center justify-center border border-slate-700 shadow-inner backdrop-blur-sm">
								<span className="text-4xl">🔐</span>
							</div>
							<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-4 border-slate-900"></div>
						</div>
						<h3 className="relative text-2xl font-bold text-white mb-2">
							Зміна закрита
						</h3>
						<p className="relative text-slate-400 text-sm sm:text-base max-w-md">
							Каса тимчасово не працює. Зверніться до адміністратора для відкриття нової зміни.
						</p>
					</div>
				)}

				<div className="mb-6 sm:mb-8">
					<p className="text-slate-600 mt-2 text-sm sm:text-base">
						Виберіть касира для реєстрації платежу
					</p>
				</div>

				{isLoading ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="h-28 rounded-2xl bg-slate-100 border border-slate-200" />
						))}
					</div>
				) : employees.length === 0 ? (
					<div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center border border-slate-200">
						<p className="text-3xl mb-4">📋</p>
						<p className="text-slate-600 text-base sm:text-lg font-medium">
							Немає активних касирів
						</p>
						<p className="text-slate-500 mt-2 text-sm sm:text-base">
							Зверніться до адміністратора
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
						{employees.map((emp) => (
							<EmployeeButton
								key={emp.id}
								employee={emp}
								disabled={!shift.isOpen}
							/>
						))}
					</div>
				)}

				{shift.isOpen && (
					<div className="mt-8 sm:mt-12">
						<div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
							<div>
								<h2 className="text-xl sm:text-2xl font-bold text-slate-900">Сьогоднішні записи</h2>
								<p className="text-slate-500 text-sm mt-1">
									{session?.role === 'ADMIN' ? 'Усі заплановані візити на сьогодні' : 'Ваші заплановані візити на сьогодні'}
								</p>
							</div>
						</div>

						{bookingsLoading ? (
							<div className="bg-white rounded-xl shadow-sm p-8 text-center border border-slate-200">
								<div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600 mx-auto mb-3"></div>
								<p className="text-slate-500 text-sm">Триває пошук записів...</p>
							</div>
						) : !bookingsData?.data || (bookingsData.data.filter((b: any) => b.status === 'BOOKED').length === 0) ? (
							<div className="bg-slate-50 rounded-xl border border-slate-200 border-dashed p-8 text-center">
								<p className="text-2xl mb-2">🗓️</p>
								<p className="text-slate-600 font-medium">Немає активних записів</p>
								<p className="text-slate-400 text-sm mt-1">Очікують на оплату візити відсутні</p>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
								{bookingsData.data
									.filter((b: any) => b.status === 'BOOKED')
									.map((booking: any) => {
										// If ADMIN, user sees all. If USER, user sees only own.
										// Note: The API GET /api/appointments/bookings already filters strictly by barberId if user is not admin
										// However, let's verify visibility just in case.

										const time = new Date(booking.startAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })

										return (
											<button
												key={booking.id}
												onClick={() => setCompletingBooking(booking)}
												className="text-left bg-white border border-slate-200 rounded-2xl p-4 transition-all hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 group"
											>
												<div className="flex justify-between items-start mb-3">
													<div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[13px] font-bold">
														<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
														{time}
													</div>
													<div className="text-right">
														<div className="text-[17px] font-bold text-blue-700">{formatCurrency(booking.totalPrice)}</div>
													</div>
												</div>

												<div className="mb-3">
													<p className="font-bold text-slate-900 text-[15px] truncate">Клієнт: {booking.clientName}</p>
													{session?.role === 'ADMIN' && (
														<p className="text-[13px] text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
															<span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600">{booking.barberName.charAt(0)}</span>
															{booking.barberName}
														</p>
													)}
												</div>

												<div className="flex flex-wrap gap-1.5">
													{booking.services?.map((s: any, i: number) => (
														<span key={i} className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-full">
															{s.name}
														</span>
													))}
												</div>
											</button>
										)
									})}
							</div>
						)}
					</div>
				)}
			</div>

			{completingBooking && (
				<BookingCompletionModal
					booking={completingBooking}
					onClose={() => setCompletingBooking(null)}
					onSuccess={() => {
						setCompletingBooking(null)
						if (bookingsApiUrl) mutate(bookingsApiUrl)
					}}
					allowBarberChange={false} // Specific constraint for cashier
				/>
			)}
		</main>
	)
}
