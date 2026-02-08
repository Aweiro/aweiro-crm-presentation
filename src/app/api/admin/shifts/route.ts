import { NextResponse } from 'next/server'
import { getArchivedShifts } from '@/lib/shiftStore'

export const runtime = 'nodejs'

export async function GET() {
  const shifts = await getArchivedShifts()
  return NextResponse.json({ data: shifts })
}