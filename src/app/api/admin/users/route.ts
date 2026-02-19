import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { parseExpenseComment } from '@/lib/expenseMeta'

export async function GET() {
	const users = (await (async () => {
		try {
			return await (prisma as any).$queryRawUnsafe(`
				SELECT
					"id",
					"login",
					"name",
					"role",
					"isActive",
					COALESCE("barberPercent", 0) AS "barberPercent",
					COALESCE("cosmeticsPercent", 0) AS "cosmeticsPercent"
				FROM "User"
				ORDER BY "isActive" DESC, "id" ASC
			`)
		} catch {
			// Fallback for DBs where new columns are not migrated yet.
			return await (prisma as any).$queryRawUnsafe(`
				SELECT
					"id",
					"login",
					"name",
					"role",
					"isActive",
					0 AS "barberPercent",
					0 AS "cosmeticsPercent"
				FROM "User"
				ORDER BY "isActive" DESC, "id" ASC
			`)
		}
	})()) as any[]

	const now = new Date()
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
	const dayStart = new Date(now)
	dayStart.setHours(0, 0, 0, 0)

	const transactions = (await (async () => {
		try {
			return await (prisma as any).$queryRawUnsafe(
				`SELECT
					"userId",
					"amount",
					COALESCE(CAST("serviceType" AS text), 'BARBER') AS "serviceType",
					"createdAt"
				FROM "Transaction"
				WHERE "createdAt" >= $1`,
				monthStart
			)
		} catch {
			return await (prisma as any).$queryRawUnsafe(
				`SELECT
					"userId",
					"amount",
					'BARBER' AS "serviceType",
					"createdAt"
				FROM "Transaction"
				WHERE "createdAt" >= $1`,
				monthStart
			)
		}
	})()) as Array<{
		userId: number
		amount: number
		serviceType?: 'BARBER' | 'COSMETICS'
		createdAt: Date
	}>

	const dayStartTs = dayStart.getTime()
	const txStats = new Map<
		number,
		{
			monthBarber: number
			monthCosmetics: number
			dayBarber: number
			dayCosmetics: number
		}
	>()

	transactions.forEach((tx) => {
		const stats = txStats.get(tx.userId) ?? {
			monthBarber: 0,
			monthCosmetics: 0,
			dayBarber: 0,
			dayCosmetics: 0
		}
		const isDay = new Date(tx.createdAt).getTime() >= dayStartTs

		const txServiceType = tx.serviceType === 'COSMETICS' ? 'COSMETICS' : 'BARBER'

		if (txServiceType === 'COSMETICS') {
			stats.monthCosmetics += tx.amount
			if (isDay) stats.dayCosmetics += tx.amount
		} else {
			stats.monthBarber += tx.amount
			if (isDay) stats.dayBarber += tx.amount
		}
		txStats.set(tx.userId, stats)
	})

	const monthExpenses = await prisma.expense.findMany({
		where: {
			createdAt: { gte: monthStart }
		},
		select: {
			id: true,
			amount: true,
			comment: true,
			createdAt: true,
			shiftId: true
		}
	})

	const paidMonthMap = new Map<number, number>()
	const paidDayMap = new Map<number, number>()

	monthExpenses.forEach((expense) => {
		const meta = parseExpenseComment(expense.comment)
		if (meta.category !== 'SALARY' || !meta.salaryUserId) return

		paidMonthMap.set(
			meta.salaryUserId,
			(paidMonthMap.get(meta.salaryUserId) ?? 0) + expense.amount
		)

		if (new Date(expense.createdAt).getTime() >= dayStartTs) {
			paidDayMap.set(
				meta.salaryUserId,
				(paidDayMap.get(meta.salaryUserId) ?? 0) + expense.amount
			)
		}
	})

	const data = users.map((user) => {
		const stats = txStats.get(user.id) ?? {
			monthBarber: 0,
			monthCosmetics: 0,
			dayBarber: 0,
			dayCosmetics: 0
		}

		const monthSalary =
			(stats.monthBarber * (user.barberPercent ?? 0)) / 100 +
			(stats.monthCosmetics * (user.cosmeticsPercent ?? 0)) / 100
		const daySalary =
			(stats.dayBarber * (user.barberPercent ?? 0)) / 100 +
			(stats.dayCosmetics * (user.cosmeticsPercent ?? 0)) / 100
		const paidMonthSalary = paidMonthMap.get(user.id) ?? 0
		const paidDaySalary = paidDayMap.get(user.id) ?? 0
		const monthSalaryDue = Math.max(0, monthSalary - paidMonthSalary)
		const daySalaryDue = Math.max(0, daySalary - paidDaySalary)

		return {
			...user,
			barberPercent: user.barberPercent ?? 0,
			cosmeticsPercent: user.cosmeticsPercent ?? 0,
			salaryStats: {
				monthBarber: stats.monthBarber,
				monthCosmetics: stats.monthCosmetics,
				dayBarber: stats.dayBarber,
				dayCosmetics: stats.dayCosmetics,
				monthSalary,
				daySalary,
				paidMonthSalary,
				paidDaySalary,
				monthSalaryDue,
				daySalaryDue
			}
		}
	})

	return NextResponse.json({
		data,
		monthExpenses: monthExpenses.map((expense) => {
			const meta = parseExpenseComment(expense.comment)
			return {
				id: expense.id,
				amount: expense.amount,
				createdAt: expense.createdAt,
				shiftId: expense.shiftId,
				comment: meta.cleanComment || expense.comment || 'Витрата',
				category: meta.category,
				salaryUserId: meta.salaryUserId
			}
		})
	})
}

export async function POST(req: Request) {
	try {
		const body = await req.json()

		const { login, password, name, role } = body
		const normalizedRole = role === 'ADMIN' ? 'ADMIN' : 'USER'

		if (!login || !password || !name) {
			return NextResponse.json(
				{ message: 'Missing fields' },
				{ status: 400 }
			)
		}

		// 🔒 хеш пароля
		const passwordHash = await bcrypt.hash(password, 10)

		const user = await prisma.user.create({
			data: {
				login,
				passwordHash,
				name,
				role: normalizedRole,
			}
		})

		return NextResponse.json(user)

	} catch (e) {
		console.error('❌ create user error', e)

		return NextResponse.json(
			{ message: 'Internal error' },
			{ status: 500 }
		)
	}
}
