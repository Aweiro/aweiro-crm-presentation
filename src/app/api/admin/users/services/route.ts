import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureBookingTables } from '@/lib/bookingDb'
import { getSessionUser } from '@/lib/session'

export async function GET() {
	const session = await getSessionUser()
	if (!session || session.role !== 'ADMIN') {
		return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
	}

	await ensureBookingTables()

	const services = (await (prisma as any).$queryRawUnsafe(
		`
		SELECT "id", "name", "price", "durationMin", "isActive"
		FROM "BarberService"
		ORDER BY "isActive" DESC, "name" ASC
		`
	)) as Array<any>

	const userServices = (await (prisma as any).$queryRawUnsafe(
		`
		SELECT
			us."userId",
			us."serviceId",
			COALESCE(us."price", s."price", 0) AS "price",
			COALESCE(us."durationMin", s."durationMin", 30) AS "durationMin"
		FROM "UserBarberService" us
		JOIN "BarberService" s ON s."id" = us."serviceId"
		ORDER BY "userId" ASC
		`
	)) as Array<{
		userId: number
		serviceId: number
		price: number
		durationMin: number
	}>

	return NextResponse.json({
		services,
		userServices
	})
}

export async function PATCH(req: Request) {
	const session = await getSessionUser()
	if (!session || session.role !== 'ADMIN') {
		return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
	}

	await ensureBookingTables()
	const body = await req.json()
	const userId = Number(body?.userId)
	const services = Array.isArray(body?.services)
		? body.services
				.map((v: any) => ({
					serviceId: Number(v?.serviceId),
					price: Number(v?.price),
					durationMin: Number(v?.durationMin)
				}))
				.filter(
					(v: { serviceId: number; price: number; durationMin: number }) =>
						Number.isFinite(v.serviceId) &&
						v.serviceId > 0 &&
						Number.isFinite(v.price) &&
						v.price >= 0 &&
						Number.isFinite(v.durationMin) &&
						v.durationMin > 0
				)
		: []
	const legacyServiceIds = Array.isArray(body?.serviceIds)
		? body.serviceIds
				.map((v: unknown) => Number(v))
				.filter((v: number) => Number.isFinite(v) && v > 0)
		: []

	if (!userId) {
		return NextResponse.json({ message: 'Invalid userId' }, { status: 400 })
	}

	await (prisma as any).$transaction(async (tx: any) => {
		await tx.$executeRawUnsafe(
			`DELETE FROM "UserBarberService" WHERE "userId" = $1`,
			userId
		)

		const normalized =
			services.length > 0
				? services
				: legacyServiceIds.map((serviceId: number) => ({
						serviceId,
						price: 0,
						durationMin: 30
					}))
		const byService = new Map<number, { price: number; durationMin: number }>()
		for (const item of normalized) {
			if (!byService.has(item.serviceId)) {
				byService.set(item.serviceId, {
					price: Math.max(0, Math.round(item.price)),
					durationMin: Math.max(5, Math.round(item.durationMin))
				})
			}
		}

		for (const [serviceId, value] of byService.entries()) {
			await tx.$executeRawUnsafe(
				`
				INSERT INTO "UserBarberService" ("userId","serviceId","price","durationMin","createdAt")
				VALUES ($1,$2,$3,$4,NOW())
				ON CONFLICT ("userId","serviceId")
				DO UPDATE SET
					"price" = EXCLUDED."price",
					"durationMin" = EXCLUDED."durationMin"
				`,
				userId,
				serviceId,
				value.price,
				value.durationMin
			)
		}
	})

	return NextResponse.json({ ok: true })
}
