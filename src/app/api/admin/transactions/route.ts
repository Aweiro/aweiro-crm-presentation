import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
	try {
		const transactions = await prisma.transaction.findMany({
			include: { user: true },
			orderBy: { createdAt: 'desc' }
		})
		return NextResponse.json({ data: transactions })
	} catch (e) {
		console.error('❌ admin/transactions error', e)
		return NextResponse.json({ message: 'Internal error' }, { status: 500 })
	}
}
