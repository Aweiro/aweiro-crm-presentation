import { NextResponse } from 'next/server'
import { addTransaction } from '@/lib/transactionsStore'
import { getActiveShift } from '@/lib/shiftStore'
import { prisma } from '@/lib/prisma'
import { ensureInventoryTables } from '@/lib/inventoryDb'
import { ensureReceiptTables } from '@/lib/receiptDb'

export async function POST(req: Request) {
  try {
    await ensureReceiptTables()
    await ensureInventoryTables()

    const body = await req.json()

    const userId = Number(body.userId)
    const amount = Number(body.amount)
    const serviceType = body.serviceType === 'COSMETICS' ? 'COSMETICS' : 'BARBER'
    const barberAmount = Number(body.barberAmount || 0)
    const paymentMethod = body.paymentMethod === 'CARD' ? 'CARD' : 'CASH'
    const cosmeticsItems = Array.isArray(body.cosmeticsItems)
      ? body.cosmeticsItems
      : []

    if (!userId) {
      return NextResponse.json(
        { message: 'Invalid data' },
        { status: 400 }
      )
    }

    // 🔐 Перевірка юзера
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: 'Працівник неактивний або не існує' },
        { status: 403 }
      )
    }

    // 🔐 Активна зміна
    const shift = await getActiveShift()
    if (!shift) {
      return NextResponse.json(
        { message: 'Немає активної зміни' },
        { status: 400 }
      )
    }

    // Backward-compatible mode (single amount + serviceType).
    if (amount > 0) {
      const tx = await addTransaction({
        userId,
        amount,
        paymentMethod,
        serviceType,
        shiftId: shift.id
      })

      return NextResponse.json(tx)
    }

    const hasBarber = Number.isFinite(barberAmount) && barberAmount > 0
    const requestedCosmetics = cosmeticsItems
      .map((item: any) => ({
        itemId: Number(item?.itemId),
        quantity: Number(item?.quantity)
      }))
      .filter((item: { itemId: number; quantity: number }) =>
        Number.isFinite(item.itemId) && item.itemId > 0 && Number.isFinite(item.quantity) && item.quantity > 0
      )

    if (!hasBarber && requestedCosmetics.length === 0) {
      return NextResponse.json(
        { message: 'Додайте хоча б одну позицію в чек' },
        { status: 400 }
      )
    }

    let cosmeticsTotal = 0
    const soldItems: Array<{
      itemId: number
      itemName: string
      price: number
      quantity: number
      lineTotal: number
    }> = []
    if (requestedCosmetics.length > 0) {
      // Read current stock and prices.
      const rows = (await (prisma as any).$queryRawUnsafe(
        `
        SELECT "id", "shortName", "price", "quantity", "isActive"
        FROM "InventoryItem"
        WHERE "id" = ANY($1::int[])
        `,
        requestedCosmetics.map((i: { itemId: number }) => i.itemId)
      )) as Array<{
        id: number
        shortName: string
        price: number
        quantity: number
        isActive: boolean
      }>

      const inventoryMap = new Map(rows.map((r) => [r.id, r]))
      for (const item of requestedCosmetics) {
        const dbItem = inventoryMap.get(item.itemId)
        if (!dbItem || !dbItem.isActive) {
          return NextResponse.json(
            { message: `Товар #${item.itemId} недоступний` },
            { status: 400 }
          )
        }
        if (dbItem.quantity < item.quantity) {
          return NextResponse.json(
            { message: `Недостатньо товару "${dbItem.shortName}" на складі` },
            { status: 400 }
          )
        }
      }

      // Write off items from stock + history.
      for (const item of requestedCosmetics) {
        const dbItem = inventoryMap.get(item.itemId)!
        await (prisma as any).$executeRawUnsafe(
          `
          UPDATE "InventoryItem"
          SET "quantity" = "quantity" - $1,
              "updatedAt" = NOW()
          WHERE "id" = $2
          `,
          Math.round(item.quantity),
          item.itemId
        )

        await (prisma as any).$executeRawUnsafe(
          `
          INSERT INTO "InventorySupply" ("itemId", "operationType", "quantity", "note", "createdAt")
          VALUES ($1, 'WRITEOFF', $2, $3, NOW())
          `,
          item.itemId,
          Math.round(item.quantity),
          `Продаж у чеку (касир #${userId})`
        )

        cosmeticsTotal += dbItem.price * Math.round(item.quantity)
        soldItems.push({
          itemId: dbItem.id,
          itemName: dbItem.shortName,
          price: dbItem.price,
          quantity: Math.round(item.quantity),
          lineTotal: dbItem.price * Math.round(item.quantity)
        })
      }
    }

    const created: any[] = []
    let barberTxId: number | null = null
    let cosmeticsTxId: number | null = null
    if (hasBarber) {
      const tx = await addTransaction({
        userId,
        amount: Math.round(barberAmount),
        paymentMethod,
        serviceType: 'BARBER',
        shiftId: shift.id
      })
      created.push(tx)
      barberTxId = Number(tx?.id) || null
    }

    if (cosmeticsTotal > 0) {
      const tx = await addTransaction({
        userId,
        amount: Math.round(cosmeticsTotal),
        paymentMethod,
        serviceType: 'COSMETICS',
        shiftId: shift.id
      })
      created.push(tx)
      cosmeticsTxId = Number(tx?.id) || null
    }

    const receiptRows = (await (prisma as any).$queryRawUnsafe(
      `
      INSERT INTO "CashierReceipt"
        ("userId","shiftId","paymentMethod","barberAmount","cosmeticsAmount","totalAmount","barberTransactionId","cosmeticsTransactionId","createdAt")
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
      RETURNING "id"
      `,
      userId,
      shift.id,
      paymentMethod,
      hasBarber ? Math.round(barberAmount) : 0,
      cosmeticsTotal,
      (hasBarber ? Math.round(barberAmount) : 0) + cosmeticsTotal,
      barberTxId,
      cosmeticsTxId
    )) as Array<{ id: number }>

    const receiptId = receiptRows[0]?.id
    if (receiptId && soldItems.length > 0) {
      for (const item of soldItems) {
        await (prisma as any).$executeRawUnsafe(
          `
          INSERT INTO "CashierReceiptItem"
            ("receiptId","itemId","itemName","price","quantity","lineTotal")
          VALUES ($1,$2,$3,$4,$5,$6)
          `,
          receiptId,
          item.itemId,
          item.itemName,
          item.price,
          item.quantity,
          item.lineTotal
        )
      }
    }

    return NextResponse.json({
      ok: true,
      receiptId,
      created,
      summary: {
        barberAmount: hasBarber ? Math.round(barberAmount) : 0,
        cosmeticsTotal,
        total: (hasBarber ? Math.round(barberAmount) : 0) + cosmeticsTotal
      }
    })

  } catch (e) {
    console.error('❌ add transaction error', e)

    return NextResponse.json(
      { message: 'Помилка створення транзакції' },
      { status: 500 }
    )
  }
}
