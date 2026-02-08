import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

  return NextResponse.json({
    data: users.map((u) => ({
      id: u.id,
      name: u.name || u.login
    }))
  })
}
