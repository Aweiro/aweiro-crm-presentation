import { NextResponse } from 'next/server'
import { addExpense, getShiftExpenses } from '@/lib/expensesStore'
import { getActiveShift } from '@/lib/shiftStore'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const archive = searchParams.get('archive')

	// Якщо потрібні видатки з архіву (усі видатки)
	if (archive === 'true') {
		try {
			const expenses = await prisma.expense.findMany({
				orderBy: { createdAt: 'desc' }
			})
			return NextResponse.json({ data: expenses })
		} catch (e) {
			console.error('❌ admin/expenses archive error', e)
			return NextResponse.json({ message: 'Internal error' }, { status: 500 })
		}
	}

	// Інакше повертаємо видатки активної змін
	const shift = await getActiveShift()

	if (!shift) {
		return NextResponse.json({ data: [] })
	}

	const expenses = await getShiftExpenses(shift.id)
	return NextResponse.json({ data: expenses })
}

export async function POST(req: Request) {
	try {
		const body = await req.json()
		const { amount, comment } = body

		if (Number(amount) <= 0) {
			return NextResponse.json(
				{ message: 'Amount must be greater than 0' },
				{ status: 400 }
			)
		}

		const shift = await getActiveShift()
		if (!shift) {
			return NextResponse.json({ message: 'Shift is closed' }, { status: 403 })
		}

		const expense = await addExpense({
			amount: Number(amount),
			comment,
			shiftId: shift.id
		})

		return NextResponse.json(expense)
	} catch (e) {
		console.error('❌ add expense error', e)
		return NextResponse.json(
			{ message: 'Помилка створення витрати' },
			{ status: 500 }
		)
	}
}