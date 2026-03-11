import { prisma } from '@/lib/prisma'

export async function addTransaction(data: {
	userId: number
	amount: number
	discount?: number
	paymentMethod: 'CASH' | 'CARD'
	serviceType?: 'BARBER' | 'COSMETICS'
	shiftId: number
}) {
	const createdAt = new Date()
	const createData: any = {
		userId: data.userId,
		amount: data.amount,
		discount: data.discount || 0,
		paymentMethod: data.paymentMethod,
		createdAt,
		shiftId: data.shiftId
	}

	if (data.serviceType) {
		createData.serviceType = data.serviceType
	}

	try {
		return await prisma.transaction.create({
			data: createData
		} as any)
	} catch (error: any) {
		const message = String(error?.message || '')
		if (createData.serviceType && message.includes('serviceType')) {
			// Prisma client can be stale; try raw SQL with explicit serviceType.
			try {
				const rows = await (prisma as any).$queryRawUnsafe(
					`INSERT INTO "Transaction"
						("userId","amount","discount","paymentMethod","serviceType","createdAt","shiftId")
					 VALUES ($1,$2,$3,$4,$5,$6,$7)
					 RETURNING *`,
					data.userId,
					data.amount,
					data.discount || 0,
					data.paymentMethod,
					data.serviceType,
					createdAt,
					data.shiftId
				)
				return Array.isArray(rows) ? rows[0] : rows
			} catch (rawError: any) {
				const rawMessage = String(rawError?.message || '')
				// Column may still be absent in DB; fallback to old insert.
				if (rawMessage.includes('serviceType') || rawMessage.includes('column')) {
					delete createData.serviceType
					return prisma.transaction.create({
						data: createData
					} as any)
				}
				throw rawError
			}
		}
		throw error
	}
}

export function getShiftTransactions(shiftId: number) {
	try {
		return (async () => {
			try {
				const rows = await (prisma as any).$queryRawUnsafe(
					`SELECT
						t."id",
						t."amount",
						t."discount",
						t."paymentMethod",
						COALESCE(CAST(t."serviceType" AS text), 'BARBER') AS "serviceType",
						t."createdAt",
						t."userId",
						t."shiftId",
						u."id" AS "user_id",
						u."name" AS "user_name"
					FROM "Transaction" t
					LEFT JOIN "User" u ON u."id" = t."userId"
					WHERE t."shiftId" = $1
					ORDER BY t."createdAt" DESC`,
					shiftId
				)

				return (rows as any[]).map((r) => ({
					id: r.id,
					amount: r.amount,
					discount: r.discount || 0,
					paymentMethod: r.paymentMethod,
					serviceType: r.serviceType,
					createdAt: r.createdAt,
					userId: r.userId,
					shiftId: r.shiftId,
					user: {
						id: r.user_id ?? r.userId,
						name: r.user_name ?? null
					}
				}))
			} catch {
				const fallback = await prisma.transaction.findMany({
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
				return fallback.map((t: any) => ({ ...t, serviceType: 'BARBER' }))
			}
		})()
	} catch (e) {
		console.error('❌ getShiftTransactions error', e)
		return []
	}
}
