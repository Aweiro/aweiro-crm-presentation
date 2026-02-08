import { NextResponse } from 'next/server'
import { addTransaction } from '@/lib/transactionsStore'
import { getActiveShift } from '@/lib/shiftStore'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const shift = await getActiveShift()
    if (!shift) {
      return NextResponse.json(
        { message: 'Немає активної зміни' },
        { status: 400 }
      )
    }

    const tx = await addTransaction({
      userId: Number(body.userId),
      amount: Number(body.amount),
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