import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureBookingTables } from '@/lib/bookingDb'
import { getSessionUser } from '@/lib/session'

export async function PATCH(
	req: Request,
	ctx: { params: Promise<{ id: string }> }
) {
	const session = await getSessionUser()
	if (!session || session.role !== 'ADMIN') {
		return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
	}

	await ensureBookingTables()

	const { id } = await ctx.params
	const serviceId = Number(id)
	if (!Number.isFinite(serviceId)) {
		return NextResponse.json({ message: 'Invalid service id' }, { status: 400 })
	}

	const body = await req.json()
	const name = String(body?.name || '').trim()
	const price = Number(body?.price)
	const durationMin = Number(body?.durationMin)
	const isActive = typeof body?.isActive === 'boolean' ? body.isActive : true

	if (!name || Number.isNaN(price) || Number.isNaN(durationMin)) {
		return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
	}

	if (price < 0 || durationMin <= 0) {
		return NextResponse.json(
			{ message: 'Ціна має бути >= 0, час > 0' },
			{ status: 400 }
		)
	}

	await (prisma as any).$executeRawUnsafe(
		`
		UPDATE "BarberService"
		SET "name" = $1,
				"price" = $2,
				"durationMin" = $3,
				"isActive" = $4,
				"updatedAt" = NOW()
		WHERE "id" = $5
		`,
		name,
		Math.round(price),
		Math.round(durationMin),
		isActive,
		serviceId
	)

	return NextResponse.json({ ok: true })
}

export async function DELETE(
	_req: Request,
	ctx: { params: Promise<{ id: string }> }
) {
	const session = await getSessionUser()
	if (!session || session.role !== 'ADMIN') {
		return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
	}

	await ensureBookingTables()
	const { id } = await ctx.params
	const serviceId = Number(id)
	if (!Number.isFinite(serviceId)) {
		return NextResponse.json({ message: 'Invalid service id' }, { status: 400 })
	}

	await (prisma as any).$executeRawUnsafe(
		`
		UPDATE "BarberService"
		SET "isActive" = FALSE, "updatedAt" = NOW()
		WHERE "id" = $1
		`,
		serviceId
	)

	return NextResponse.json({ ok: true })
}

