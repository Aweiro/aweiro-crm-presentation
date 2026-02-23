import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getShiftTransactions } from '@/lib/transactionsStore'
import { ensureReceiptTables } from '@/lib/receiptDb'

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

	await ensureReceiptTables()

	let transactions: any[] = []
	const receiptRows = (await (prisma as any).$queryRawUnsafe(
		`
		SELECT
			r."id",
			r."userId",
			r."paymentMethod",
			r."barberAmount",
			r."cosmeticsAmount",
			r."totalAmount",
			r."createdAt",
			u."name" AS "user_name",
			u."login" AS "user_login"
		FROM "CashierReceipt" r
		LEFT JOIN "User" u ON u."id" = r."userId"
		WHERE r."shiftId" = $1
		ORDER BY r."createdAt" DESC, r."id" DESC
		`,
		shiftId
	)) as Array<any>

	if (receiptRows.length > 0) {
		const receiptIds = receiptRows.map((r) => r.id)
		const itemRows = (await (prisma as any).$queryRawUnsafe(
			`
			SELECT
				"id",
				"receiptId",
				"itemId",
				"itemName",
				"price",
				"quantity",
				"lineTotal"
			FROM "CashierReceiptItem"
			WHERE "receiptId" = ANY($1::int[])
			ORDER BY "id" ASC
			`,
			receiptIds
		)) as Array<any>

		const itemsByReceipt = new Map<number, any[]>()
		for (const row of itemRows) {
			const list = itemsByReceipt.get(row.receiptId) ?? []
			list.push({
				id: row.id,
				itemId: row.itemId,
				itemName: row.itemName,
				price: row.price,
				quantity: row.quantity,
				lineTotal: row.lineTotal
			})
			itemsByReceipt.set(row.receiptId, list)
		}

		transactions = receiptRows.map((r) => ({
			id: r.id,
			amount: r.totalAmount,
			paymentMethod: r.paymentMethod,
			barberAmount: r.barberAmount,
			cosmeticsAmount: r.cosmeticsAmount,
			items: itemsByReceipt.get(r.id) ?? [],
			createdAt: r.createdAt,
			user: {
				id: r.userId,
				name: r.user_name,
				login: r.user_login
			}
		}))
	} else {
		transactions = await getShiftTransactions(shiftId)
	}

	const expenses = await prisma.expense.findMany({
		where: { shiftId }
	})

	return NextResponse.json({
		shift,
		transactions,
		expenses
	})
}
