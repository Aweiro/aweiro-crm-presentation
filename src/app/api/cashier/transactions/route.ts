import { NextResponse } from 'next/server'
import { addTransaction } from '@/lib/transactionsStore'
import { getActiveShift } from '@/lib/shiftStore'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const userId = Number(body.userId)
    const amount = Number(body.amount)

    if (!userId || !amount) {
      return NextResponse.json(
        { message: 'Invalid data' },
        { status: 400 }
      )
    }

    // 🔐 Перевірка юзера
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: 'Працівник неактивний або не існує' },
        { status: 403 }
      )
    }

    // 🔐 Активна зміна
    const shift = await getActiveShift()
    if (!shift) {
      return NextResponse.json(
        { message: 'Немає активної зміни' },
        { status: 400 }
      )
    }

    const tx = await addTransaction({
      userId,
      amount,
      paymentMethod: body.paymentMethod,
      shiftId: shift.id
    })

    return NextResponse.json(tx)

  } catch (e) {
    console.error('❌ add transaction error', e)

    return NextResponse.json(
      { message: 'Помилка створення транзакції' },
      { status: 500 }
    )
  }
}