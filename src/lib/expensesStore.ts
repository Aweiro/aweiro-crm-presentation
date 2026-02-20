import { prisma } from '@/lib/prisma'

export async function addExpense(data: {
	amount: number
	category?: 'SALARY' | 'RENT' | 'UTILITIES' | 'OTHER'
	salaryUserId?: number
	comment?: string
	shiftId: number
}) {
	return (prisma.expense as any).create({
		data: {
			amount: data.amount,
			category: data.category ?? 'OTHER',
			salaryUserId: data.salaryUserId,
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
