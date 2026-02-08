'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import EmployeeButton from '@/components/EmployeeButton'
import LogoutButton from '@/components/LogoutButton'

type Employee = {
	id: number
	name: string
}

type Shift = {
	isOpen: boolean
}

export default function CashierPage() {
	const [shift, setShift] = useState<Shift | null | undefined>(undefined)
	const [employees, setEmployees] = useState<Employee[]>([])

	useEffect(() => {
		fetch('/api/cashier/shift')
			.then((res) => res.json())
			.then((json) => setShift(json.shift))

		fetch('/api/cashier/users')
			.then((res) => res.json())
			.then((json) => setEmployees(json.data ?? []))
	}, [])

	if (shift === undefined) {
		return (
			<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-slate-600 text-base sm:text-lg">
						Завантаження касси…
					</p>
				</div>
			</main>
		)
	}

	if (shift === null) {
		return (
			<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-8">
				<div className="max-w-2xl mx-auto">
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
						<LogoutButton />
					</div>

					<div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5 sm:p-8 text-center shadow-md">
						<div className="text-5xl sm:text-6xl mb-4">🔒</div>
						<h2 className="text-2xl sm:text-3xl font-bold text-red-900 mb-3">
							🔒 Каса закрита
						</h2>
						<p className="text-red-700 text-base sm:text-lg font-medium">
							Просимо адміністратора відкрити касу для роботи
						</p>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-8">
			<div className="max-w-5xl mx-auto">
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
					<div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 mb-6 sm:mb-8 shadow-sm">
						<p className="text-amber-800 font-semibold text-sm sm:text-base">
							🔒 Зміна закрита. Зверніться до адміністратора
						</p>
					</div>
				)}

				<div className="mb-6 sm:mb-8">
					<p className="text-slate-600 mt-2 text-sm sm:text-base">
						Виберіть касира для реєстрації платежу
					</p>
				</div>

				{employees.length === 0 ? (
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
			</div>
		</main>
	)
}
