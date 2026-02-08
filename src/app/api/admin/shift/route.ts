import { NextResponse } from 'next/server'
import { getActiveShift, openShift, closeShift, setCashStart } from '@/lib/shiftStore'

export const runtime = 'nodejs'

export async function GET() {
	console.log('➡️ GET /api/admin/shift called')

	try {
		const shift = await getActiveShift()
		console.log('✅ shift:', shift)

		return NextResponse.json({ shift })
	} catch (error) {
		console.error('❌ GET /api/admin/shift error:', error)

		return NextResponse.json(
			{ message: 'Failed to load shift', error: String(error) },
			{ status: 500 }
		)
	}
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('➡️ SHIFT ACTION:', body)

    if (body.action === 'open') {
      const shift = await openShift()
      return NextResponse.json({ shift })
    }

    if (body.action === 'cashStart') {
      const shift = await setCashStart(Number(body.amount))
      return NextResponse.json({ shift })
    }

    if (body.action === 'close') {
      const cashEnd = await closeShift()
      return NextResponse.json({ cashEnd })
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('❌ SHIFT ERROR:', error.message)
    return NextResponse.json(
      { message: error.message ?? 'Internal error' },
      { status: 500 }
    )
  }
}
