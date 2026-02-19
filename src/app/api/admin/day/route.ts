import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

type DayTransaction = {
	id: number
	amount: number
	paymentMethod: string
	serviceType?: 'BARBER' | 'COSMETICS'
	createdAt: Date
	user: {
		id: number
		name: string
		login: string
	}
}

export async function GET() {
	try {
		const shift = await prisma.shift.findFirst({
			where: { isOpen: true }
		})

		if (!shift) {
			return NextResponse.json({
				shift: null,
				transactions: [],
				expenses: [],
				summary: null
			})
		}

		let transactions: DayTransaction[] = []
		try {
			const rows = await (prisma as any).$queryRawUnsafe(
				`SELECT
					t."id",
					t."amount",
					t."paymentMethod",
					COALESCE(CAST(t."serviceType" AS text), 'BARBER') AS "serviceType",
					t."createdAt",
					u."id" AS "user_id",
					u."name" AS "user_name",
					u."login" AS "user_login"
				FROM "Transaction" t
				LEFT JOIN "User" u ON u."id" = t."userId"
				WHERE t."shiftId" = $1
				ORDER BY t."createdAt" DESC`,
				shift.id
			)

			transactions = (rows as any[]).map((r) => ({
				id: r.id,
				amount: r.amount,
				paymentMethod: r.paymentMethod,
				serviceType: r.serviceType,
				createdAt: r.createdAt,
				user: {
					id: r.user_id,
					name: r.user_name,
					login: r.user_login
				}
			}))
		} catch {
			const fallbackTx = await prisma.transaction.findMany({
				where: { shiftId: shift.id },
				select: {
					id: true,
					amount: true,
					paymentMethod: true,
					createdAt: true,
					user: {
						select: {
							id: true,
							name: true,
							login: true
						}
					}
				},
				orderBy: { createdAt: 'desc' }
			})
			transactions = fallbackTx.map((t) => ({ ...t, serviceType: 'BARBER' }))
		}

		const expenses = await prisma.expense.findMany({
			where: { shiftId: shift.id },
			orderBy: { createdAt: 'desc' }
		})

		const cashIncome = transactions
			.filter((t: DayTransaction) => t.paymentMethod === 'CASH')
			.reduce((sum: number, t: DayTransaction) => sum + t.amount, 0)

		const cardIncome = transactions
			.filter((t: DayTransaction) => t.paymentMethod === 'CARD')
			.reduce((sum: number, t: DayTransaction) => sum + t.amount, 0)

		const expensesSum = expenses.reduce(
			(sum: number, expense: { amount: number }) => sum + expense.amount,
			0
		)

		const cashStart = shift.cashStart ?? 0
		const cashEnd = cashStart + cashIncome - expensesSum

		return NextResponse.json({
			shift,
			transactions,
			expenses,
			summary: {
				cashStart,
				cashIncome,
				cardIncome,
				expenses: expensesSum,
				cashEnd
			}
		})
	} catch (e) {
		console.error('❌ admin/day error', e)
		return NextResponse.json({ message: 'Internal error' }, { status: 500 })
	}
}
