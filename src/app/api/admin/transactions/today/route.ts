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
      r."discount",
      r."totalAmount",
      r."createdAt",
      r."barberTransactionId",
      r."cosmeticsTransactionId",
      u."name" AS "user_name"
    FROM "CashierReceipt" r
    LEFT JOIN "User" u ON u."id" = r."userId"
    WHERE r."shiftId" = $1
    ORDER BY r."createdAt" DESC, r."id" DESC
    `,
    shift.id
  )) as Array<any>

  let data: any[] = []

  if (receipts.length > 0) {
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

    data = receipts.map((r) => ({
      id: r.id,
      amount: r.totalAmount,
      paymentMethod: r.paymentMethod,
      createdAt: r.createdAt,
      barberAmount: r.barberAmount,
      cosmeticsAmount: r.cosmeticsAmount,
      discount: r.discount || 0,
      items: itemsByReceipt.get(r.id) ?? [],
      user: {
        id: r.userId,
        name: r.user_name ?? '—'
      }
    }))
  }

  // Always also fetch standalone transactions not linked to receipts
  const linkedTxIds = receipts
    .flatMap((r) => [r.barberTransactionId, r.cosmeticsTransactionId])
    .filter((id: number | null) => id != null)

  const transactions = await getShiftTransactions(shift.id)
  const standaloneTx = linkedTxIds.length > 0
    ? transactions.filter((t: any) => !linkedTxIds.includes(t.id))
    : transactions

  if (standaloneTx.length > 0) {
    data = [...data, ...standaloneTx]
    data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return NextResponse.json({ data })
}
