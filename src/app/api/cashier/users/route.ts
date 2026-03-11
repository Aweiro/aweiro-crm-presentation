import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureBookingTables } from '@/lib/bookingDb'

export const dynamic = 'force-dynamic'

export async function GET() {
  await ensureBookingTables()

  const todayDow = new Date().getDay() // 0=Sun, 6=Sat
  const todayStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  // Fetch active users, then filter by schedule
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ['ADMIN', 'USER']
      },
      isActive: true
    },
    select: {
      id: true,
      name: true,
      login: true,
      role: true
    },
    orderBy: [
      { role: 'asc' },
      { name: 'asc' }
    ]
  })

  // Only check date-specific schedule (which is set when the shift is opened)
  const dateRows = (await (prisma as any).$queryRawUnsafe(
    `SELECT "userId", "isWorking" FROM "BarberDateSchedule" WHERE "date" = $1::date`,
    todayStr
  )) as Array<{ userId: number; isWorking: boolean }>
  const dateMap = new Map(dateRows.map(r => [r.userId, r.isWorking]))

  const workingUsers = users.filter((u: { id: number }) => {
    return dateMap.get(u.id) === true
  })

  return NextResponse.json({
    data: workingUsers.map((u: { id: number; name: string | null; login: string }) => ({
      id: u.id,
      name: u.name || u.login
    }))
  })
}
