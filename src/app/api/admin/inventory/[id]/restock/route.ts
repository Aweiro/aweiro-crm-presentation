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
      return NextResponse.json({ message: 'Кількість має бути більше 0' }, { status: 400 })
    }

    const updateRows = (await (prisma as any).$queryRawUnsafe(
      `
      UPDATE "InventoryItem"
      SET "quantity" = "quantity" + $1,
          "updatedAt" = NOW()
      WHERE "id" = $2 AND "isActive" = TRUE
      RETURNING "id", "shortName", "description", "price", "quantity", "isActive", "createdAt", "updatedAt"
      `,
      Math.round(quantity),
      itemId
    )) as any[]

    if (!updateRows[0]) {
      return NextResponse.json({ message: 'Товар не знайдено' }, { status: 404 })
    }

    await (prisma as any).$executeRawUnsafe(
      `
      INSERT INTO "InventorySupply" ("itemId", "operationType", "quantity", "note", "createdAt")
      VALUES ($1, 'SUPPLY', $2, $3, NOW())
      `,
      itemId,
      Math.round(quantity),
      note || 'Поставка'
    )

    return NextResponse.json(updateRows[0])
  } catch (error) {
    console.error('PATCH /api/admin/inventory/[id]/restock error', error)
    return NextResponse.json({ message: 'Не вдалося додати поставку' }, { status: 500 })
  }
}
