import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

type DayTransaction = Prisma.TransactionGetPayload<{
	include: { user: true }
}>

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

		const transactions: DayTransaction[] = await prisma.transaction.findMany({
			where: { shiftId: shift.id },
			include: { user: true },
			orderBy: { createdAt: 'desc' }
		})

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
