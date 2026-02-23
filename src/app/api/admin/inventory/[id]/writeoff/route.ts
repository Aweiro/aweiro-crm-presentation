import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureInventoryTables } from '@/lib/inventoryDb'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInventoryTables()

    const { id } = await params
    const itemId = Number(id)
    if (!Number.isFinite(itemId)) {
      return NextResponse.json({ message: 'Invalid item id' }, { status: 400 })
    }

    const body = await req.json()
    const quantity = Number(body.quantity)
    const note = String(body.note || '').trim()

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ message: 'Кількість списання має бути більше 0' }, { status: 400 })
    }

    const requested = Math.round(quantity)
    const rows = (await (prisma as any).$queryRawUnsafe(
      `
      UPDATE "InventoryItem"
      SET "quantity" = "quantity" - $1,
          "updatedAt" = NOW()
      WHERE "id" = $2 AND "isActive" = TRUE AND "quantity" >= $1
      RETURNING "id", "shortName", "description", "price", "quantity", "isActive", "createdAt", "updatedAt"
      `,
      requested,
      itemId
    )) as any[]

    if (!rows[0]) {
      return NextResponse.json(
        { message: 'Недостатньо товару на складі або позицію не знайдено' },
        { status: 400 }
      )
    }

    await (prisma as any).$executeRawUnsafe(
      `
      INSERT INTO "InventorySupply" ("itemId", "operationType", "quantity", "note", "createdAt")
      VALUES ($1, 'WRITEOFF', $2, $3, NOW())
      `,
      itemId,
      requested,
      note || 'Списання'
    )

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('PATCH /api/admin/inventory/[id]/writeoff error', error)
    return NextResponse.json({ message: 'Не вдалося списати товар' }, { status: 500 })
  }
}
