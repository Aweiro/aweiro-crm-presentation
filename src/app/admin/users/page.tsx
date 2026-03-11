'use client'

import useSWR, { mutate } from 'swr'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
	Users,
	Tag,
	CalendarDays,
	Wallet,
	UserPlus,
	Trash2,
	Check,
	RefreshCcw,
	Save,
	CheckCircle2,
	AlertCircle,
	Shield,
	Plus,
	Clock,
	ArrowRight,
	TrendingUp,
	History,
	Info,
	Coins,
	Loader2,
	Scissors,
	ShoppingBag,
	Banknote,
	ArrowUpRight,
	Search,
	X,
	Settings,
	ChevronDown
} from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import PageSubTabs from '@/components/PageSubTabs'
import PageLoader from '@/components/PageLoader'
import { formatCurrency } from '@/lib/currency'
import { normalizeExpenseComment } from '@/lib/expenseComment'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function preventNonDigitInput(event: React.KeyboardEvent<HTMLInputElement>) {
	if (event.ctrlKey || event.metaKey || event.altKey) return
	const allowedKeys = [
		'Backspace',
		'Delete',
		'ArrowLeft',
		'ArrowRight',
		'ArrowUp',
		'ArrowDown',
		'Tab',
		'Home',
		'End'
	]
	if (allowedKeys.includes(event.key)) return
	if (!/^\d$/.test(event.key)) {
		event.preventDefault()
	}
}

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

type BarberService = {
	id: number
	name: string
	price: number
	durationMin: number
	isActive: boolean
}

type UserServiceLink = {
	userId: number
	serviceId: number
	price: number
	durationMin: number
}

export default function UsersAdminPage() {
	const pathname = usePathname()
	const router = useRouter()
	const { data, isLoading, error } = useSWR('/api/admin/users', fetcher)
	const { data: servicesConfig, mutate: mutateServicesConfig } = useSWR(
		'/api/admin/users/services',
		fetcher
	)

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
	const [isSavingAllSchedules, setIsSavingAllSchedules] = useState(false)
	const [expenseToDelete, setExpenseToDelete] = useState<MonthExpense | null>(null)
	const [isDeletingExpense, setIsDeletingExpense] = useState(false)
	const [serviceName, setServiceName] = useState('')
	const [servicePrice, setServicePrice] = useState('')
	const [serviceDuration, setServiceDuration] = useState('')
	const [isCreatingService, setIsCreatingService] = useState(false)
	const [userServiceDrafts, setUserServiceDrafts] = useState<
		Record<number, Array<{ serviceId: number; price: string; durationMin: number }>>
	>({})
	const [savingUserServicesId, setSavingUserServicesId] = useState<number | null>(null)
	const [lastSavedUserId, setLastSavedUserId] = useState<number | null>(null)
	const [activeTab, setActiveTab] = useState<
		'TEAM_LIST' | 'SERVICES' | 'WORK_SCHEDULE' | 'FINANCE'
	>(() => {
		if (pathname.endsWith('/services')) return 'SERVICES'
		if (pathname.endsWith('/schedule')) return 'WORK_SCHEDULE'
		if (pathname.endsWith('/finance')) return 'FINANCE'
		return 'TEAM_LIST'
	})
	const [scheduleDataMap, setScheduleDataMap] = useState<Record<number, Array<{ date?: string; dayOfWeek: number; dayName: string; isWorking: boolean; startHour: number; endHour: number; isOverride?: boolean }>>>({})
	const [serviceToDelete, setServiceToDelete] = useState<BarberService | null>(null)
	const [showAddUserForm, setShowAddUserForm] = useState(false)
	const [showAddServiceForm, setShowAddServiceForm] = useState(false)
	const [isDeletingServiceGlobal, setIsDeletingServiceGlobal] = useState(false)
	const [updatingServiceId, setUpdatingServiceId] = useState<number | null>(null)
	const [serviceCatalogDrafts, setServiceCatalogDrafts] = useState<
		Record<number, { name: string; price: string; durationMin: string }>
	>({})
	const [lastSavedCatalogServiceId, setLastSavedCatalogServiceId] = useState<number | null>(null)
	const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null)

	useEffect(() => {
		if (data?.data && !selectedBarberId) {
			const firstActive = data.data.find((u: UserRow) => u.isActive)
			if (firstActive) setSelectedBarberId(firstActive.id)
		}
	}, [data, selectedBarberId])

	useEffect(() => {
		if (pathname.endsWith('/services')) setActiveTab('SERVICES')
		else if (pathname.endsWith('/schedule')) setActiveTab('WORK_SCHEDULE')
		else if (pathname.endsWith('/finance')) setActiveTab('FINANCE')
		else setActiveTab('TEAM_LIST')
	}, [pathname])

	useEffect(() => {
		if (activeTab !== 'WORK_SCHEDULE') return
		if (!data?.data) return
		const activeUsers = (data.data as UserRow[]).filter(u => u.isActive)
		const unloaded = activeUsers.filter(u => !scheduleDataMap[u.id])
		for (const user of unloaded) {
			loadScheduleForUser(user.id)
		}
	}, [activeTab, data])

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
				body: JSON.stringify({ login, password, name, role })
			})
			if (res.ok) {
				setLogin('')
				setPassword('')
				setName('')
				setRole('USER')
				setShowAddUserForm(false)
				setSuccessMessage('✅ Користувач успішно створений!')
				setTimeout(() => setSuccessMessage(''), 3000)
				mutate('/api/admin/users')
			}
		} catch (error) {
			setFormError('Не вдалося створити користувача')
		} finally {
			setIsSubmitting(false)
		}
	}

	async function confirmDeleteUser() {
		if (!userToDelete || isDeletingUser) return
		setIsDeletingUser(true)
		try {
			await fetch(`/api/admin/users/${userToDelete.id}`, { method: 'DELETE' })
			mutate('/api/admin/users')
			setUserToDelete(null)
		} finally {
			setIsDeletingUser(false)
		}
	}

	async function restore(id: number) {
		await fetch(`/api/admin/users/${id}/restore`, { method: 'PATCH' })
		mutate('/api/admin/users')
	}

	function getSalaryDraft(user: UserRow) {
		return salaryDrafts[user.id] ?? { barberPercent: user.barberPercent ?? 0, cosmeticsPercent: user.cosmeticsPercent ?? 0 }
	}

	function updateSalaryDraft(userId: number, field: 'barberPercent' | 'cosmeticsPercent', value: number) {
		const normalized = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0
		setSalaryDrafts(prev => ({ ...prev, [userId]: { ...(prev[userId] ?? { barberPercent: 0, cosmeticsPercent: 0 }), [field]: normalized } }))
	}

	function getSalaryPreview(user: UserRow) {
		const draft = getSalaryDraft(user)
		const s = user.salaryStats
		const db = s?.dayBarber ?? 0; const dc = s?.dayCosmetics ?? 0; const mb = s?.monthBarber ?? 0; const mc = s?.monthCosmetics ?? 0
		const day = (db * draft.barberPercent) / 100 + (dc * draft.cosmeticsPercent) / 100
		const month = (mb * draft.barberPercent) / 100 + (mc * draft.cosmeticsPercent) / 100
		const pd = s?.paidDaySalary ?? 0; const pm = s?.paidMonthSalary ?? 0
		return { day, month, dayDue: Math.max(0, day - pd), monthDue: Math.max(0, month - pm), paidDay: pd, paidMonth: pm }
	}

	async function saveSalary(user: UserRow) {
		if (savingSalaryUserId === user.id) return
		const draft = getSalaryDraft(user)
		setSavingSalaryUserId(user.id)
		try {
			await fetch(`/api/admin/users/${user.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ barberPercent: draft.barberPercent, cosmeticsPercent: draft.cosmeticsPercent })
			})
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
			await fetch('/api/admin/expenses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount: Math.round(preview.monthDue), category: 'SALARY', salaryUserId: user.id, comment: `Зарплата: ${user.name || user.login}` })
			})
			mutate('/api/admin/users'); mutate('/api/admin/day'); mutate('/api/admin/expenses')
		} finally {
			setPayingSalaryUserId(null)
		}
	}

	async function confirmDeleteExpense() {
		if (!expenseToDelete || isDeletingExpense) return
		setIsDeletingExpense(true)
		try {
			await fetch(`/api/admin/expenses/${expenseToDelete.id}`, { method: 'DELETE' })
			setExpenseToDelete(null); mutate('/api/admin/users'); mutate('/api/admin/expenses')
		} finally {
			setIsDeletingExpense(false)
		}
	}

	function getUserServiceDraft(userId: number, links: UserServiceLink[], svcs: BarberService[]) {
		return userServiceDrafts[userId] ?? links.filter(l => l.userId === userId).map(l => {
			const s = svcs.find(x => x.id === l.serviceId)
			return { serviceId: l.serviceId, price: String(l.price || s?.price || 0), durationMin: l.durationMin || s?.durationMin || 30 }
		})
	}

	function toggleUserService(userId: number, s: BarberService, links: UserServiceLink[], svcs: BarberService[]) {
		const curr = getUserServiceDraft(userId, links, svcs)
		const exists = curr.find(e => e.serviceId === s.id)
		const next = exists ? curr.filter(e => e.serviceId !== s.id) : [...curr, { serviceId: s.id, price: String(s.price), durationMin: s.durationMin }]
		setUserServiceDrafts(prev => ({ ...prev, [userId]: next }))
	}

	function updateUserServicePrice(userId: number, svcId: number, val: string, links: UserServiceLink[], svcs: BarberService[]) {
		const raw = val.replace(/\D/g, '')
		setUserServiceDrafts(prev => ({ ...prev, [userId]: getUserServiceDraft(userId, links, svcs).map(e => e.serviceId === svcId ? { ...e, price: raw } : e) }))
	}

	function updateUserServiceDuration(userId: number, svcId: number, val: string, links: UserServiceLink[], svcs: BarberService[]) {
		const durationMin = Number(val.replace(/\D/g, '')) || 0
		setUserServiceDrafts(prev => ({ ...prev, [userId]: getUserServiceDraft(userId, links, svcs).map(e => e.serviceId === svcId ? { ...e, durationMin } : e) }))
	}

	function isUserServiceEdited(
		userId: number,
		serviceId: number,
		draft: { price: string; durationMin: number },
		links: UserServiceLink[],
		svcs: BarberService[]
	) {
		const savedLink = links.find((l) => l.userId === userId && l.serviceId === serviceId)
		const svc = svcs.find((s) => s.id === serviceId)
		const savedPrice = Number(savedLink?.price ?? svc?.price ?? 0)
		const savedDuration = Number(savedLink?.durationMin ?? svc?.durationMin ?? 30)
		const draftPrice = Number(draft.price || 0)
		const draftDuration = Number(draft.durationMin || 0)
		return draftPrice !== savedPrice || draftDuration !== savedDuration
	}

	async function saveUserServices(userId: number, links: UserServiceLink[], svcs: BarberService[]) {
		if (savingUserServicesId === userId) return
		setSavingUserServicesId(userId)
		setLastSavedUserId(null)
		try {
			const services = getUserServiceDraft(userId, links, svcs).map(e => ({ serviceId: e.serviceId, price: Math.max(0, Math.round(Number(e.price) || 0)), durationMin: Math.max(5, Math.round(e.durationMin)) }))
			await fetch('/api/admin/users/services', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, services }) })
			await mutateServicesConfig()
			setLastSavedUserId(userId)
			setTimeout(() => setLastSavedUserId(null), 3000)
		} finally {
			setSavingUserServicesId(null)
		}
	}

	async function createBarberService() {
		if (isCreatingService || !serviceName.trim()) return
		setIsCreatingService(true)
		try {
			await fetch('/api/appointments/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: serviceName.trim(), price: Number(servicePrice) || 0, durationMin: Number(serviceDuration) || 30 }) })
			setServiceName(''); setServicePrice(''); setServiceDuration(''); setShowAddServiceForm(false); await mutateServicesConfig()
		} finally {
			setIsCreatingService(false)
		}
	}

	async function deleteBarberService(id: number) {
		setIsDeletingServiceGlobal(true)
		try {
			await fetch(`/api/appointments/services?id=${id}`, { method: 'DELETE' })
			await mutateServicesConfig()
			setServiceToDelete(null)
		} finally {
			setIsDeletingServiceGlobal(false)
		}
	}

	async function updateBarberService(id: number, name?: string, price?: string | number, durationMin?: string | number) {
		setUpdatingServiceId(id)
		try {
			const body: any = {}
			if (name !== undefined) body.name = name
			if (price !== undefined) body.price = Number(price) || 0
			if (durationMin !== undefined) body.durationMin = Number(durationMin) || 30
			await fetch(`/api/appointments/services?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
			await mutateServicesConfig()
			setTimeout(() => setUpdatingServiceId(null), 2000)
		} catch {
			setUpdatingServiceId(null)
		}
	}

	function getServiceCatalogDraft(service: BarberService) {
		return (
			serviceCatalogDrafts[service.id] ?? {
				name: service.name,
				price: String(service.price),
				durationMin: String(service.durationMin)
			}
		)
	}

	function isServiceCatalogEdited(service: BarberService) {
		const draft = getServiceCatalogDraft(service)
		return (
			draft.name.trim() !== service.name ||
			Number(draft.price || 0) !== service.price ||
			Number(draft.durationMin || 0) !== service.durationMin
		)
	}

	async function saveServiceCatalogItem(service: BarberService) {
		const draft = getServiceCatalogDraft(service)
		await updateBarberService(
			service.id,
			draft.name.trim(),
			draft.price,
			draft.durationMin
		)
		setServiceCatalogDrafts((prev) => {
			const next = { ...prev }
			delete next[service.id]
			return next
		})
		setLastSavedCatalogServiceId(service.id)
		setTimeout(() => setLastSavedCatalogServiceId(null), 2500)
	}

	async function loadScheduleForUser(userId: number) {
		try {
			const d1 = new Date(); const d2 = new Date(); d2.setDate(d1.getDate() + 13)
			const s1 = d1.toISOString().split('T')[0]; const s2 = d2.toISOString().split('T')[0]
			const res = await fetch(`/api/appointments/schedule?barberId=${userId}&startDate=${s1}&endDate=${s2}`)
			const json = await res.json()
			if (Array.isArray(json?.data)) setScheduleDataMap(prev => ({ ...prev, [userId]: json.data }))
		} catch { }
	}

	async function saveAllSchedules() {
		if (isSavingAllSchedules) return
		setIsSavingAllSchedules(true)
		try {
			for (const userId of Object.keys(scheduleDataMap).map(Number)) {
				const schedule = scheduleDataMap[userId]
				if (schedule) await fetch('/api/appointments/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ barberId: userId, schedule }) })
			}
		} finally {
			setIsSavingAllSchedules(false)
		}
	}

	if (isLoading) return <PageLoader message="Завантаження..." />
	if (error) return <div className="p-8 text-red-600">Помилка завантаження</div>

	const users = Array.isArray(data?.data) ? data.data : []
	const barberServices = Array.isArray(servicesConfig?.services) ? servicesConfig.services : []
	const userServiceLinks = Array.isArray(servicesConfig?.userServices) ? servicesConfig.userServices : []
	const salaryMonthExpenses = (data?.monthExpenses || []).filter((e: any) => e.category === 'SALARY')

	return (
		<main className="relative min-h-screen bg-[#F8FAFC] p-0 overflow-x-hidden">
			<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px]" />
				<div className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] rounded-full bg-indigo-400/10 blur-[100px]" />
				<div className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full bg-purple-400/10 blur-[130px]" />
			</div>

			<div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
					<div>
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
							<Settings className="w-3.5 h-3.5" /> Налаштування системи
						</div>
						<h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Команда та <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">налаштування</span></h1>
					</div>
				</div>

				{successMessage && <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl mb-8 font-bold flex items-center gap-2 animate-in fade-in"><CheckCircle2 className="w-5 h-5" /> {successMessage}</div>}
				{formError && <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl mb-8 font-bold flex items-center gap-2 animate-in shake-in"><AlertCircle className="w-5 h-5" /> {formError}</div>}

				<div className="mb-10"><PageSubTabs items={[{ key: 'TEAM_LIST', label: <div className="flex gap-2"><Users className="w-4 h-4" /><span>Команда</span></div> }, { key: 'SERVICES', label: <div className="flex gap-2"><Tag className="w-4 h-4" /><span>Послуги</span></div> }, { key: 'WORK_SCHEDULE', label: <div className="flex gap-2"><CalendarDays className="w-4 h-4" /><span>Графік</span></div> }, { key: 'FINANCE', label: <div className="flex gap-2"><Wallet className="w-4 h-4" /><span>Фінанси</span></div> }]} activeKey={activeTab} onChange={(k: any) => {
					const tab = k as 'TEAM_LIST' | 'SERVICES' | 'WORK_SCHEDULE' | 'FINANCE'
					const nextPath =
						tab === 'SERVICES'
							? '/admin/users/services'
							: tab === 'WORK_SCHEDULE'
								? '/admin/users/schedule'
								: tab === 'FINANCE'
									? '/admin/users/finance'
									: '/admin/users/team'
					if (nextPath !== pathname) router.push(nextPath)
				}} /></div>

				{activeTab === 'TEAM_LIST' && (
					<div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 border-b border-slate-100 pb-6 mb-6">
							<div className="flex items-center gap-6">
								<h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
									<Users className="w-10 h-10 text-indigo-600" />
									Команда
								</h2>
							</div>
							<button
								onClick={() => setShowAddUserForm(!showAddUserForm)}
								className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black transition-all ${showAddUserForm
									? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
									: 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95'
									}`}
							>
								{showAddUserForm ? <><X className="w-5 h-5" /><span>Скасувати</span></> : <><UserPlus className="w-5 h-5" /><span>Додати працівника</span></>}
							</button>
						</div>

						{showAddUserForm && (
							<div className="bg-white/70 backdrop-blur-xl p-8 rounded-[40px] border border-white/60 shadow-xl overflow-hidden relative animate-in slide-in-from-top-4 duration-500">
								<div className="flex items-center gap-4 mb-8">
									<div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner"><UserPlus className="w-6 h-6" /></div>
									<h2 className="text-xl font-black text-slate-900 tracking-tight">Новий працівник</h2>
								</div>
								<form onSubmit={create} className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
									<div className="space-y-1">
										<label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Прізвище та ім'я</label>
										<input type="text" placeholder="Олександр Петренко" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50/50 p-4 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-black text-slate-900 shadow-inner" />
									</div>
									<div className="space-y-1">
										<label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Логін</label>
										<input type="text" placeholder="sasha_barber" value={login} onChange={e => setLogin(e.target.value)} className="w-full bg-slate-50/50 p-4 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-black text-slate-900 shadow-inner" />
									</div>
									<div className="space-y-1">
										<label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Пароль</label>
										<input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50/50 p-4 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-black text-slate-900 shadow-inner" />
									</div>
									<div className="md:col-span-2 space-y-1">
										<label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">Права доступу</label>
										<div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
											<button type="button" onClick={() => setRole('USER')} className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl font-black transition-all ${role === 'USER' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}>
												<Scissors className="w-4 h-4" />
												<span>Майстер</span>
											</button>
											<button type="button" onClick={() => setRole('ADMIN')} className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl font-black transition-all ${role === 'ADMIN' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>
												<Shield className="w-4 h-4" />
												<span>Адміністратор</span>
											</button>
										</div>
									</div>
									<div className="flex items-end pt-5">
										<button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3">
											{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /><span>Створити</span></>}
										</button>
									</div>
									{formError && <p className="md:col-span-3 text-rose-500 text-sm font-bold flex items-center gap-2 mt-2 bg-rose-50 p-4 rounded-2xl border border-rose-100"><AlertCircle className="w-4 h-4" /> {formError}</p>}
									{successMessage && <p className="md:col-span-3 text-emerald-600 text-sm font-bold flex items-center gap-2 mt-2 bg-emerald-50 p-4 rounded-2xl border border-emerald-100"><CheckCircle2 className="w-4 h-4" /> {successMessage}</p>}
								</form>
							</div>
						)}

						<div className="bg-white/70 backdrop-blur-xl rounded-[40px] border border-white/60 shadow-xl overflow-hidden relative animate-in slide-in-from-bottom-4 duration-1000">
							<table className="w-full text-left">
								<thead className="bg-slate-900 text-white/70 text-[10px] uppercase font-black tracking-widest">
									<tr>
										<th className="py-6 px-6">Користувач</th>
										<th className="py-6 px-6">Логін</th>
										<th className="py-6 px-6 text-right">Дії</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{users.map((u: any) => (
										<tr key={u.id} className={`group hover:bg-slate-50/50 transition-all ${!u.isActive ? 'bg-slate-50/30' : ''}`}>
											<td className="py-6 px-6">
												<div className="flex items-center gap-4">
													<div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${!u.isActive ? 'bg-slate-100 text-slate-300 opacity-50' : u.role === 'ADMIN' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}`}>
														{u.name.charAt(0)}
													</div>
													<div className={!u.isActive ? 'opacity-40 grayscale' : ''}>
														<p className={`font-black text-slate-900 ${!u.isActive ? 'line-through decoration-slate-400 decoration-2' : ''}`}>{u.name}</p>
														<div className="flex items-center gap-2 mt-1">
															{!u.isActive ? (
																<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-200 text-[8px] font-black text-slate-500 uppercase tracking-wider">
																	Деактивовано
																</span>
															) : u.role === 'ADMIN' ? (
																<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 text-[8px] font-black text-white uppercase tracking-wider">
																	<Shield className="w-2.5 h-2.5" /> Адмін
																</span>
															) : (
																<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 text-[8px] font-black text-indigo-600 uppercase tracking-wider">
																	<Scissors className="w-2.5 h-2.5" /> Майстер
																</span>
															)}
														</div>
													</div>
												</div>
											</td>
											<td className="py-6 px-6">
												<p className="font-bold text-slate-400 text-sm font-mono tracking-tight">@{u.login}</p>
											</td>
											<td className="py-6 px-6 text-right">
												<div className="flex items-center justify-end gap-2">
													{u.isActive ? (
														<button onClick={() => setUserToDelete(u)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
															<Trash2 className="w-5 h-5" />
														</button>
													) : (
														<button onClick={() => restore(u.id)} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs hover:bg-emerald-100 transition-all">
															<RefreshCcw className="w-4 h-4" /> Відновити
														</button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{activeTab === 'SERVICES' && (
					<div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
							{/* GLOBAL SERVICE CREATOR & LIST */}
							<div className="lg:col-span-1 space-y-6">
								<div className="bg-white/70 backdrop-blur-xl p-8 rounded-[40px] border border-white/60 shadow-xl overflow-hidden relative">
									<button
										onClick={() => setShowAddServiceForm(!showAddServiceForm)}
										className="w-full flex items-center justify-between mb-0 group"
									>
										<div className="flex items-center gap-4">
											<div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner ${showAddServiceForm ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>
												{showAddServiceForm ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
											</div>
											<h2 className="text-xl font-black text-slate-900 tracking-tight">Нова послуга</h2>
										</div>
										<ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showAddServiceForm ? 'rotate-180' : ''}`} />
									</button>

									{showAddServiceForm && (
										<div className="space-y-4 mt-8 animate-in slide-in-from-top-4 duration-500">
											<input type="text" placeholder="Наприклад: Стрижка Бороди" value={serviceName} onChange={e => setServiceName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-900 focus:bg-white focus:border-indigo-500 transition-all outline-none shadow-sm" />
											<div className="grid grid-cols-2 gap-4">
												<div className="relative"><input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Ціна" value={servicePrice} onKeyDown={preventNonDigitInput} onChange={e => setServicePrice(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-900 focus:bg-white focus:border-indigo-500 transition-all outline-none pr-12 shadow-sm" /><span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400">zł</span></div>
												<div className="relative"><input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Час" value={serviceDuration} onKeyDown={preventNonDigitInput} onChange={e => setServiceDuration(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-900 focus:bg-white focus:border-indigo-500 transition-all outline-none pr-12 shadow-sm" /><span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">хв</span></div>
											</div>
											<button onClick={createBarberService} disabled={isCreatingService || !serviceName.trim()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-200">
												{isCreatingService ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Додати до каталогу</span>}
											</button>
										</div>
									)}

									<div className="mt-6 pt-6 border-t border-slate-100">
										<h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-[0.2em] px-2 font-black">Список усіх послуг</h3>
										<p className="mb-4 px-2 text-xs font-bold text-slate-500">
											Після змін натисніть кнопку збереження в рядку послуги.
										</p>
										<div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
											{barberServices.filter((s: any) => s.isActive).map((s: any) => (
												<div key={s.id} className="group flex flex-col p-3 bg-white/80 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:bg-white transition-all shadow-sm">
													<div className="flex items-center justify-between gap-2 mb-2">
														<div className="flex-1 relative h-6">
															<input
																type="text"
																value={getServiceCatalogDraft(s).name}
																onChange={(e) =>
																	setServiceCatalogDrafts((prev) => ({
																		...prev,
																		[s.id]: {
																			...getServiceCatalogDraft(s),
																			name: e.target.value
																		}
																	}))
																}
																className="absolute left-0 max-w-full focus:max-w-none bg-transparent font-bold text-sm text-slate-700 outline-none focus:text-indigo-600 focus:bg-white px-2 py-1 rounded transition-all truncate"
															/>
														</div>
														<div className="flex items-center justify-center w-8">
															<button
																onClick={() => setServiceToDelete(s)}
																disabled={updatingServiceId === s.id}
																className="p-2 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
															>
																<Trash2 className="w-3.5 h-3.5" />
															</button>
														</div>
													</div>
													<div className="flex items-center gap-2">
														<div className="relative flex-1"><input type="text" inputMode="numeric" pattern="[0-9]*" onKeyDown={preventNonDigitInput} value={getServiceCatalogDraft(s).durationMin} onChange={(e) => setServiceCatalogDrafts((prev) => ({ ...prev, [s.id]: { ...getServiceCatalogDraft(s), durationMin: e.target.value.replace(/\D/g, '') } }))} className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-400 font-bold text-[11px] text-slate-700 outline-none p-1.5 pl-2 pr-7 rounded-lg transition-all" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-slate-400">хв</span></div>
														<div className="relative flex-1"><input type="text" inputMode="numeric" pattern="[0-9]*" onKeyDown={preventNonDigitInput} value={getServiceCatalogDraft(s).price} onChange={(e) => setServiceCatalogDrafts((prev) => ({ ...prev, [s.id]: { ...getServiceCatalogDraft(s), price: e.target.value.replace(/\D/g, '') } }))} className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-400 font-bold text-[11px] text-slate-700 outline-none p-1.5 pl-2 pr-6 rounded-lg transition-all text-right" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-slate-400">zł</span></div>
														<button
															type="button"
															onClick={() => saveServiceCatalogItem(s)}
															disabled={updatingServiceId === s.id || !isServiceCatalogEdited(s)}
															className={`inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-xs font-black transition ${
																isServiceCatalogEdited(s)
																	? 'bg-indigo-600 text-white hover:bg-indigo-700'
																	: lastSavedCatalogServiceId === s.id
																		? 'bg-emerald-100 text-emerald-700'
																		: 'bg-slate-100 text-slate-400'
															}`}
															title={isServiceCatalogEdited(s) ? 'Зберегти зміни' : 'Немає змін'}
														>
															{updatingServiceId === s.id ? (
																<Loader2 className="w-3.5 h-3.5 animate-spin" />
															) : lastSavedCatalogServiceId === s.id ? (
																<CheckCircle2 className="w-3.5 h-3.5" />
															) : (
																<Save className="w-3.5 h-3.5" />
															)}
														</button>
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>

							{/* BARBER SERVICE PRICES */}
							<div className="lg:col-span-2 space-y-8">
								<div className="bg-white/70 backdrop-blur-xl p-4 rounded-[40px] border border-slate-200/60 shadow-xl flex items-center gap-3 overflow-x-auto no-scrollbar relative">
									<div className="absolute inset-0 bg-slate-500/5 pointer-events-none" />
									{users.filter((u: any) => u.isActive).map((u: any) => (
										<button
											key={u.id}
											onClick={() => setSelectedBarberId(u.id)}
											className={`flex items-center gap-3 px-5 py-3 rounded-[24px] font-black transition-all whitespace-nowrap relative z-10 ${selectedBarberId === u.id
												? 'bg-slate-900 text-white shadow-xl shadow-slate-300 -translate-y-0.5'
												: 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-100 shadow-sm'
												}`}
										>
											<div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${selectedBarberId === u.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
												{u.name.charAt(0)}
											</div>
											<span>{u.name}</span>
										</button>
									))}
								</div>

								{users.filter((u: any) => u.isActive && u.id === selectedBarberId).map((u: any) => (
									<div key={u.id} className="bg-white/70 backdrop-blur-xl p-8 rounded-[40px] border border-white/60 shadow-xl animate-in fade-in slide-in-from-right-4 duration-500">
										<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
											<div className="flex items-center gap-5">
												<div className="w-16 h-16 rounded-[24px] bg-indigo-50 flex items-center justify-center font-black text-3xl text-indigo-600 shadow-inner">{u.name.charAt(0)}</div>
												<div>
													<h3 className="text-3xl font-black text-slate-900 tracking-tight">{u.name}</h3>
													<p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">Персональні ціни</p>
												</div>
											</div>
											<button onClick={() => saveUserServices(u.id, userServiceLinks, barberServices)} disabled={savingUserServicesId === u.id} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all ${lastSavedUserId === u.id ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95'}`}>
												{savingUserServicesId === u.id ? <Loader2 className="w-5 h-5 animate-spin" /> : lastSavedUserId === u.id ? <><CheckCircle2 className="w-5 h-5" /><span>Збережено</span></> : <><CheckCircle2 className="w-5 h-5 opacity-90" /><span>Зберегти налаштування</span></>}
											</button>
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											{barberServices.filter((s: any) => s.isActive).map((s: any) => {
												const link = getUserServiceDraft(u.id, userServiceLinks, barberServices).find(l => l.serviceId === s.id)
												const edited = link
													? isUserServiceEdited(u.id, s.id, link, userServiceLinks, barberServices)
													: false
												return (
													<div key={s.id} className={`flex items-center gap-4 p-5 rounded-[32px] border-2 transition-all ${link ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-50/50' : 'bg-slate-100/40 border-slate-200/60 opacity-90'}`}>
														<div className="flex items-center gap-4 flex-1">
															<input type="checkbox" checked={!!link} onChange={() => toggleUserService(u.id, s, userServiceLinks, barberServices)} className="w-6 h-6 accent-indigo-600 rounded-lg cursor-pointer" />
															<span className={`font-black text-sm transition-colors ${link ? 'text-slate-900' : 'text-slate-500'}`}>{s.name}</span>
														</div>
														<div className="flex items-center gap-2 min-w-[140px] justify-end">
															{link ? (
																<div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
																	<div className="flex items-center gap-1 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-100 shadow-inner">
																		<input type="text" inputMode="numeric" pattern="[0-9]*" onKeyDown={preventNonDigitInput} value={link.durationMin} onChange={e => updateUserServiceDuration(u.id, s.id, e.target.value, userServiceLinks, barberServices)} className="w-9 bg-transparent font-black text-[11px] text-center text-slate-700 outline-none" />
																		<span className="text-[8px] font-black uppercase text-slate-400">хв</span>
																	</div>
																	<div className="flex items-center gap-1 bg-indigo-50 px-2 py-1.5 rounded-xl border border-indigo-100 shadow-sm">
																		<input type="text" inputMode="numeric" pattern="[0-9]*" onKeyDown={preventNonDigitInput} value={link.price} onChange={e => updateUserServicePrice(u.id, s.id, e.target.value, userServiceLinks, barberServices)} className="w-11 bg-transparent font-black text-[11px] text-right text-indigo-600 outline-none" />
																		<span className="text-[8px] font-black uppercase text-slate-400">zł</span>
																	</div>
																	{edited ? (
																		<span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600" title="Є зміни">
																			<CheckCircle2 className="w-4 h-4" />
																		</span>
																	) : null}
																</div>
															) : (
																<div className="h-9 w-full flex items-center justify-end">
																	<span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Не вибрано</span>
																</div>
															)}
														</div>
													</div>
												)
											})}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
				{activeTab === 'WORK_SCHEDULE' && users && users.length > 0 && (() => {
					const DAY_NAMES_SHORT = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
					const today = new Date()
					const calendarDays = Array.from({ length: 14 }, (_, i) => {
						const d = new Date(today); d.setDate(today.getDate() + i)
						const isoDate = d.toISOString().split('T')[0]
						return { date: d, isoDate, dayName: DAY_NAMES_SHORT[d.getDay()], isToday: i === 0 }
					})
					return (
						<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
							<div className="bg-white/70 backdrop-blur-xl rounded-[40px] border border-white/60 shadow-2xl overflow-hidden">
								<div className="bg-slate-900 px-8 py-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center"><CalendarDays className="w-6 h-6" /></div>
										<div><h2 className="text-2xl font-black tracking-tight">Графік роботи</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Планування на 14 днів</p></div>
									</div>
									<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-[11px] font-black uppercase tracking-wider"><Info className="w-3.5 h-3.5 text-indigo-400" /> Натисніть на день для перемикання</div>
								</div>
								<div className="p-4 overflow-visible">
									<div className="overflow-x-auto overflow-y-visible">
										<table className="w-full border-separate border-spacing-x-1 border-spacing-y-0 text-left">
										<thead><tr><th className="py-6 px-4 border-b min-w-[180px] sticky left-0 bg-white/90 backdrop-blur-md z-30">Працівник</th>{calendarDays.map((cd, i) => (<th key={i} className={`py-4 px-2 border-b text-center min-w-[64px] ${cd.isToday ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100'}`}><span className={`block text-[10px] font-black uppercase ${cd.isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{cd.dayName}</span><span className={`block text-lg font-black ${cd.isToday ? 'text-slate-900' : 'text-slate-700'}`}>{cd.date.getDate()}</span></th>))}</tr></thead>
										<tbody className="divide-y divide-slate-50">{users.filter((u: UserRow) => u.isActive).map((user: UserRow) => {
											const schedule = scheduleDataMap[user.id]
											return (
												<tr key={user.id} className="group hover:bg-slate-50/30 transition-colors">
													<td className="py-4 px-4 sticky left-0 bg-white/90 backdrop-blur-md z-20"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black">{user.name.charAt(0)}</div><div><p className="text-sm font-black text-slate-900 truncate max-w-[120px]">{user.name}</p></div></div></td>
													{calendarDays.map((cd, i) => {
														if (!schedule) return <td key={i} className="p-2"><div className="h-12 w-full animate-pulse bg-slate-50 rounded-xl" /></td>
														const day = schedule.find(d => d.date === cd.isoDate); if (!day) return <td key={i} />
														const idx = schedule.indexOf(day)
														return (
															<td key={i} className="p-1 px-1.5 relative group/cell">
																<button onClick={() => { const updated = [...schedule]; updated[idx] = { ...updated[idx], isWorking: !day.isWorking, isOverride: true }; setScheduleDataMap(prev => ({ ...prev, [user.id]: updated })) }} className={`w-full h-12 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${day.isWorking ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
																	{day.isWorking ? <><span className="text-[9px] font-black">{day.startHour}:00</span><span className="text-[9px] font-black">{day.endHour}:00</span></> : <span className="w-4 h-0.5 bg-slate-200 rounded-full" />}
																</button>
																{day.isWorking && (
																	<div className="absolute bottom-[100%] left-1/2 -translate-x-1/2 pb-2 z-[60] opacity-0 pointer-events-none group-hover/cell:opacity-100 group-hover/cell:pointer-events-auto transition-all hidden sm:block">
																		<div className="bg-slate-900 p-2 rounded-xl shadow-2xl flex items-center gap-2">
																			<select value={day.startHour} onChange={e => { const updated = [...schedule]; updated[idx] = { ...updated[idx], startHour: Number(e.target.value), isOverride: true }; setScheduleDataMap(prev => ({ ...prev, [user.id]: updated })) }} className="bg-transparent text-white text-[10px] font-black outline-none"><option value="8">08:00</option><option value="9">09:00</option><option value="10">10:00</option><option value="11">11:00</option><option value="12">12:00</option></select>
																			<ArrowRight className="w-3 h-3 text-white/30" />
																			<select value={day.endHour} onChange={e => { const updated = [...schedule]; updated[idx] = { ...updated[idx], endHour: Number(e.target.value), isOverride: true }; setScheduleDataMap(prev => ({ ...prev, [user.id]: updated })) }} className="bg-transparent text-white text-[10px] font-black outline-none"><option value="18">18:00</option><option value="19">19:00</option><option value="20">20:00</option><option value="21">21:00</option><option value="22">22:00</option></select>
																		</div>
																	</div>
																)}
															</td>
														)
													})}
												</tr>
											)
										})}</tbody>
										</table>
									</div>
								</div>
								<div className="border-t border-slate-200/70 p-4 sm:p-5">
									<div className="flex justify-center">
										<button
											onClick={saveAllSchedules}
											disabled={isSavingAllSchedules}
											className="flex items-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-base shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
										>
											{isSavingAllSchedules ? (
												<Loader2 className="h-5 w-5 animate-spin" />
											) : (
												<>
													<CheckCircle2 className="w-5 h-5 text-emerald-400" />
													Зберегти всі графіки
												</>
											)}
										</button>
									</div>
								</div>
							</div>
						</div>
					)
				})()}

				{activeTab === 'FINANCE' && users && users.length > 0 && (
					<div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
						<div className="bg-white/70 backdrop-blur-xl rounded-[40px] border border-white/60 p-10 shadow-2xl flex items-center gap-6"><div className="w-20 h-20 rounded-[32px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white"><Wallet className="w-10 h-10" /></div><div><h2 className="text-4xl font-black text-slate-900 leading-tight">Фінанси та виплати</h2><p className="text-slate-500 font-bold mt-1 text-lg">Керування зарплатами</p></div></div>
						<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">{users.filter((u: any) => u.isActive).map((u: any) => {
							const d = getSalaryDraft(u); const p = getSalaryPreview(u); return (
								<div key={u.id} className="bg-white/70 backdrop-blur-xl rounded-[48px] border border-white/60 p-8 shadow-xl">
									<div className="flex justify-between items-center mb-8 border-b pb-8"><div className="flex items-center gap-5"><div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center font-black text-2xl text-slate-400">{u.name.charAt(0)}</div><div><h4 className="text-2xl font-black text-slate-900">{u.name}</h4><p className="text-slate-400 font-bold">@{u.login}</p></div></div><div className="text-right"><p className="text-[10px] font-black uppercase text-slate-400">До видачі</p><p className="text-3xl font-black text-emerald-600">{formatCurrency(p.monthDue)}</p></div></div>
									<div className="space-y-6">
										<div className="bg-slate-50 p-6 rounded-3xl"><div className="flex justify-between mb-2"><span className="text-xs font-black uppercase">Барбер {d.barberPercent}%</span><input type="range" min="0" max="100" value={d.barberPercent} onChange={e => updateSalaryDraft(u.id, 'barberPercent', Number(e.target.value))} className="w-32 accent-emerald-500" /></div></div>
										<div className="bg-slate-50 p-6 rounded-3xl"><div className="flex justify-between mb-2"><span className="text-xs font-black uppercase">Косметика {d.cosmeticsPercent}%</span><input type="range" min="0" max="100" value={d.cosmeticsPercent} onChange={e => updateSalaryDraft(u.id, 'cosmeticsPercent', Number(e.target.value))} className="w-32 accent-indigo-500" /></div></div>
										<div className="grid grid-cols-2 gap-4"><button onClick={() => saveSalary(u)} disabled={savingSalaryUserId === u.id} className="bg-slate-100 py-4 rounded-2xl font-black">{savingSalaryUserId === u.id ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Зберегти %'}</button><button onClick={() => issueSalary(u)} disabled={payingSalaryUserId === u.id || p.monthDue <= 0} className="bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg">{payingSalaryUserId === u.id ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Видати'}</button></div>
									</div>
								</div>
							)
						})}</div>
						<div className="space-y-6 pb-24"><h3 className="text-2xl font-black ml-4">Історія виплат</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{salaryMonthExpenses.map((ex: any) => (
							<div key={ex.id} className="bg-white/70 p-6 rounded-3xl border border-white/60 shadow-sm flex justify-between items-center group"><div><p className="font-black text-rose-600">-{formatCurrency(ex.amount)}</p><p className="text-xs font-bold text-slate-500">{normalizeExpenseComment(ex.comment)}</p></div><button onClick={() => setExpenseToDelete(ex)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button></div>
						))}</div></div>
					</div>
				)}
			</div>

			<ConfirmModal isOpen={Boolean(userToDelete)} title="Видалити користувача?" description={`Ви впевнені, що хочете видалити ${userToDelete?.name}?`} confirmText="Так, видалити" cancelText="Скасувати" tone="danger" isLoading={isDeletingUser} onClose={() => setUserToDelete(null)} onConfirm={confirmDeleteUser} />
			<ConfirmModal isOpen={Boolean(expenseToDelete)} title="Видалити виплату?" description={`Ви впевнені, що хочете видалити виплату на ${expenseToDelete ? formatCurrency(expenseToDelete.amount) : '0'}?`} confirmText="Так, видалити" cancelText="Скасувати" tone="danger" isLoading={isDeletingExpense} onClose={() => setExpenseToDelete(null)} onConfirm={confirmDeleteExpense} />
			<ConfirmModal isOpen={Boolean(serviceToDelete)} title="Видалити послугу?" description={`Ви впевнені, що хочете видалити послугу "${serviceToDelete?.name}"? Це видалить її з каталогу для всіх працівників.`} confirmText="Так, видалити" cancelText="Скасувати" tone="danger" isLoading={isDeletingServiceGlobal} onClose={() => setServiceToDelete(null)} onConfirm={() => { if (serviceToDelete) deleteBarberService(serviceToDelete.id) }} />
		</main>
	)
}
