'use client'

import useSWR, { mutate } from 'swr'
import { useState } from 'react'
import ConfirmModal from '@/components/ConfirmModal'
import { formatCurrency } from '@/lib/currency'
import { normalizeExpenseComment } from '@/lib/expenseComment'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type UserRow = {
	id: number
	name: string
	login: string
	role: 'ADMIN' | 'USER'
	isActive: boolean
	barberPercent: number
	cosmeticsPercent: number
	salaryStats?: {
		monthBarber: number
		monthCosmetics: number
		dayBarber: number
		dayCosmetics: number
		monthSalary: number
		daySalary: number
		paidMonthSalary: number
		paidDaySalary: number
		monthSalaryDue: number
		daySalaryDue: number
	}
}

type MonthExpense = {
	id: number
	amount: number
	createdAt: string
	shiftId: number
	comment: string
	category: 'SALARY' | 'RENT' | 'UTILITIES' | 'OTHER'
	salaryUserId: number | null
}

export default function UsersAdminPage() {
	const { data, isLoading, error } = useSWR('/api/admin/users', fetcher)

	const [login, setLogin] = useState('')
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [role, setRole] = useState<'USER' | 'ADMIN'>('USER')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [successMessage, setSuccessMessage] = useState('')
	const [formError, setFormError] = useState('')
	const [userToDelete, setUserToDelete] = useState<{
		id: number
		name: string
	} | null>(null)
	const [isDeletingUser, setIsDeletingUser] = useState(false)
	const [salaryDrafts, setSalaryDrafts] = useState<
		Record<number, { barberPercent: number; cosmeticsPercent: number }>
	>({})
	const [salaryInputDrafts, setSalaryInputDrafts] = useState<
		Record<number, { barberPercent: string; cosmeticsPercent: string }>
	>({})
	const [savingSalaryUserId, setSavingSalaryUserId] = useState<number | null>(null)
	const [payingSalaryUserId, setPayingSalaryUserId] = useState<number | null>(null)
	const [rentAmountDraft, setRentAmountDraft] = useState('')
	const [savingRent, setSavingRent] = useState(false)
	const [expenseToDelete, setExpenseToDelete] = useState<MonthExpense | null>(null)
	const [isDeletingExpense, setIsDeletingExpense] = useState(false)

	async function create(e: React.FormEvent) {
		e.preventDefault()
		setFormError('')

		if (!login || !password || !name) {
			setFormError('Заповніть усі поля')
			return
		}

		setIsSubmitting(true)

		try {
			const res = await fetch('/api/admin/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					login,
					password,
					name,
					role
				})
			})

			if (res.ok) {
				setLogin('')
				setPassword('')
				setName('')
				setRole('USER')
				setSuccessMessage('✅ Користувач успішно створений!')
				setTimeout(() => setSuccessMessage(''), 3000)
				mutate('/api/admin/users')
			}
		} catch (error) {
			console.error(error)
			setFormError('Не вдалося створити користувача')
		} finally {
			setIsSubmitting(false)
		}
	}

	async function confirmDeleteUser() {
		if (!userToDelete || isDeletingUser) return

		setIsDeletingUser(true)
		try {
			await fetch(`/api/admin/users/${userToDelete.id}`, {
				method: 'DELETE'
			})

			mutate('/api/admin/users')
			setUserToDelete(null)
		} finally {
			setIsDeletingUser(false)
		}
	}

	async function restore(id: number) {
		await fetch(`/api/admin/users/${id}/restore`, {
			method: 'PATCH'
		})

		mutate('/api/admin/users')
	}

	function getSalaryDraft(user: UserRow) {
		return (
			salaryDrafts[user.id] ?? {
				barberPercent: user.barberPercent ?? 0,
				cosmeticsPercent: user.cosmeticsPercent ?? 0
			}
		)
	}

	function updateSalaryDraft(
		userId: number,
		field: 'barberPercent' | 'cosmeticsPercent',
		value: number
	) {
		const normalized = Number.isFinite(value)
			? Math.max(0, Math.min(100, value))
			: 0
		setSalaryDrafts((prev) => {
			const current = prev[userId] ?? {
				barberPercent: 0,
				cosmeticsPercent: 0
			}
			return {
				...prev,
				[userId]: {
					...current,
					[field]: normalized
				}
			}
		})
	}

	function getSalaryInputDraft(user: UserRow) {
		const numeric = getSalaryDraft(user)
		return (
			salaryInputDrafts[user.id] ?? {
				barberPercent: String(numeric.barberPercent),
				cosmeticsPercent: String(numeric.cosmeticsPercent)
			}
		)
	}

	function updateSalaryInputDraft(
		user: UserRow,
		field: 'barberPercent' | 'cosmeticsPercent',
		rawValue: string
	) {
		if (!/^\d*$/.test(rawValue)) return

		setSalaryInputDrafts((prev) => {
			const current = getSalaryInputDraft(user)
			return {
				...prev,
				[user.id]: {
					...current,
					[field]: rawValue
				}
			}
		})

		if (rawValue === '') {
			updateSalaryDraft(user.id, field, 0)
			return
		}

		updateSalaryDraft(user.id, field, Number(rawValue))
	}

	function commitSalaryInputDraft(
		user: UserRow,
		field: 'barberPercent' | 'cosmeticsPercent'
	) {
		const input = getSalaryInputDraft(user)
		const rawValue = input[field]
		const normalized =
			rawValue === '' ? 0 : Math.max(0, Math.min(100, Number(rawValue)))
		updateSalaryDraft(user.id, field, normalized)

		setSalaryInputDrafts((prev) => {
			const current = getSalaryInputDraft(user)
			return {
				...prev,
				[user.id]: {
					...current,
					[field]: String(normalized)
				}
			}
		})
	}

	function getSalaryPreview(user: UserRow) {
		const draft = getSalaryDraft(user)
		const dayBarber = user.salaryStats?.dayBarber ?? 0
		const dayCosmetics = user.salaryStats?.dayCosmetics ?? 0
		const monthBarber = user.salaryStats?.monthBarber ?? 0
		const monthCosmetics = user.salaryStats?.monthCosmetics ?? 0

		const day = (dayBarber * draft.barberPercent) / 100 + (dayCosmetics * draft.cosmeticsPercent) / 100
		const month =
			(monthBarber * draft.barberPercent) / 100 +
			(monthCosmetics * draft.cosmeticsPercent) / 100

		const paidDay = user.salaryStats?.paidDaySalary ?? 0
		const paidMonth = user.salaryStats?.paidMonthSalary ?? 0

		return {
			day,
			month,
			dayDue: Math.max(0, day - paidDay),
			monthDue: Math.max(0, month - paidMonth),
			paidDay,
			paidMonth
		}
	}

	async function saveSalary(user: UserRow) {
		const draft = getSalaryDraft(user)
		if (savingSalaryUserId === user.id) return

		setSavingSalaryUserId(user.id)
		try {
			const res = await fetch(`/api/admin/users/${user.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					barberPercent: draft.barberPercent,
					cosmeticsPercent: draft.cosmeticsPercent
				})
			})

			if (!res.ok) {
				const json = await res.json().catch(() => ({}))
				setFormError(
					json?.message || 'Не вдалося зберегти налаштування зарплати'
				)
				return
			}

			mutate('/api/admin/users')
		} finally {
			setSavingSalaryUserId(null)
		}
	}

	async function issueSalary(user: UserRow) {
		const preview = getSalaryPreview(user)
		if (preview.monthDue <= 0 || payingSalaryUserId === user.id) return

		setPayingSalaryUserId(user.id)
		try {
			const res = await fetch('/api/admin/expenses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					amount: Math.round(preview.monthDue),
					category: 'SALARY',
					salaryUserId: user.id,
					comment: `Зарплата: ${user.name || user.login}`
				})
			})

			if (!res.ok) {
				const json = await res.json().catch(() => ({}))
				setFormError(json?.message || 'Не вдалося видати зарплату')
				return
			}

			mutate('/api/admin/users')
			mutate('/api/admin/day')
			mutate('/api/admin/expenses')
		} finally {
			setPayingSalaryUserId(null)
		}
	}

	async function confirmDeleteExpense() {
		if (!expenseToDelete || isDeletingExpense) return
		setIsDeletingExpense(true)
		try {
			await fetch(`/api/admin/expenses/${expenseToDelete.id}`, {
				method: 'DELETE'
			})

			setExpenseToDelete(null)
			mutate('/api/admin/users')
			mutate('/api/admin/expenses')
		} finally {
			setIsDeletingExpense(false)
		}
	}

	async function saveRentAmount() {
		if (savingRent) return
		setFormError('')
		const amount = Number(rentAmountDraft)
		if (Number.isNaN(amount) || amount < 0) {
			setFormError('Сума оренди має бути 0 або більше')
			return
		}

		setSavingRent(true)
		try {
			const res = await fetch('/api/admin/settings/rent', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ rentAmount: amount })
			})
			if (!res.ok) {
				const json = await res.json().catch(() => ({}))
				setFormError(json?.message || 'Не вдалося зберегти суму оренди')
				return
			}

			mutate('/api/admin/users')
		} finally {
			setSavingRent(false)
		}
	}

	if (isLoading) {
		return (
			<main className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-0">
				<div className="w-full">
					<div className="flex items-center justify-center py-20">
						<div className="text-center">
							<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
							<p className="text-slate-600 text-lg">
								Завантаження користувачів…
							</p>
						</div>
					</div>
				</div>
			</main>
		)
	}

	if (error) {
		return (
			<main className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-0">
				<div className="w-full">
					<div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-8 text-red-900 font-semibold">
						Не вдалося завантажити користувачів
					</div>
				</div>
			</main>
		)
	}

	const users: UserRow[] = Array.isArray(data?.data) ? data.data : []
	const monthExpenses: MonthExpense[] = Array.isArray(data?.monthExpenses)
		? data.monthExpenses
		: []
	const rentAmount =
		typeof data?.rentAmount === 'number' && Number.isFinite(data.rentAmount)
			? data.rentAmount
			: 0
	const effectiveRentDraft = rentAmountDraft === '' ? String(rentAmount) : rentAmountDraft
	const salaryMonthExpenses = monthExpenses.filter(
		(expense) => expense.category === 'SALARY'
	)

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-0">
			<div className="w-full">
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-slate-900">
						👥 Управління користувачами
					</h1>
					<p className="text-slate-600 mt-2 text-lg">
						Створення та видалення облікових записів касирів
					</p>
				</div>

				{successMessage && (
					<div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-8 text-green-900 font-semibold">
						{successMessage}
					</div>
				)}

				{formError && (
					<div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-8 text-red-900 font-semibold">
						{formError}
					</div>
				)}

				{/* ➕ CREATE FORM */}
				<div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8 mb-8">
					<h2 className="text-2xl font-bold text-slate-900 mb-6">
						➕ Додати нового користувача
					</h2>

					<form onSubmit={create} className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-semibold text-slate-700 mb-2">
									👤 Імʼя
								</label>
								<input
									type="text"
									placeholder="Наприклад: Іван Петренко"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-colors"
								/>
							</div>

							<div>
								<label className="block text-sm font-semibold text-slate-700 mb-2">
									🔑 Логін
								</label>
								<input
									type="text"
									placeholder="Наприклад: ivan_pet"
									value={login}
									onChange={(e) => setLogin(e.target.value)}
									className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-colors"
								/>
							</div>

							<div>
								<label className="block text-sm font-semibold text-slate-700 mb-2">
									🔐 Пароль
								</label>
								<input
									type="password"
									placeholder="Введіть пароль"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-colors"
								/>
							</div>
						</div>

						<div>
							<p className="block text-sm font-semibold text-slate-700 mb-2">
								🛡️ Роль
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<button
									type="button"
									onClick={() => setRole('USER')}
									className={`text-left rounded-xl border-2 p-4 transition-all ${
										role === 'USER'
											? 'border-blue-500 bg-blue-50 shadow-sm'
											: 'border-slate-200 bg-white hover:border-slate-300'
									}`}
								>
									<p className="font-semibold text-slate-900">🧑 Касир</p>
									<p className="text-xs text-slate-600 mt-1">
										Доступ до каси та власної статистики
									</p>
								</button>
								<button
									type="button"
									onClick={() => setRole('ADMIN')}
									className={`text-left rounded-xl border-2 p-4 transition-all ${
										role === 'ADMIN'
											? 'border-purple-500 bg-purple-50 shadow-sm'
											: 'border-slate-200 bg-white hover:border-slate-300'
									}`}
								>
									<p className="font-semibold text-slate-900">
										👑 Адміністратор
									</p>
									<p className="text-xs text-slate-600 mt-1">
										Повний доступ до керування системою
									</p>
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
								isSubmitting
									? 'bg-slate-300 text-slate-500 cursor-not-allowed'
									: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl'
							}`}
						>
							{isSubmitting ? '⏳ Створення…' : '✅ Створити користувача'}
						</button>
					</form>
				</div>

				{/* 📋 USERS LIST */}
				{users && users.length > 0 ? (
					<div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
						<div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4">
							<h2 className="text-2xl font-bold">
								👥 Користувачі ({users.length})
							</h2>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-slate-50 border-b border-slate-200">
									<tr>
										<th className="px-6 py-3 text-left font-bold text-slate-700">
											ID
										</th>
										<th className="px-6 py-3 text-left font-bold text-slate-700">
											Імʼя
										</th>
										<th className="px-6 py-3 text-left font-bold text-slate-700">
											Логін
										</th>
										<th className="px-6 py-3 text-center font-bold text-slate-700">
											Роль
										</th>
										<th className="px-6 py-3 text-center font-bold text-slate-700">
											Статус
										</th>
										<th className="px-6 py-3 text-center font-bold text-slate-700">
											Дія
										</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-slate-200">
									{users.map((u: UserRow, index: number) => (
										<tr
											key={u.id}
											className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
										>
											<td className="px-6 py-4">
												<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
													{u.id}
												</span>
											</td>
											<td className="px-6 py-4">
												<span className="font-semibold text-slate-900">
													👤 {u.name}
												</span>
											</td>
											<td className="px-6 py-4">
												<code className="bg-slate-100 text-slate-800 px-3 py-1 rounded font-mono text-sm">
													{u.login}
												</code>
											</td>
											<td className="px-6 py-4 text-center">
												<span
													className={`inline-block px-3 py-1 rounded-lg font-semibold text-sm ${
														u.role === 'ADMIN'
															? 'bg-red-100 text-red-700'
															: 'bg-blue-100 text-blue-700'
													}`}
												>
													{u.role === 'ADMIN' ? '👑 Адмін' : '🧑 Касир'}
												</span>
											</td>
											<td className="px-6 py-4 text-center">
												{u.isActive ? (
													<span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-100 text-green-700 font-semibold">
														🟢 Активний
													</span>
												) : (
													<span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-100 text-red-700 font-semibold">
														🔴 Видален
													</span>
												)}
											</td>
											<td className="px-6 py-4 text-center">
												{u.isActive ? (
													<button
														onClick={() =>
															setUserToDelete({
																id: u.id,
																name: u.name || u.login
															})
														}
														className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold transition-all shadow-sm hover:shadow-md hover:scale-105"
													>
														🗑️ Видалити
													</button>
												) : (
													<button
														onClick={() => restore(u.id)}
														className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition-all shadow-sm hover:shadow-md hover:scale-105"
													>
														↩️ Відновити
													</button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
							<p className="text-sm text-slate-600">
								<span className="font-semibold">{users.length}</span> користувач
								{users.length % 10 === 1 && users.length !== 11 ? '' : 'ів'} у
								системі
							</p>
						</div>
					</div>
				) : (
					<div className="bg-white rounded-lg shadow-md p-12 text-center border border-slate-200">
						<p className="text-3xl mb-4">👥</p>
						<p className="text-slate-600 text-lg font-medium">
							Немає користувачів
						</p>
						<p className="text-slate-500 mt-2">
							Створіть першого касира скориставшись формою вище
						</p>
					</div>
				)}

				{users && users.length > 0 && (
					<div className="mt-8 bg-white rounded-lg shadow-lg border border-slate-200 p-6">
						<h2 className="text-2xl font-bold text-slate-900 mb-2">🏢 Оренда</h2>
						<p className="text-sm text-slate-600 mb-4">
							Фіксована сума за місяць. В архіві можна додати оренду тільки 1 раз на місяць.
						</p>
						<div className="flex flex-col sm:flex-row gap-3 items-start">
							<input
								type="number"
								min={0}
								value={effectiveRentDraft}
								onChange={(e) => setRentAmountDraft(e.target.value)}
								className="w-full sm:w-56 rounded-lg border border-slate-300 bg-white px-3 py-2"
								placeholder="Сума оренди"
							/>
							<button
								type="button"
								onClick={saveRentAmount}
								disabled={savingRent}
								className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300"
							>
								{savingRent ? 'Збереження...' : 'Зберегти оренду'}
							</button>
							<div className="text-sm text-slate-600">
								Поточна: <span className="font-semibold">{formatCurrency(rentAmount)}</span>
							</div>
						</div>
					</div>
				)}

				{users && users.length > 0 && (
					<div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
						<div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
							<h2 className="text-2xl font-bold">💸 Зарплата працівників</h2>
							<p className="mt-1 text-sm text-emerald-100">
								Налаштування відсотків і швидка видача зарплати.
							</p>
						</div>
						<div className="p-6">
							<p className="text-sm text-slate-600 mb-5">
							Вкажіть відсоток від типу послуги для кожного працівника.
						</p>

						{users.filter((u) => u.isActive).length === 0 ? (
							<div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
								Немає активних працівників для налаштування зарплати.
							</div>
						) : (
							<div className="space-y-5">
								{users
									.filter((u) => u.isActive)
									.map((u) => {
									const draft = getSalaryDraft(u)
									const inputDraft = getSalaryInputDraft(u)
									const salaryPreview = getSalaryPreview(u)
									return (
										<div
											key={u.id}
											className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"
										>
											<div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
												<div className="min-w-0">
													<p className="truncate text-lg font-bold text-slate-900">
														{u.name}
													</p>
													<p className="truncate text-xs text-slate-500">{u.login}</p>
												</div>
												<div className="rounded-xl bg-slate-900 px-3 py-2 text-right text-white">
													<p className="text-[11px] uppercase tracking-wide text-slate-300">
														До видачі
													</p>
													<p className="text-base font-bold">
														{formatCurrency(salaryPreview.monthDue)}
													</p>
												</div>
											</div>

											<div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
												<div className="space-y-3">
													<div className="rounded-xl border border-slate-200 bg-white p-3">
														<div className="mb-2 flex items-center justify-between gap-2">
															<span className="text-sm font-semibold text-slate-800">
																✂️ Барбер
															</span>
															<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
																{draft.barberPercent}%
															</span>
														</div>
														<div className="flex items-center gap-3">
															<input
																type="range"
																min={0}
																max={100}
																value={draft.barberPercent}
																onChange={(e) =>
																	(() => {
																		const value = Number(e.target.value)
																		updateSalaryDraft(u.id, 'barberPercent', value)
																		setSalaryInputDrafts((prev) => {
																			const current = getSalaryInputDraft(u)
																			return {
																				...prev,
																				[u.id]: {
																					...current,
																					barberPercent: String(value)
																				}
																			}
																		})
																	})()
																}
																className="h-2 w-full cursor-pointer accent-emerald-600"
															/>
															<input
																type="number"
																min={0}
																max={100}
																value={inputDraft.barberPercent}
																onChange={(e) =>
																	updateSalaryInputDraft(
																		u,
																		'barberPercent',
																		e.target.value
																	)
																}
																onBlur={() =>
																	commitSalaryInputDraft(u, 'barberPercent')
																}
																className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-semibold text-slate-800"
															/>
														</div>
													</div>
													<div className="rounded-xl border border-slate-200 bg-white p-3">
														<div className="mb-2 flex items-center justify-between gap-2">
															<span className="text-sm font-semibold text-slate-800">
																🧴 Косметика
															</span>
															<span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">
																{draft.cosmeticsPercent}%
															</span>
														</div>
														<div className="flex items-center gap-3">
															<input
																type="range"
																min={0}
																max={100}
																value={draft.cosmeticsPercent}
																onChange={(e) =>
																	(() => {
																		const value = Number(e.target.value)
																		updateSalaryDraft(u.id, 'cosmeticsPercent', value)
																		setSalaryInputDrafts((prev) => {
																			const current = getSalaryInputDraft(u)
																			return {
																				...prev,
																				[u.id]: {
																					...current,
																					cosmeticsPercent: String(value)
																				}
																			}
																		})
																	})()
																}
																className="h-2 w-full cursor-pointer accent-violet-600"
															/>
															<input
																type="number"
																min={0}
																max={100}
																value={inputDraft.cosmeticsPercent}
																onChange={(e) =>
																	updateSalaryInputDraft(
																		u,
																		'cosmeticsPercent',
																		e.target.value
																	)
																}
																onBlur={() =>
																	commitSalaryInputDraft(u, 'cosmeticsPercent')
																}
																className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-semibold text-slate-800"
															/>
														</div>
													</div>
												</div>

												<div className="rounded-xl border border-slate-200 bg-white p-3">
													<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
														<div className="rounded-lg bg-slate-50 px-3 py-2">
															<p className="text-[11px] uppercase tracking-wide text-slate-500">
																Нараховано за день
															</p>
															<p className="text-sm font-semibold text-slate-900">
																{formatCurrency(salaryPreview.day)}
															</p>
														</div>
														<div className="rounded-lg bg-slate-50 px-3 py-2">
															<p className="text-[11px] uppercase tracking-wide text-slate-500">
																Нараховано за місяць
															</p>
															<p className="text-sm font-semibold text-slate-900">
																{formatCurrency(salaryPreview.month)}
															</p>
														</div>
														<div className="rounded-lg bg-amber-50 px-3 py-2">
															<p className="text-[11px] uppercase tracking-wide text-amber-700">
																До видачі за день
															</p>
															<p className="text-sm font-semibold text-amber-900">
																{formatCurrency(salaryPreview.dayDue)}
															</p>
														</div>
														<div className="rounded-lg bg-amber-50 px-3 py-2">
															<p className="text-[11px] uppercase tracking-wide text-amber-700">
																До видачі за місяць
															</p>
															<p className="text-sm font-semibold text-amber-900">
																{formatCurrency(salaryPreview.monthDue)}
															</p>
														</div>
													</div>

													<div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
													<button
														type="button"
														onClick={() => saveSalary(u)}
														disabled={savingSalaryUserId === u.id}
														className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-300"
													>
														{savingSalaryUserId === u.id
															? 'Збереження...'
															: 'Зберегти %'}
													</button>
													<button
														type="button"
														onClick={() => issueSalary(u)}
														disabled={payingSalaryUserId === u.id || salaryPreview.monthDue <= 0}
														className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
													>
														{payingSalaryUserId === u.id
															? 'Видача...'
															: 'Видати зарплату'}
													</button>
												</div>
											</div>
											</div>
										</div>
									)
									})}
							</div>
						)}
					</div>
					</div>
				)}

				<div className="mt-8 bg-white rounded-lg shadow-lg border border-slate-200 p-6">
					<h2 className="text-2xl font-bold text-slate-900 mb-2">💸 Виплати зарплати за місяць</h2>
					<p className="text-sm text-slate-600 mb-5">
						У вкладці користувачів відображаються тільки зарплатні виплати.
					</p>

					{salaryMonthExpenses.length === 0 ? (
						<p className="text-sm text-slate-500">За поточний місяць виплат ще немає.</p>
					) : (
						<div className="space-y-2">
							{salaryMonthExpenses.map((expense) => (
								<div
									key={expense.id}
									className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
								>
									<div className="min-w-0">
										<p className="font-semibold text-slate-900 break-words">
											-{formatCurrency(expense.amount)}
										</p>
										<p className="text-sm text-slate-600 break-words mt-1">
											{normalizeExpenseComment(expense.comment)}
										</p>
										<p className="text-xs text-slate-500 mt-1">
											{new Date(expense.createdAt).toLocaleDateString('uk-UA', {
												day: '2-digit',
												month: '2-digit',
												hour: '2-digit',
												minute: '2-digit'
											})}
											{' • 💸 Зарплата'}
										</p>
									</div>
									<button
										type="button"
										onClick={() => setExpenseToDelete(expense)}
										className="ml-4 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
									>
										🗑️
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			<ConfirmModal
				isOpen={Boolean(userToDelete)}
				title="Підтвердьте видалення користувача"
				description={
					userToDelete
						? `Користувач "${userToDelete.name}" буде деактивований.`
						: ''
				}
				confirmText="Видалити"
				cancelText="Скасувати"
				tone="danger"
				isLoading={isDeletingUser}
				onClose={() => setUserToDelete(null)}
				onConfirm={confirmDeleteUser}
			/>

			<ConfirmModal
				isOpen={Boolean(expenseToDelete)}
				title="Підтвердьте видалення витрати"
				description={
					expenseToDelete
						? `Витрата на ${formatCurrency(expenseToDelete.amount)} буде видалена.`
						: ''
				}
				confirmText="Видалити"
				cancelText="Скасувати"
				tone="danger"
				isLoading={isDeletingExpense}
				onClose={() => setExpenseToDelete(null)}
				onConfirm={confirmDeleteExpense}
			/>
		</main>
	)
}
