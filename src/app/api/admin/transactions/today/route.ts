import { NextResponse } from 'next/server'
import { getActiveShift } from '@/lib/shiftStore'
import { getShiftTransactions } from '@/lib/transactionsStore'
import { prisma } from '@/lib/prisma'
import { ensureReceiptTables } from '@/lib/receiptDb'

export async function GET() {
  const shift = await getActiveShift()

  if (!shift) {
    return NextResponse.json({ data: [] })
  }

  await ensureReceiptTables()

  const receipts = (await (prisma as any).$queryRawUnsafe(
    `
    SELECT
      r."id",
      r."userId",
      r."shiftId",
      r."paymentMethod",
      r."barberAmount",
      r."cosmeticsAmount",
      r."totalAmount",
      r."createdAt",
      u."name" AS "user_name"
    FROM "CashierReceipt" r
    LEFT JOIN "User" u ON u."id" = r."userId"
    WHERE r."shiftId" = $1
    ORDER BY r."createdAt" DESC, r."id" DESC
    `,
    shift.id
  )) as Array<any>

  if (!receipts.length) {
    const transactions = await getShiftTransactions(shift.id)
    return NextResponse.json({ data: transactions })
  }

  const receiptIds = receipts.map((r) => r.id)
  const items = (await (prisma as any).$queryRawUnsafe(
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
  for (const item of items) {
    const list = itemsByReceipt.get(item.receiptId) ?? []
    list.push(item)
    itemsByReceipt.set(item.receiptId, list)
  }

  const data = receipts.map((r) => ({
    id: r.id,
    amount: r.totalAmount,
    paymentMethod: r.paymentMethod,
    createdAt: r.createdAt,
    barberAmount: r.barberAmount,
    cosmeticsAmount: r.cosmeticsAmount,
    items: itemsByReceipt.get(r.id) ?? [],
    user: {
      id: r.userId,
      name: r.user_name ?? '—'
    }
  }))

  return NextResponse.json({ data })
}
