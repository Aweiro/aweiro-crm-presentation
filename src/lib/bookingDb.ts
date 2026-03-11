import { prisma } from '@/lib/prisma'

export async function ensureBookingTables() {
	await (prisma as any).$executeRawUnsafe(`
		CREATE TABLE IF NOT EXISTS "BarberService" (
			"id" SERIAL PRIMARY KEY,
			"name" TEXT NOT NULL,
			"price" INTEGER NOT NULL DEFAULT 0,
			"durationMin" INTEGER NOT NULL DEFAULT 30,
			"isActive" BOOLEAN NOT NULL DEFAULT TRUE,
			"createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			"updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)

	await (prisma as any).$executeRawUnsafe(`
		CREATE TABLE IF NOT EXISTS "UserBarberService" (
			"userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
			"serviceId" INTEGER NOT NULL REFERENCES "BarberService"("id") ON DELETE CASCADE,
			"price" INTEGER,
			"durationMin" INTEGER,
			"createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY ("userId", "serviceId")
		)
	`)

	await (prisma as any).$executeRawUnsafe(`
		ALTER TABLE "UserBarberService"
		ADD COLUMN IF NOT EXISTS "price" INTEGER
	`)
	await (prisma as any).$executeRawUnsafe(`
		ALTER TABLE "UserBarberService"
		ADD COLUMN IF NOT EXISTS "durationMin" INTEGER
	`)

	await (prisma as any).$executeRawUnsafe(`
		CREATE TABLE IF NOT EXISTS "ClientBooking" (
			"id" SERIAL PRIMARY KEY,
			"clientName" TEXT NOT NULL,
			"clientPhone" TEXT,
			"comment" TEXT,
			"barberId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
			"startAt" TIMESTAMPTZ NOT NULL,
			"endAt" TIMESTAMPTZ NOT NULL,
			"status" TEXT NOT NULL DEFAULT 'BOOKED',
			"createdById" INTEGER REFERENCES "User"("id") ON DELETE SET NULL,
			"createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)

	await (prisma as any).$executeRawUnsafe(`
		CREATE TABLE IF NOT EXISTS "ClientBookingService" (
			"bookingId" INTEGER NOT NULL REFERENCES "ClientBooking"("id") ON DELETE CASCADE,
			"serviceId" INTEGER NOT NULL REFERENCES "BarberService"("id") ON DELETE RESTRICT,
			"price" INTEGER NOT NULL,
			"durationMin" INTEGER NOT NULL,
			"orderIndex" INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY ("bookingId", "orderIndex")
		)
	`)

	await (prisma as any).$executeRawUnsafe(`
		CREATE INDEX IF NOT EXISTS "ClientBooking_barberId_startAt_idx"
		ON "ClientBooking" ("barberId", "startAt")
	`)

	await (prisma as any).$executeRawUnsafe(`
		CREATE INDEX IF NOT EXISTS "ClientBooking_startAt_idx"
		ON "ClientBooking" ("startAt")
	`)

	await (prisma as any).$executeRawUnsafe(`
		CREATE TABLE IF NOT EXISTS "BarberSchedule" (
			"userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
			"dayOfWeek" INTEGER NOT NULL CHECK ("dayOfWeek" >= 0 AND "dayOfWeek" <= 6),
			"isWorking" BOOLEAN NOT NULL DEFAULT TRUE,
			"startHour" INTEGER NOT NULL DEFAULT 9,
			"endHour" INTEGER NOT NULL DEFAULT 20,
			PRIMARY KEY ("userId", "dayOfWeek")
		)
	`)

	await (prisma as any).$executeRawUnsafe(`
		CREATE TABLE IF NOT EXISTS "BarberDateSchedule" (
			"userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
			"date" DATE NOT NULL,
			"isWorking" BOOLEAN NOT NULL DEFAULT TRUE,
			"startHour" INTEGER NOT NULL DEFAULT 9,
			"endHour" INTEGER NOT NULL DEFAULT 20,
			PRIMARY KEY ("userId", "date")
		)
	`)
}
