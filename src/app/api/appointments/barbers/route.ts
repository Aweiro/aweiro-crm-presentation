import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureBookingTables } from '@/lib/bookingDb'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
	await ensureBookingTables()
	const url = new URL(req.url)
	const rawIds = (url.searchParams.get('serviceIds') || '')
		.split(',')
		.map((v) => Number(v))
		.filter((v) => Number.isFinite(v) && v > 0)

	const dateStr = url.searchParams.get('date')
	const includeOff = url.searchParams.get('includeOff') === 'true'

	function ymd(d: Date) {
		const y = d.getFullYear()
		const m = String(d.getMonth() + 1).padStart(2, '0')
		const dd = String(d.getDate()).padStart(2, '0')
		return `${y}-${m}-${dd}`
	}

	function parseDay(dateString: string) {
		const [year, month, day] = dateString.split('-').map(Number)
		if (!year || !month || !day) return null
		return { year, month, day }
	}

	let baseUsers = await prisma.user.findMany({
		where: { role: { in: ['ADMIN', 'USER'] } }, // Removed isActive: true here to handle history
		select: { id: true, name: true, login: true, role: true, isActive: true },
		orderBy: { name: 'asc' }
	})

	if (rawIds.length > 0) {
		const ids = Array.from(new Set(rawIds))
		const filtered = (await (prisma as any).$queryRawUnsafe(
			`
			SELECT u."id"
			FROM "UserBarberService" us
			JOIN "User" u ON u."id" = us."userId"
			WHERE u."isActive" = TRUE
				AND us."serviceId" = ANY($1::int[])
			GROUP BY u."id"
			HAVING COUNT(DISTINCT us."serviceId") = $2
			`,
			ids,
			ids.length
		)) as Array<{ id: number }>
		const allowedIds = new Set(filtered.map(f => f.id))
		baseUsers = baseUsers.filter(u => allowedIds.has(u.id))
	}

	if (dateStr) {
		const dayObj = parseDay(dateStr)
		if (dayObj && !includeOff) {
			const dayStart = new Date(dayObj.year, dayObj.month - 1, dayObj.day, 0, 0, 0, 0)
			const dayEnd = new Date(dayObj.year, dayObj.month - 1, dayObj.day + 1, 0, 0, 0, 0)
			const todayStr = ymd(new Date())
			const isPast = dateStr < todayStr

			// For past dates, find anyone who has at least one booking
			let activeInPastIds = new Set<number>()
			if (isPast) {
				const pastBookingRows = (await (prisma as any).$queryRawUnsafe(
					`SELECT DISTINCT "barberId" FROM "ClientBooking" 
					 WHERE "startAt" >= $1 AND "startAt" < $2
					 AND "status" != 'CANCELLED'`,
					dayStart,
					dayEnd
				)) as Array<{ barberId: number }>

				activeInPastIds = new Set(pastBookingRows.map((r: { barberId: number }) => r.barberId))
			}

			// Also fetch weekly templates to handle historical fallback correctly
			const dow = dayStart.getDay() // 0=Sun, 6=Sat
			const dowRows = (await (prisma as any).$queryRawUnsafe(
				`SELECT "userId", "isWorking" FROM "BarberSchedule" WHERE "dayOfWeek" = $1`,
				dow
			)) as Array<{ userId: number; isWorking: boolean }>
			const dowMap = new Map(dowRows.map(r => [r.userId, r.isWorking]))

			const dateRows = (await (prisma as any).$queryRawUnsafe(
				`SELECT "userId", "isWorking" FROM "BarberDateSchedule" WHERE "date" = $1::date`,
				dateStr
			)) as Array<{ userId: number; isWorking: boolean }>
			const dateMap = new Map(dateRows.map(r => [r.userId, r.isWorking]))

			baseUsers = baseUsers.filter(u => {
				// Past: Strictly show ONLY if they have at least one non-cancelled booking
				if (isPast) {
					return activeInPastIds.has(u.id)
				}

				// Today/Future: Only show if they are active AND have an explicit working override
				if (!u.isActive) return false
				return dateMap.get(u.id) === true
			})
		}
	} else {
		// No date provided (generic list): only show active
		baseUsers = baseUsers.filter(u => u.isActive)
	}

	return NextResponse.json({
		data: baseUsers.map((u) => ({
			id: u.id,
			name: u.name || u.login,
			role: u.role
		}))
	})
}
