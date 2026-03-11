import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureBookingTables } from '@/lib/bookingDb'
import { getSessionUser } from '@/lib/session'

const WORK_START_HOUR = 9
const WORK_END_HOUR = 20

function parseDay(dateString: string) {
	const [year, month, day] = dateString.split('-').map(Number)
	if (!year || !month || !day) return null
	return { year, month, day }
}

export async function GET(req: Request) {
	const session = await getSessionUser()
	if (!session) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	await ensureBookingTables()
	const url = new URL(req.url)
	const date = String(url.searchParams.get('date') || '')
	const barberIdParam = Number(url.searchParams.get('barberId') || '')
	const day = parseDay(date)

	const where: string[] = []
	const params: any[] = []

	if (day) {
		const dayStart = new Date(day.year, day.month - 1, day.day, 0, 0, 0, 0)
		const dayEnd = new Date(day.year, day.month - 1, day.day + 1, 0, 0, 0, 0)
		params.push(dayStart, dayEnd)
		where.push(`b."startAt" >= $${params.length - 1} AND b."startAt" < $${params.length}`)
	}

	if (session.role === 'ADMIN') {
		if (barberIdParam > 0) {
			params.push(barberIdParam)
			where.push(`b."barberId" = $${params.length}`)
		}
	} else {
		params.push(session.id)
		where.push(`b."barberId" = $${params.length}`)
	}

	const query = `
		SELECT
			b."id",
			b."clientName",
			b."clientPhone",
			b."comment",
			b."barberId",
			b."startAt",
			b."endAt",
			b."status",
			b."createdAt",
			u."name" AS "barberName",
			cbs."serviceId",
			cbs."price",
			cbs."durationMin",
			cbs."orderIndex",
			s."name" AS "serviceName"
		FROM "ClientBooking" b
		LEFT JOIN "User" u ON u."id" = b."barberId"
		LEFT JOIN "ClientBookingService" cbs ON cbs."bookingId" = b."id"
		LEFT JOIN "BarberService" s ON s."id" = cbs."serviceId"
		WHERE ${where.length > 0 ? where.join(' AND ') : 'TRUE'}
		ORDER BY b."startAt" ASC, b."id" ASC, cbs."orderIndex" ASC
	`

	const rows = (await (prisma as any).$queryRawUnsafe(
		query,
		...params
	)) as Array<any>

	const map = new Map<number, any>()
	for (const row of rows) {
		const existing = map.get(row.id) ?? {
			id: row.id,
			clientName: row.clientName,
			clientPhone: row.clientPhone,
			comment: row.comment,
			barberId: row.barberId,
			barberName: row.barberName || `Барбер #${row.barberId}`,
			startAt: row.startAt,
			endAt: row.endAt,
			status: row.status || 'BOOKED',
			createdAt: row.createdAt,
			services: [] as Array<{
				serviceId: number
				name: string
				price: number
				durationMin: number
				orderIndex: number
			}>,
			totalPrice: 0,
			totalDuration: 0
		}

		if (row.serviceId) {
			existing.services.push({
				serviceId: row.serviceId,
				name: row.serviceName || `Послуга #${row.serviceId}`,
				price: row.price,
				durationMin: row.durationMin,
				orderIndex: row.orderIndex
			})
			existing.totalPrice += Number(row.price || 0)
			existing.totalDuration += Number(row.durationMin || 0)
		}

		map.set(row.id, existing)
	}

	// Fetch schedules for the day
	const schedules: Record<number, { isWorking: boolean; startHour: number; endHour: number }> = {}
	if (day) {
		const dateStr = `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
		const dateDayOfWeek = new Date(day.year, day.month - 1, day.day).getDay()
		const defaultWorking = false

		// date specific overrides
		const dateRows = (await (prisma as any).$queryRawUnsafe(
			`SELECT "userId", "isWorking", "startHour", "endHour" FROM "BarberDateSchedule" WHERE "date" = $1::date`,
			dateStr
		)) as Array<{ userId: number; isWorking: boolean; startHour: number; endHour: number }>

		// day of week defaults
		const dowRows = (await (prisma as any).$queryRawUnsafe(
			`SELECT "userId", "isWorking", "startHour", "endHour" FROM "BarberSchedule" WHERE "dayOfWeek" = $1`,
			dateDayOfWeek
		)) as Array<{ userId: number; isWorking: boolean; startHour: number; endHour: number }>

		const activeBarberIds = Array.from(new Set(rows.map(r => r.barberId)))
		if (barberIdParam > 0) activeBarberIds.push(barberIdParam)
		else if (session.role !== 'ADMIN') activeBarberIds.push(session.id)

		// For each active barber (or all if ADMIN viewing all), determine schedule
		// Since we don't have the list of ALL barbers here, the frontend can only expect schedules for barbers in activeBarberIds
		// Actually, to be safe, let's just build it for all users that have a schedule.
		const allUserIds = new Set([...dateRows.map(r => r.userId), ...dowRows.map(r => r.userId)])

		// Detect if date is in the past
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const queryDate = new Date(day.year, day.month - 1, day.day)
		const isPastDate = queryDate < today

		for (const uid of Array.from(allUserIds)) {
			const dateOverride = dateRows.find(r => r.userId === uid)
			if (dateOverride) {
				schedules[uid] = { isWorking: dateOverride.isWorking, startHour: dateOverride.startHour, endHour: dateOverride.endHour }
				continue
			}
			const dowOverride = dowRows.find(r => r.userId === uid)
			if (dowOverride) {
				// If past, show actual template. If future, force false.
				schedules[uid] = { isWorking: isPastDate ? dowOverride.isWorking : false, startHour: dowOverride.startHour, endHour: dowOverride.endHour }
				continue
			}
			schedules[uid] = { isWorking: isPastDate ? defaultWorking : false, startHour: WORK_START_HOUR, endHour: WORK_END_HOUR }
		}
	}

	return NextResponse.json({
		data: Array.from(map.values()),
		schedules
	})
}

export async function POST(req: Request) {
	const session = await getSessionUser()

	await ensureBookingTables()
	const body = await req.json()

	const clientName = String(body?.clientName || '').trim()
	const clientPhone = String(body?.clientPhone || '').trim()
	const comment = String(body?.comment || '').trim()
	const barberId = Number(body?.barberId)
	const date = String(body?.date || '')
	const time = String(body?.time || '')
	const serviceIds = Array.isArray(body?.serviceIds)
		? body.serviceIds
			.map((v: unknown) => Number(v))
			.filter((v: number) => Number.isFinite(v) && v > 0)
		: []

	if (!clientName || !barberId || !date || !time || serviceIds.length === 0) {
		return NextResponse.json({ message: 'Заповніть обовʼязкові поля' }, { status: 400 })
	}

	const uniqueServiceIds = Array.from(new Set(serviceIds))
	const services = (await (prisma as any).$queryRawUnsafe(
		`
		SELECT
			s."id",
			s."name",
			COALESCE(us."price", s."price") AS "price",
			COALESCE(us."durationMin", s."durationMin") AS "durationMin"
		FROM "BarberService" s
		JOIN "UserBarberService" us
			ON us."serviceId" = s."id"
			AND us."userId" = $1
		WHERE s."id" = ANY($2::int[]) AND s."isActive" = TRUE
		`,
		barberId,
		uniqueServiceIds
	)) as Array<{ id: number; name: string; price: number; durationMin: number }>

	if (services.length !== uniqueServiceIds.length) {
		return NextResponse.json(
			{ message: 'Обраний барбер не виконує всі вибрані послуги' },
			{ status: 400 }
		)
	}

	const day = parseDay(date)
	if (!day) {
		return NextResponse.json({ message: 'Некоректна дата' }, { status: 400 })
	}

	const [hours, minutes] = time.split(':').map(Number)
	if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
		return NextResponse.json({ message: 'Некоректний час' }, { status: 400 })
	}

	const startAt = new Date(day.year, day.month - 1, day.day, hours, minutes, 0, 0)
	const totalDuration = services.reduce((sum, s) => sum + Number(s.durationMin || 0), 0)
	const endAt = new Date(startAt.getTime() + totalDuration * 60000)

	const dayStart = new Date(day.year, day.month - 1, day.day, WORK_START_HOUR, 0, 0, 0)
	const dayEnd = new Date(day.year, day.month - 1, day.day, WORK_END_HOUR, 0, 0, 0)
	if (startAt < dayStart || endAt > dayEnd) {
		return NextResponse.json(
			{ message: `Запис можливий лише в межах ${WORK_START_HOUR}:00-${WORK_END_HOUR}:00` },
			{ status: 400 }
		)
	}

	const overlap = (await (prisma as any).$queryRawUnsafe(
		`
		SELECT "id"
		FROM "ClientBooking"
		WHERE "barberId" = $1
			AND "status" = 'BOOKED'
			AND "startAt" < $2
			AND "endAt" > $3
		LIMIT 1
		`,
		barberId,
		endAt,
		startAt
	)) as Array<{ id: number }>

	if (overlap[0]) {
		return NextResponse.json(
			{ message: 'Цей час уже зайнятий. Оновіть список слотів.' },
			{ status: 409 }
		)
	}

	const orderedServices = serviceIds
		.map((serviceId: number) => services.find((s: { id: number }) => s.id === serviceId))
		.filter(
			(s: unknown): s is { id: number; name: string; price: number; durationMin: number } =>
				Boolean(s)
		)

	const created = await (prisma as any).$transaction(async (tx: any) => {
		const bookingRows = (await tx.$queryRawUnsafe(
			`
			INSERT INTO "ClientBooking"
				("clientName","clientPhone","comment","barberId","startAt","endAt","status","createdById","createdAt")
			VALUES
				($1,$2,$3,$4,$5,$6,'BOOKED',$7,NOW())
			RETURNING "id"
			`,
			clientName,
			clientPhone || null,
			comment || null,
			barberId,
			startAt,
			endAt,
			session?.id ?? null
		)) as Array<{ id: number }>

		const bookingId = bookingRows[0].id
		for (let i = 0; i < orderedServices.length; i += 1) {
			const service = orderedServices[i]
			await tx.$executeRawUnsafe(
				`
				INSERT INTO "ClientBookingService"
					("bookingId","serviceId","price","durationMin","orderIndex")
				VALUES ($1,$2,$3,$4,$5)
				`,
				bookingId,
				service.id,
				Math.round(service.price),
				Math.round(service.durationMin),
				i
			)
		}

		return {
			id: bookingId
		}
	})

	return NextResponse.json({
		ok: true,
		bookingId: created.id
	})
}
