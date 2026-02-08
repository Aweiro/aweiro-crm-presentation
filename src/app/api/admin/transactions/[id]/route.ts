import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: Request,
{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params
  const transactionId = Number(id)
	

  if (Number.isNaN(transactionId)) {
    return NextResponse.json(
      { message: 'Invalid transaction id' },
      { status: 400 }
    )
  }

  await prisma.transaction.delete({
    where: { id: transactionId }
  })

  return NextResponse.json({ ok: true })
}