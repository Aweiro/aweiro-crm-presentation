import { prisma } from '@/lib/prisma'

export async function ensureReceiptTables() {
  await (prisma as any).$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CashierReceipt" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
      "shiftId" INTEGER NOT NULL REFERENCES "Shift"("id") ON DELETE RESTRICT,
      "paymentMethod" TEXT NOT NULL,
      "barberAmount" INTEGER NOT NULL DEFAULT 0,
      "cosmeticsAmount" INTEGER NOT NULL DEFAULT 0,
      "totalAmount" INTEGER NOT NULL DEFAULT 0,
      "barberTransactionId" INTEGER,
      "cosmeticsTransactionId" INTEGER,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await (prisma as any).$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CashierReceiptItem" (
      "id" SERIAL PRIMARY KEY,
      "receiptId" INTEGER NOT NULL REFERENCES "CashierReceipt"("id") ON DELETE CASCADE,
      "itemId" INTEGER,
      "itemName" TEXT NOT NULL,
      "price" INTEGER NOT NULL,
      "quantity" INTEGER NOT NULL,
      "lineTotal" INTEGER NOT NULL
    )
  `)

  // Backward-compatible schema updates for existing installations.
  await (prisma as any).$executeRawUnsafe(`
    ALTER TABLE "CashierReceipt"
    ADD COLUMN IF NOT EXISTS "discount" INTEGER NOT NULL DEFAULT 0
  `)

  await (prisma as any).$executeRawUnsafe(`
    ALTER TABLE "CashierReceipt"
    ADD COLUMN IF NOT EXISTS "barberTransactionId" INTEGER
  `)

  await (prisma as any).$executeRawUnsafe(`
    ALTER TABLE "CashierReceipt"
    ADD COLUMN IF NOT EXISTS "cosmeticsTransactionId" INTEGER
  `)

  await (prisma as any).$executeRawUnsafe(`
    ALTER TABLE "CashierReceipt"
    ADD COLUMN IF NOT EXISTS "totalAmount" INTEGER NOT NULL DEFAULT 0
  `)
}
