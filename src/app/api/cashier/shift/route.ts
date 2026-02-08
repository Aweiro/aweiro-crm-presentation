import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const shift = await prisma.shift.findFirst({
    where: { isOpen: true },
    select: {
      isOpen: true
    }
  })

  return NextResponse.json({ shift })
}