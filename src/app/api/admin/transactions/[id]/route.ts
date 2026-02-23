import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureInventoryTables } from '@/lib/inventoryDb'
import { ensureReceiptTables } from '@/lib/receiptDb'

export async function DELETE(
  _req: Request,
{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params
  const transactionId = Number(id)
	

  if (Number.isNaN(transactionId)) {
    return NextResponse.json(
      { message: 'Invalid transaction id' },
      { status: 400 }
    )
  }

  await ensureReceiptTables()
  await ensureInventoryTables()

  const receiptRows = (await (prisma as any).$queryRawUnsafe(
    `
    SELECT
      "id",
      "barberTransactionId",
      "cosmeticsTransactionId"
    FROM "CashierReceipt"
    WHERE "id" = $1
    LIMIT 1
    `,
    transactionId
  )) as Array<{
    id: number
    barberTransactionId: number | null
    cosmeticsTransactionId: number | null
  }>

  if (receiptRows[0]) {
    const receiptId = receiptRows[0].id
    const items = (await (prisma as any).$queryRawUnsafe(
      `
      SELECT "itemId", "quantity", "itemName"
      FROM "CashierReceiptItem"
      WHERE "receiptId" = $1
      `,
      receiptId
    )) as Array<{ itemId: number | null; quantity: number; itemName: string }>

    for (const item of items) {
      if (!item.itemId) continue
      await (prisma as any).$executeRawUnsafe(
        `
        UPDATE "InventoryItem"
        SET "quantity" = "quantity" + $1,
            "updatedAt" = NOW()
        WHERE "id" = $2
        `,
        Math.round(item.quantity),
        item.itemId
      )

      await (prisma as any).$executeRawUnsafe(
        `
        INSERT INTO "InventorySupply" ("itemId", "operationType", "quantity", "note", "createdAt")
        VALUES ($1, 'SUPPLY', $2, $3, NOW())
        `,
        item.itemId,
        Math.round(item.quantity),
        `Повернення після видалення чеку #${receiptId}`
      )
    }

    const txIds = [receiptRows[0].barberTransactionId, receiptRows[0].cosmeticsTransactionId]
      .filter((v): v is number => typeof v === 'number' && v > 0)

    if (txIds.length > 0) {
      await (prisma as any).$executeRawUnsafe(
        `DELETE FROM "Transaction" WHERE "id" = ANY($1::int[])`,
        txIds
      )
    }

    await (prisma as any).$executeRawUnsafe(
      `DELETE FROM "CashierReceipt" WHERE "id" = $1`,
      receiptId
    )
  } else {
    // Legacy fallback (old behavior).
    await prisma.transaction.delete({
      where: { id: transactionId }
    })
  }

  return NextResponse.json({ ok: true })
}
