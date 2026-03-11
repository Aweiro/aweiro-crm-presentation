import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureBookingTables } from '@/lib/bookingDb'
import { getSessionUser } from '@/lib/session'

export async function GET(req: Request) {
	await ensureBookingTables()

	const { searchParams } = new URL(req.url)
	const barberIdParam = searchParams.get('barberId')

	let services;

	if (barberIdParam) {
		const barberId = parseInt(barberIdParam, 10)
		services = (await (prisma as any).$queryRawUnsafe(
			`
			SELECT bs."id", bs."name", bs."price", bs."durationMin", bs."isActive"
			FROM "BarberService" bs
			JOIN "UserBarberService" ubs ON bs."id" = ubs."serviceId"
			WHERE ubs."userId" = $1 AND bs."isActive" = TRUE
			ORDER BY bs."name" ASC
			`,
			barberId
		)) as Array<{
			id: number
			name: string
			price: number
			durationMin: number
			isActive: boolean
		}>
	} else {
		services = (await (prisma as any).$queryRawUnsafe(
			`
			SELECT "id", "name", "price", "durationMin", "isActive"
			FROM "BarberService"
			WHERE "isActive" = TRUE
			ORDER BY "name" ASC
			`
		)) as Array<{
			id: number
			name: string
			price: number
			durationMin: number
			isActive: boolean
		}>
	}

	return NextResponse.json({ data: services })
}

export async function POST(req: Request) {
	const session = await getSessionUser()
	if (!session || session.role !== 'ADMIN') {
		return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
	}

	await ensureBookingTables()

	const body = await req.json()
	const name = String(body?.name || '').trim()
	const price = Number(body?.price)
	const durationMin = Number(body?.durationMin)

	if (!name || Number.isNaN(price) || Number.isNaN(durationMin)) {
		return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
	}

	if (price < 0 || durationMin <= 0) {
		return NextResponse.json(
			{ message: 'Ціна має бути >= 0, час > 0' },
			{ status: 400 }
		)
	}

	const rows = (await (prisma as any).$queryRawUnsafe(
		`
		INSERT INTO "BarberService" ("name", "price", "durationMin", "isActive", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, TRUE, NOW(), NOW())
		RETURNING "id", "name", "price", "durationMin", "isActive"
		`,
		name,
		Math.round(price),
		Math.round(durationMin)
	)) as Array<any>

	return NextResponse.json({ data: rows[0] ?? null })
}

export async function PATCH(req: Request) {
	const session = await getSessionUser()
	if (!session || session.role !== 'ADMIN') {
		return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
	}

	await ensureBookingTables()

	const { searchParams } = new URL(req.url)
	const id = Number(searchParams.get('id'))

	if (!id || isNaN(id)) {
		return NextResponse.json({ message: 'Missing or invalid id' }, { status: 400 })
	}

	const body = await req.json().catch(() => ({}))
	const name = body?.name !== undefined ? String(body.name).trim() : undefined
	const price = body?.price !== undefined ? Number(body.price) : undefined
	const durationMin = body?.durationMin !== undefined ? Number(body.durationMin) : undefined

	if (name === undefined && price === undefined && durationMin === undefined) {
		return NextResponse.json({ message: 'Nothing to update' }, { status: 400 })
	}

	if (name !== undefined && !name) {
		return NextResponse.json({ message: 'Name cannot be empty' }, { status: 400 })
	}

	let queryParams: any[] = []
	let setClauses: string[] = []
	let paramIndex = 1

	if (name !== undefined) {
		setClauses.push(`"name" = $${paramIndex++}`)
		queryParams.push(name)
	}
	if (price !== undefined && !isNaN(price)) {
		setClauses.push(`"price" = $${paramIndex++}`)
		queryParams.push(price)
	}
	if (durationMin !== undefined && !isNaN(durationMin)) {
		setClauses.push(`"durationMin" = $${paramIndex++}`)
		queryParams.push(durationMin)
	}

	setClauses.push(`"updatedAt" = NOW()`)
	queryParams.push(id)

	await (prisma as any).$queryRawUnsafe(
		`
		UPDATE "BarberService"
		SET ${setClauses.join(', ')}
		WHERE "id" = $${paramIndex}
		`,
		...queryParams
	)

	return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
	const session = await getSessionUser()
	if (!session || session.role !== 'ADMIN') {
		return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
	}

	await ensureBookingTables()

	const { searchParams } = new URL(req.url)
	const id = Number(searchParams.get('id'))

	if (!id || isNaN(id)) {
		return NextResponse.json({ message: 'Missing or invalid id' }, { status: 400 })
	}

	// Soft delete
	await (prisma as any).$queryRawUnsafe(
		`
		UPDATE "BarberService"
		SET "isActive" = FALSE, "updatedAt" = NOW()
		WHERE "id" = $1
		`,
		id
	)

	return NextResponse.json({ success: true })
}
