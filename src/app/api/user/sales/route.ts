import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Tx = {
	amount: number
	paymentMethod: string
	createdAt: Date
}

type TxWithUser = Tx & {
	userId: number
	user: {
		id: number
		name: string | null
		login: string
	}
}

function getCashierAggregate(transactions: TxWithUser[]) {
	const salesMap = new Map<number, { userId: number; name: string; total: number; count: number }>()

	transactions.forEach((t) => {
		const entry = salesMap.get(t.userId) ?? {
			userId: t.userId,
			name: t.user.name || t.user.login,
			total: 0,
			count: 0
		}
		entry.total += t.amount
		entry.count += 1
		salesMap.set(t.userId, entry)
	})

	return {
		cashiersCount: salesMap.size,
		top: Array.from(salesMap.values())
			.sort((a, b) => b.total - a.total)
			.slice(0, 3)
	}
}

function getCashiersSalesList(monthTransactions: TxWithUser[], dayTransactions: TxWithUser[]) {
	const monthMap = new Map<number, { userId: number; name: string; totalMonth: number }>()
	const dayMap = new Map<number, number>()

	monthTransactions.forEach((t) => {
		const existing = monthMap.get(t.userId) ?? {
			userId: t.userId,
			name: t.user.name || t.user.login,
			totalMonth: 0
		}
		existing.totalMonth += t.amount
		monthMap.set(t.userId, existing)
	})

	dayTransactions.forEach((t) => {
		dayMap.set(t.userId, (dayMap.get(t.userId) ?? 0) + t.amount)
	})

	return Array.from(monthMap.values())
		.map((u) => ({
			userId: u.userId,
			name: u.name,
			dayTotal: dayMap.get(u.userId) ?? 0,
			totalMonth: u.totalMonth
		}))
		.sort((a, b) => b.totalMonth - a.totalMonth)
}

function getStats(transactions: Tx[]) {
	const cash = transactions
		.filter((t) => t.paymentMethod === 'CASH')
		.reduce((sum, t) => sum + t.amount, 0)
	const card = transactions
		.filter((t) => t.paymentMethod === 'CARD')
		.reduce((sum, t) => sum + t.amount, 0)

	return {
		count: transactions.length,
		cash,
		card,
		total: cash + card
	}
}

export async function GET() {
	try {
		const cookieStore = await cookies()
		const token = cookieStore.get('auth_token')?.value

		if (!token) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
		}

		const payload = verifyJWT(token)
		if (payload.role !== 'USER') {
			return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
		}

		const user = await prisma.user.findUnique({
			where: { id: payload.userId },
			select: {
				id: true,
				name: true,
				login: true,
				role: true,
				isActive: true
			}
		})

		if (!user || !user.isActive || user.role !== 'USER') {
			return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
		}

		const now = new Date()
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
		const dayStart = new Date(now)
		dayStart.setHours(0, 0, 0, 0)

		const monthTransactions = await prisma.transaction.findMany({
			where: {
				userId: user.id,
				createdAt: { gte: monthStart }
			},
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				amount: true,
				paymentMethod: true,
				createdAt: true
			}
		})

		const dayTransactions = monthTransactions.filter(
			(t) => new Date(t.createdAt).getTime() >= dayStart.getTime()
		)

		const monthAllTransactions = await prisma.transaction.findMany({
			where: {
				createdAt: { gte: monthStart }
			},
			orderBy: { createdAt: 'desc' },
			select: {
				amount: true,
				paymentMethod: true,
				createdAt: true,
				userId: true,
				user: {
					select: {
						id: true,
						name: true,
						login: true
					}
				}
			}
		})

		const dayAllTransactions = monthAllTransactions.filter(
			(t) => new Date(t.createdAt).getTime() >= dayStart.getTime()
		)
		const dayAggregate = getCashierAggregate(dayAllTransactions)
		const monthAggregate = getCashierAggregate(monthAllTransactions)
		const cashiersSalesList = getCashiersSalesList(monthAllTransactions, dayAllTransactions)

		const res = NextResponse.json({
			user: {
				id: user.id,
				name: user.name || user.login
			},
			day: getStats(dayTransactions),
			month: getStats(monthTransactions),
			recent: monthTransactions.slice(0, 20),
			allCashiers: {
				day: {
					...getStats(dayAllTransactions),
					cashiersCount: dayAggregate.cashiersCount,
					top: dayAggregate.top
				},
				month: {
					...getStats(monthAllTransactions),
					cashiersCount: monthAggregate.cashiersCount,
					top: monthAggregate.top
				},
				list: cashiersSalesList
			}
		})
		res.headers.set('Cache-Control', 'no-store')
		return res
	} catch (err) {
		console.error('user/sales error', err)
		return NextResponse.json({ message: 'Internal error' }, { status: 500 })
	}
}
