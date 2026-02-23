import { prisma } from '@/lib/prisma'

export async function ensureInventoryTables() {
  await (prisma as any).$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "InventoryItem" (
      "id" SERIAL PRIMARY KEY,
      "shortName" TEXT NOT NULL,
      "description" TEXT,
      "price" INTEGER NOT NULL DEFAULT 0,
      "quantity" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await (prisma as any).$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "InventorySupply" (
      "id" SERIAL PRIMARY KEY,
      "itemId" INTEGER NOT NULL REFERENCES "InventoryItem"("id") ON DELETE CASCADE,
      "operationType" TEXT NOT NULL DEFAULT 'SUPPLY',
      "quantity" INTEGER NOT NULL,
      "note" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await (prisma as any).$executeRawUnsafe(`
    ALTER TABLE "InventoryItem"
    ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE
  `)

  await (prisma as any).$executeRawUnsafe(`
    ALTER TABLE "InventorySupply"
    ADD COLUMN IF NOT EXISTS "operationType" TEXT NOT NULL DEFAULT 'SUPPLY'
  `)
}
