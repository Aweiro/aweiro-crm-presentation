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

export async function PATCH(
	req: Request,
	ctx: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await ctx.params
		const userId = Number(id)

		if (Number.isNaN(userId)) {
			return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
		}

		const body = await req.json()
		const barberPercent = Number(body.barberPercent)
		const cosmeticsPercent = Number(body.cosmeticsPercent)

		if (
			Number.isNaN(barberPercent) ||
			Number.isNaN(cosmeticsPercent) ||
			barberPercent < 0 ||
			cosmeticsPercent < 0 ||
			barberPercent > 100 ||
			cosmeticsPercent > 100
		) {
			return NextResponse.json(
				{ message: 'Invalid salary percents' },
				{ status: 400 }
			)
		}

		const roundedBarberPercent = Math.round(barberPercent)
		const roundedCosmeticsPercent = Math.round(cosmeticsPercent)

		try {
			await (prisma.user as any).update({
				where: { id: userId },
				data: {
					barberPercent: roundedBarberPercent,
					cosmeticsPercent: roundedCosmeticsPercent
				}
			})
		} catch (error: any) {
			const message = String(error?.message || '')

			// Fallback for stale Prisma Client typings/runtime.
			if (
				message.includes('barberPercent') ||
				message.includes('cosmeticsPercent') ||
				message.includes('Unknown arg')
			) {
				await (prisma as any).$executeRawUnsafe(
					'UPDATE "User" SET "barberPercent" = $1, "cosmeticsPercent" = $2 WHERE "id" = $3',
					roundedBarberPercent,
					roundedCosmeticsPercent,
					userId
				)
			} else {
				throw error
			}
		}

		return NextResponse.json({ ok: true })
	} catch (error: any) {
		const message = String(error?.message || '')
		if (
			message.includes('column') &&
			(message.includes('barberPercent') || message.includes('cosmeticsPercent'))
		) {
			return NextResponse.json(
				{
					message:
						'В БД ще немає колонок для відсотків. Застосуйте Prisma міграцію і повторіть.'
				},
				{ status: 400 }
			)
		}

		console.error('PATCH /api/admin/users/[id] error', error)
		return NextResponse.json(
			{ message: 'Не вдалося зберегти налаштування зарплати' },
			{ status: 500 }
		)
	}
}
