import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureBookingTables } from '@/lib/bookingDb'
import { getSessionUser } from '@/lib/session'

const DAY_NAMES = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота']

// GET /api/appointments/schedule?barberId=N&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Returns per-date schedule for the given range, merging date-specific overrides with day-of-week defaults
export async function GET(req: Request) {
    const session = await getSessionUser()
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await ensureBookingTables()
    const url = new URL(req.url)
    const barberId = Number(url.searchParams.get('barberId') || session.id)
    const startDateStr = url.searchParams.get('startDate')
    const endDateStr = url.searchParams.get('endDate')

    // If date range provided — return per-date schedule
    if (startDateStr && endDateStr) {
        const startDate = new Date(startDateStr + 'T00:00:00')
        const endDate = new Date(endDateStr + 'T00:00:00')

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return NextResponse.json({ message: 'Invalid date range' }, { status: 400 })
        }

        // Fetch day-of-week defaults
        const dowRows = (await (prisma as any).$queryRawUnsafe(
            `SELECT "dayOfWeek", "isWorking", "startHour", "endHour"
			 FROM "BarberSchedule"
			 WHERE "userId" = $1
			 ORDER BY "dayOfWeek" ASC`,
            barberId
        )) as Array<{ dayOfWeek: number; isWorking: boolean; startHour: number; endHour: number }>

        const dowMap = new Map(dowRows.map(r => [r.dayOfWeek, r]))

        // Fetch date-specific overrides
        const dateRows = (await (prisma as any).$queryRawUnsafe(
            `SELECT "date", "isWorking", "startHour", "endHour"
			 FROM "BarberDateSchedule"
			 WHERE "userId" = $1 AND "date" >= $2 AND "date" <= $3
			 ORDER BY "date" ASC`,
            barberId,
            startDate,
            endDate
        )) as Array<{ date: Date; isWorking: boolean; startHour: number; endHour: number }>

        const dateMap = new Map(dateRows.map(r => {
            const d = new Date(r.date)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            return [key, r]
        }))

        // Build per-date schedule
        const days: Array<{
            date: string
            dayOfWeek: number
            dayName: string
            isWorking: boolean
            startHour: number
            endHour: number
            isOverride: boolean
        }> = []

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dow = d.getDay()
            const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            const dateOverride = dateMap.get(dateKey)
            const dowDefault = dowMap.get(dow)

            if (dateOverride) {
                days.push({
                    date: dateKey,
                    dayOfWeek: dow,
                    dayName: DAY_NAMES[dow],
                    isWorking: dateOverride.isWorking,
                    startHour: dateOverride.startHour,
                    endHour: dateOverride.endHour,
                    isOverride: true
                })
            } else if (dowDefault) {
                days.push({
                    date: dateKey,
                    dayOfWeek: dow,
                    dayName: DAY_NAMES[dow],
                    isWorking: false, // Default to NOT working for future dates even if template exists
                    startHour: dowDefault.startHour,
                    endHour: dowDefault.endHour,
                    isOverride: false
                })
            } else {
                // Default: Mon-Fri 9-20
                days.push({
                    date: dateKey,
                    dayOfWeek: dow,
                    dayName: DAY_NAMES[dow],
                    isWorking: false,
                    startHour: 9,
                    endHour: 20,
                    isOverride: false
                })
            }
        }

        return NextResponse.json({ data: days })
    }

    // Legacy: return 7-day day-of-week schedule
    const rows = (await (prisma as any).$queryRawUnsafe(
        `SELECT "dayOfWeek", "isWorking", "startHour", "endHour"
		 FROM "BarberSchedule"
		 WHERE "userId" = $1
		 ORDER BY "dayOfWeek" ASC`,
        barberId
    )) as Array<{ dayOfWeek: number; isWorking: boolean; startHour: number; endHour: number }>

    const schedule = Array.from({ length: 7 }, (_, i) => {
        const existing = rows.find(r => r.dayOfWeek === i)
        return {
            dayOfWeek: i,
            dayName: DAY_NAMES[i],
            isWorking: existing ? existing.isWorking : false,
            startHour: existing ? existing.startHour : 9,
            endHour: existing ? existing.endHour : 20
        }
    })

    return NextResponse.json({ data: schedule })
}

// POST /api/appointments/schedule — save per-date schedule entries
export async function POST(req: Request) {
    const session = await getSessionUser()
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await ensureBookingTables()
    const body = await req.json()
    const barberId = Number(body?.barberId)
    const schedule = body?.schedule

    if (!barberId || !Array.isArray(schedule)) {
        return NextResponse.json({ message: 'Invalid data' }, { status: 400 })
    }

    // Check if entries have 'date' field (per-date) or 'dayOfWeek' (legacy)
    const isPerDate = schedule.length > 0 && schedule[0].date

    if (isPerDate) {
        // Save per-date entries
        for (const entry of schedule) {
            const date = entry.date // YYYY-MM-DD
            const isWorking = Boolean(entry.isWorking)
            const startHour = Number(entry.startHour) || 9
            const endHour = Number(entry.endHour) || 20

            if (!date || typeof date !== 'string') continue

            await (prisma as any).$executeRawUnsafe(
                `INSERT INTO "BarberDateSchedule" ("userId", "date", "isWorking", "startHour", "endHour")
				 VALUES ($1, $2::date, $3, $4, $5)
				 ON CONFLICT ("userId", "date")
				 DO UPDATE SET "isWorking" = $3, "startHour" = $4, "endHour" = $5`,
                barberId, date, isWorking, startHour, endHour
            )
        }
    } else {
        // Legacy: save day-of-week entries
        for (const day of schedule) {
            const dayOfWeek = Number(day.dayOfWeek)
            const isWorking = Boolean(day.isWorking)
            const startHour = Number(day.startHour) || 9
            const endHour = Number(day.endHour) || 20

            if (dayOfWeek < 0 || dayOfWeek > 6) continue

            await (prisma as any).$executeRawUnsafe(
                `INSERT INTO "BarberSchedule" ("userId", "dayOfWeek", "isWorking", "startHour", "endHour")
				 VALUES ($1, $2, $3, $4, $5)
				 ON CONFLICT ("userId", "dayOfWeek")
				 DO UPDATE SET "isWorking" = $3, "startHour" = $4, "endHour" = $5`,
                barberId, dayOfWeek, isWorking, startHour, endHour
            )
        }
    }

    return NextResponse.json({ ok: true })
}
