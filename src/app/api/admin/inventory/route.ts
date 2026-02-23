import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureInventoryTables } from '@/lib/inventoryDb'

export async function GET() {
  try {
    await ensureInventoryTables()

    const items = (await (prisma as any).$queryRawUnsafe(`
      SELECT
        "id",
        "shortName",
        "description",
        "price",
        "quantity",
        "isActive",
        "createdAt",
        "updatedAt"
      FROM "InventoryItem"
      WHERE "isActive" = TRUE
      ORDER BY "updatedAt" DESC, "id" DESC
    `)) as Array<{
      id: number
      shortName: string
      description: string | null
      price: number
      quantity: number
      isActive: boolean
      createdAt: string
      updatedAt: string
    }>

    const deletedItems = (await (prisma as any).$queryRawUnsafe(`
      SELECT
        "id",
        "shortName",
        "description",
        "price",
        "quantity",
        "isActive",
        "createdAt",
        "updatedAt"
      FROM "InventoryItem"
      WHERE "isActive" = FALSE
      ORDER BY "updatedAt" DESC, "id" DESC
    `)) as Array<{
      id: number
      shortName: string
      description: string | null
      price: number
      quantity: number
      isActive: boolean
      createdAt: string
      updatedAt: string
    }>

    const operations = (await (prisma as any).$queryRawUnsafe(`
      SELECT
        s."id",
        s."itemId",
        COALESCE(i."shortName", '[Видалений товар]') AS "itemName",
        s."operationType",
        s."quantity",
        s."note",
        s."createdAt"
      FROM "InventorySupply" s
      LEFT JOIN "InventoryItem" i ON i."id" = s."itemId"
      ORDER BY s."createdAt" DESC, s."id" DESC
      LIMIT 200
    `)) as Array<{
      id: number
      itemId: number
      itemName: string
      operationType: 'SUPPLY' | 'WRITEOFF' | 'DELETE' | 'RESTORE' | 'PRICE_CHANGE'
      quantity: number
      note: string | null
      createdAt: string
    }>

    return NextResponse.json({ data: items, deletedItems, operations })
  } catch (error) {
    console.error('GET /api/admin/inventory error', error)
    return NextResponse.json({ message: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureInventoryTables()

    const body = await req.json()
    const shortName = String(body.shortName || '').trim()
    const description = String(body.description || '').trim()
    const price = Number(body.price)
    const quantity = Number(body.quantity || 0)

    if (!shortName) {
      return NextResponse.json({ message: 'Вкажіть коротку назву' }, { status: 400 })
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ message: 'Вкажіть коректну ціну' }, { status: 400 })
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      return NextResponse.json({ message: 'Вкажіть коректну кількість' }, { status: 400 })
    }

    const rows = (await (prisma as any).$queryRawUnsafe(
      `
      INSERT INTO "InventoryItem" ("shortName", "description", "price", "quantity", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
      RETURNING "id", "shortName", "description", "price", "quantity", "isActive", "createdAt", "updatedAt"
      `,
      shortName,
      description || null,
      Math.round(price),
      Math.round(quantity)
    )) as any[]

    if (Math.round(quantity) > 0) {
      await (prisma as any).$executeRawUnsafe(
        `
        INSERT INTO "InventorySupply" ("itemId", "operationType", "quantity", "note", "createdAt")
        VALUES ($1, 'SUPPLY', $2, $3, NOW())
        `,
        rows[0].id,
        Math.round(quantity),
        'Стартовий залишок'
      )
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('POST /api/admin/inventory error', error)
    return NextResponse.json({ message: 'Не вдалося створити товар' }, { status: 500 })
  }
}
