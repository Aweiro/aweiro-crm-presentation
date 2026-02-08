import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getShiftTransactions } from '@/lib/transactionsStore'

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params // ⬅️ ОЦЕ ГОЛОВНЕ

	const shiftId = Number(id)

	if (Number.isNaN(shiftId)) {
		return NextResponse.json({ message: 'Invalid shift id' }, { status: 400 })
	}

	const shift = await prisma.shift.findUnique({
		where: { id: shiftId }
	})

	if (!shift) {
		return NextResponse.json({ message: 'Shift not found' }, { status: 404 })
	}

const transactions = await getShiftTransactions(shiftId)

	const expenses = await prisma.expense.findMany({
		where: { shiftId }
	})

	return NextResponse.json({
		shift,
		transactions,
		expenses
	})
}
