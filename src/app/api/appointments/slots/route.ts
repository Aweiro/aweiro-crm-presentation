import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureBookingTables } from '@/lib/bookingDb'

const DEFAULT_WORK_START = 9
const DEFAULT_WORK_END = 20
const SLOT_STEP_MIN = 30

function toHm(date: Date) {
	return date.toLocaleTimeString('uk-UA', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	})
}

function parseDay(dateString: string) {
	const [year, month, day] = dateString.split('-').map(Number)
	if (!year || !month || !day) return null
	return { year, month, day }
}

export async function GET(req: Request) {
	await ensureBookingTables()
	const url = new URL(req.url)
	const barberId = Number(url.searchParams.get('barberId') || '')
	const date = String(url.searchParams.get('date') || '')
	const serviceIds = (url.searchParams.get('serviceIds') || '')
		.split(',')
		.map((v) => Number(v))
		.filter((v) => Number.isFinite(v) && v > 0)

	if (!barberId || !date || serviceIds.length === 0) {
		return NextResponse.json({ data: [] })
	}

	const ids = Array.from(new Set(serviceIds))
	const services = (await (prisma as any).$queryRawUnsafe(
		`
		SELECT
			s."id",
			COALESCE(us."durationMin", s."durationMin") AS "durationMin",
			COALESCE(us."price", s."price") AS "price"
		FROM "BarberService" s
		JOIN "UserBarberService" us
			ON us."serviceId" = s."id"
			AND us."userId" = $1
		WHERE s."id" = ANY($2::int[]) AND s."isActive" = TRUE
		`,
		barberId,
		ids
	)) as Array<{ id: number; durationMin: number; price: number }>

	if (services.length !== ids.length) {
		return NextResponse.json({ message: 'Послуги не знайдено' }, { status: 400 })
	}

	const day = parseDay(date)
	if (!day) {
		return NextResponse.json({ message: 'Invalid date' }, { status: 400 })
	}

	// Fetch barber's schedule — check date-specific first, then day-of-week default
	const dateStr = `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
	const dateRows = (await (prisma as any).$queryRawUnsafe(
		`SELECT "isWorking", "startHour", "endHour" FROM "BarberDateSchedule" WHERE "userId" = $1 AND "date" = $2::date LIMIT 1`,
		barberId,
		dateStr
	)) as Array<{ isWorking: boolean; startHour: number; endHour: number }>

	let workStart = DEFAULT_WORK_START
	let workEnd = DEFAULT_WORK_END

	if (dateRows.length > 0) {
		// Date-specific schedule found
		if (!dateRows[0].isWorking) {
			return NextResponse.json({ data: [], summary: { totalDuration: 0, totalPrice: 0 } })
		}
		workStart = dateRows[0].startHour
		workEnd = dateRows[0].endHour
	} else {
		// Fall back to day-of-week schedule
		const dateDayOfWeek = new Date(day.year, day.month - 1, day.day).getDay()
		const scheduleRows = (await (prisma as any).$queryRawUnsafe(
			`SELECT "isWorking", "startHour", "endHour" FROM "BarberSchedule" WHERE "userId" = $1 AND "dayOfWeek" = $2 LIMIT 1`,
			barberId,
			dateDayOfWeek
		)) as Array<{ isWorking: boolean; startHour: number; endHour: number }>

		if (scheduleRows.length > 0) {
			if (!scheduleRows[0].isWorking) {
				return NextResponse.json({ data: [], summary: { totalDuration: 0, totalPrice: 0 } })
			}
			workStart = scheduleRows[0].startHour
			workEnd = scheduleRows[0].endHour
		} else {
			// No day-of-week schedule and no date-specific schedule => barber is OFF
			return NextResponse.json({ data: [], summary: { totalDuration: 0, totalPrice: 0 } })
		}
	}

	const dayStart = new Date(day.year, day.month - 1, day.day, workStart, 0, 0, 0)
	const dayEnd = new Date(day.year, day.month - 1, day.day, workEnd, 0, 0, 0)
	const totalDuration = services.reduce((sum, s) => sum + Number(s.durationMin || 0), 0)

	if (totalDuration <= 0) {
		return NextResponse.json({ data: [] })
	}

	const bookings = (await (prisma as any).$queryRawUnsafe(
		`
		SELECT "startAt", "endAt"
		FROM "ClientBooking"
		WHERE "barberId" = $1
			AND "status" = 'BOOKED'
			AND "startAt" < $2
			AND "endAt" > $3
		ORDER BY "startAt" ASC
		`,
		barberId,
		dayEnd,
		dayStart
	)) as Array<{ startAt: Date; endAt: Date }>

	const now = new Date()
	const slots: Array<{ time: string; startAt: string; endAt: string }> = []

	const candidates = new Set<number>()

	// Base grid each 30 minutes.
	for (
		let slotStart = new Date(dayStart);
		slotStart.getTime() + totalDuration * 60000 <= dayEnd.getTime();
		slotStart = new Date(slotStart.getTime() + SLOT_STEP_MIN * 60000)
	) {
		candidates.add(slotStart.getTime())
	}

	// Add exact ends of existing bookings (e.g. 09:05), so short services don't block 25 mins.
	for (const booking of bookings) {
		const endAt = new Date(booking.endAt).getTime()
		if (
			endAt >= dayStart.getTime() &&
			endAt + totalDuration * 60000 <= dayEnd.getTime()
		) {
			candidates.add(endAt)
		}
	}

	const sortedCandidates = Array.from(candidates).sort((a, b) => a - b)
	for (const candidate of sortedCandidates) {
		const slotStart = new Date(candidate)
		const slotEnd = new Date(slotStart.getTime() + totalDuration * 60000)
		const overlap = bookings.some(
			(b) =>
				slotStart.getTime() < new Date(b.endAt).getTime() &&
				slotEnd.getTime() > new Date(b.startAt).getTime()
		)
		if (overlap) continue
		if (slotStart.getTime() <= now.getTime()) continue

		slots.push({
			time: toHm(slotStart),
			startAt: slotStart.toISOString(),
			endAt: slotEnd.toISOString()
		})
	}

	return NextResponse.json({
		data: slots,
		summary: {
			totalDuration,
			totalPrice: services.reduce((sum, s) => sum + Number(s.price || 0), 0)
		}
	})
}
