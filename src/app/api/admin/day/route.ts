import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Transaction } from '@prisma/client'

export const runtime = 'nodejs'

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

		const transactions: Transaction[] = await prisma.transaction.findMany({
			where: { shiftId: shift.id },
			include: { user: true },
			orderBy: { createdAt: 'desc' }
		})


		const expenses = await prisma.expense.findMany({
			where: { shiftId: shift.id },
			orderBy: { createdAt: 'desc' }
		})

		const cashIncome = transactions
			.filter((t: any) => t.paymentMethod === 'CASH')
			.reduce((s, t) => s + t.amount, 0)

		const cardIncome = transactions
			.filter((t) => t.paymentMethod === 'CARD')
			.reduce((s, t) => s + t.amount, 0)

		const expensesSum = expenses.reduce((s, e) => s + e.amount, 0)

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
