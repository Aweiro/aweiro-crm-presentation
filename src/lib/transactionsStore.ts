import { prisma } from '@/lib/prisma'

export async function addTransaction(data: {
	userId: number
	amount: number
	paymentMethod: 'CASH' | 'CARD'
	shiftId: number
}) {
	return prisma.transaction.create({
		data: {
			userId: data.userId,
			amount: data.amount,
			paymentMethod: data.paymentMethod,
			createdAt: new Date(),
			shiftId: data.shiftId
		}
	})
}

export function getShiftTransactions(shiftId: number) {
	try {
		return prisma.transaction.findMany({
			where: { shiftId },
			orderBy: { createdAt: 'desc' },
			include: {
				user: {
					select: {
						id: true,
						name: true
					}
				}
			}
		})
	} catch (e) {
		console.error('❌ getShiftTransactions error', e)
		return []
	}
}
