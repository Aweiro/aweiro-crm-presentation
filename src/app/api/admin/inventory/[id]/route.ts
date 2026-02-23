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
    const shortName = String(body.shortName || '').trim()
    const description = String(body.description || '').trim()
    const price = Number(body.price)

    if (!shortName) {
      return NextResponse.json({ message: 'Вкажіть коротку назву' }, { status: 400 })
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ message: 'Вкажіть коректну ціну' }, { status: 400 })
    }

    const currentRows = (await (prisma as any).$queryRawUnsafe(
      `
      SELECT "id", "shortName", "description", "price", "quantity", "isActive", "createdAt", "updatedAt"
      FROM "InventoryItem"
      WHERE "id" = $1 AND "isActive" = TRUE
      LIMIT 1
      `,
      itemId
    )) as any[]

    if (!currentRows[0]) {
      return NextResponse.json({ message: 'Товар не знайдено' }, { status: 404 })
    }

    const nextPrice = Math.round(price)
    const rows = (await (prisma as any).$queryRawUnsafe(
      `
      UPDATE "InventoryItem"
      SET "shortName" = $1,
          "description" = $2,
          "price" = $3,
          "updatedAt" = NOW()
      WHERE "id" = $4 AND "isActive" = TRUE
      RETURNING "id", "shortName", "description", "price", "quantity", "isActive", "createdAt", "updatedAt"
      `,
      shortName,
      description || null,
      nextPrice,
      itemId
    )) as any[]

    const prevPrice = Number(currentRows[0].price)
    if (prevPrice !== nextPrice) {
      await (prisma as any).$executeRawUnsafe(
        `
        INSERT INTO "InventorySupply" ("itemId", "operationType", "quantity", "note", "createdAt")
        VALUES ($1, 'PRICE_CHANGE', 0, $2, NOW())
        `,
        itemId,
        `Зміна ціни: ${prevPrice} -> ${nextPrice}`
      )
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('PATCH /api/admin/inventory/[id] error', error)
    return NextResponse.json({ message: 'Не вдалося оновити товар' }, { status: 500 })
  }
}

export async function DELETE(
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
      WITH target AS (
        SELECT "id", "shortName", "quantity"
        FROM "InventoryItem"
        WHERE "id" = $1 AND "isActive" = TRUE
      )
      UPDATE "InventoryItem" i
      SET "isActive" = FALSE,
          "quantity" = 0,
          "updatedAt" = NOW()
      FROM target t
      WHERE i."id" = t."id"
      RETURNING t."id" AS "id", t."shortName" AS "shortName", t."quantity" AS "quantity"
      `,
      itemId
    )) as Array<{ id: number; shortName: string; quantity: number }>

    if (!rows[0]) {
      return NextResponse.json({ message: 'Товар не знайдено' }, { status: 404 })
    }

    await (prisma as any).$executeRawUnsafe(
      `
      INSERT INTO "InventorySupply" ("itemId", "operationType", "quantity", "note", "createdAt")
      VALUES ($1, 'DELETE', $2, $3, NOW())
      `,
      itemId,
      Math.max(0, rows[0].quantity),
      `Видалення позиції: ${rows[0].shortName}`
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/admin/inventory/[id] error', error)
    return NextResponse.json({ message: 'Не вдалося видалити товар' }, { status: 500 })
  }
}
