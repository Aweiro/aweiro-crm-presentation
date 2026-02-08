import { prisma } from '@/lib/prisma'

export async function addExpense(data: {
	amount: number
	comment?: string
	shiftId: number
}) {
	return prisma.expense.create({
		data: {
			amount: data.amount,
			comment: data.comment,
			createdAt: new Date(),
			shiftId: data.shiftId
		}
	})
}

export function getShiftExpenses(shiftId: number) {
	try {
		return prisma.expense.findMany({
			where: { shiftId }
		})
	} catch (e) {
		console.error('❌ getShiftExpenses error', e)
		return []
	}
}
