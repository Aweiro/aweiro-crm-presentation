import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params // 🔥 ВАЖЛИВО
  const expenseId = Number(id)

  if (Number.isNaN(expenseId)) {
    return NextResponse.json(
      { message: 'Invalid expense id' },
      { status: 400 }
    )
  }

  await prisma.expense.delete({
    where: { id: expenseId }
  })

  return NextResponse.json({ ok: true })
}