import { NextResponse } from 'next/server'
import { getActiveShift } from '@/lib/shiftStore'
import { getShiftTransactions } from '@/lib/transactionsStore'

export async function GET() {
  const shift = await getActiveShift()

  if (!shift) {
    return NextResponse.json({ data: [] })
  }

  const transactions = await getShiftTransactions(shift.id)

  return NextResponse.json({ data: transactions })
}