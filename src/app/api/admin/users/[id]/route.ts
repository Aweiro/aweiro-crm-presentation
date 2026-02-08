import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
	_req: Request,
	ctx: { params: Promise<{ id: string }> }
) {
	const { id } = await ctx.params

	const userId = Number(id)

	if (Number.isNaN(userId)) {
		return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
	}

	const user = await prisma.user.findUnique({
		where: { id: userId }
	})

	if (!user) {
		return NextResponse.json({ message: 'User not found' }, { status: 404 })
	}

	await prisma.user.update({
		where: { id: userId },
		data: {
			isActive: false
		}
	})

	return NextResponse.json({ ok: true })
}
