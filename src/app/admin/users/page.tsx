'use client'

import useSWR, { mutate } from 'swr'
import { useState } from 'react'
import ConfirmModal from '@/components/ConfirmModal'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function UsersAdminPage() {
	const { data, isLoading } = useSWR('/api/admin/users', fetcher)

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

	const users = data.data

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
									{users.map((u: any, index: number) => (
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
		</main>
	)
}
