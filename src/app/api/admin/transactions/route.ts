import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
	try {
		const transactions = await (prisma as any).$queryRawUnsafe(
			`SELECT
				t."id",
				t."amount",
				t."paymentMethod",
				COALESCE(CAST(t."serviceType" AS text), 'BARBER') AS "serviceType",
				t."createdAt",
				t."userId",
				t."shiftId",
				u."id" AS "user_id",
				u."name" AS "user_name",
				u."login" AS "user_login"
			FROM "Transaction" t
			LEFT JOIN "User" u ON u."id" = t."userId"
			ORDER BY t."createdAt" DESC`
		)

		const data = (transactions as any[]).map((t) => ({
			id: t.id,
			amount: t.amount,
			paymentMethod: t.paymentMethod,
			serviceType: t.serviceType,
			createdAt: t.createdAt,
			userId: t.userId,
			shiftId: t.shiftId,
			user: {
				id: t.user_id ?? t.userId,
				name: t.user_name,
				login: t.user_login
			}
		}))
		return NextResponse.json({ data })
	} catch (e) {
		console.error('❌ admin/transactions error', e)
		return NextResponse.json({ message: 'Internal error' }, { status: 500 })
	}
}
