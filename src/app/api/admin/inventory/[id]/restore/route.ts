import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureInventoryTables } from '@/lib/inventoryDb'

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInventoryTables()

    const { id } = await params
    const itemId = Number(id)
    if (!Number.isFinite(itemId)) {
      return NextResponse.json({ message: 'Invalid item id' }, { status: 400 })
    }

    const rows = (await (prisma as any).$queryRawUnsafe(
      `
      UPDATE "InventoryItem"
      SET "isActive" = TRUE,
          "updatedAt" = NOW()
      WHERE "id" = $1 AND "isActive" = FALSE
      RETURNING "id", "shortName", "description", "price", "quantity", "isActive", "createdAt", "updatedAt"
      `,
      itemId
    )) as any[]

    if (!rows[0]) {
      return NextResponse.json({ message: 'Товар не знайдено' }, { status: 404 })
    }

    await (prisma as any).$executeRawUnsafe(
      `
      INSERT INTO "InventorySupply" ("itemId", "operationType", "quantity", "note", "createdAt")
      VALUES ($1, 'RESTORE', 0, $2, NOW())
      `,
      itemId,
      `Відновлення позиції: ${rows[0].shortName}`
    )

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('PATCH /api/admin/inventory/[id]/restore error', error)
    return NextResponse.json({ message: 'Не вдалося відновити товар' }, { status: 500 })
  }
}
