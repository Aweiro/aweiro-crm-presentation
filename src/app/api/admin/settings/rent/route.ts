import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const RENT_KEY = 'monthlyRentAmount'

export async function GET() {
	try {
		let row: { value: string } | null = null

		const appSetting = (prisma as any).appSetting
		if (appSetting?.findUnique) {
			row = await appSetting.findUnique({
				where: { key: RENT_KEY }
			})
		} else {
			const rows = (await (prisma as any).$queryRawUnsafe(
				'SELECT "value" FROM "AppSetting" WHERE "key" = $1 LIMIT 1',
				RENT_KEY
			)) as Array<{ value: string }>
			row = rows[0] ?? null
		}

		return NextResponse.json({
			rentAmount: Number(row?.value || 0) || 0
		})
	} catch (error) {
		console.error('GET /api/admin/settings/rent error', error)
		return NextResponse.json({ rentAmount: 0 })
	}
}

export async function PATCH(req: Request) {
	try {
		const body = await req.json()
		const rentAmount = Number(body.rentAmount)

		if (Number.isNaN(rentAmount) || rentAmount < 0) {
			return NextResponse.json(
				{ message: 'Invalid rent amount' },
				{ status: 400 }
			)
		}

		const appSetting = (prisma as any).appSetting
		const rounded = Math.round(rentAmount)

		if (appSetting?.upsert) {
			await appSetting.upsert({
				where: { key: RENT_KEY },
				create: { key: RENT_KEY, value: String(rounded) },
				update: { value: String(rounded) }
			})
		} else {
			await (prisma as any).$executeRawUnsafe(`
				CREATE TABLE IF NOT EXISTS "AppSetting" (
					"key" TEXT PRIMARY KEY,
					"value" TEXT NOT NULL,
					"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
					"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
				)
			`)
			await (prisma as any).$executeRawUnsafe(
				`INSERT INTO "AppSetting" ("key", "value", "createdAt", "updatedAt")
				 VALUES ($1, $2, NOW(), NOW())
				 ON CONFLICT ("key")
				 DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()`,
				RENT_KEY,
				String(rounded)
			)
		}

		return NextResponse.json({ ok: true })
	} catch (error) {
		const message = String((error as any)?.message || '')
		console.error('PATCH /api/admin/settings/rent error', error)
		return NextResponse.json(
			{ message: message || 'Internal error' },
			{ status: 500 }
		)
	}
}
