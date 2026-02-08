import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const userId = Number(id)

  if (Number.isNaN(userId)) {
    return NextResponse.json(
      { message: 'Invalid id' },
      { status: 400 }
    )
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: true
    }
  })

  return NextResponse.json({ ok: true })
}