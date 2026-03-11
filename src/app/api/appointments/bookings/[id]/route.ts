import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureBookingTables } from '@/lib/bookingDb'
import { getSessionUser } from '@/lib/session'
import { addTransaction } from '@/lib/transactionsStore'
import { getActiveShift } from '@/lib/shiftStore'
import { ensureInventoryTables } from '@/lib/inventoryDb'
import { ensureReceiptTables } from '@/lib/receiptDb'

export async function DELETE(
	_req: Request,
	ctx: { params: Promise<{ id: string }> }
) {
	const session = await getSessionUser()
	if (!session) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	await ensureBookingTables()
	const { id } = await ctx.params
	const bookingId = Number(id)
	if (!Number.isFinite(bookingId)) {
		return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
	}

	const rows = (await (prisma as any).$queryRawUnsafe(
		`
		SELECT "id", "barberId"
		FROM "ClientBooking"
		WHERE "id" = $1
		LIMIT 1
		`,
		bookingId
	)) as Array<{ id: number; barberId: number }>

	if (!rows[0]) {
		return NextResponse.json({ message: 'Запис не знайдено' }, { status: 404 })
	}

	if (session.role !== 'ADMIN' && rows[0].barberId !== session.id) {
		return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
	}

	await (prisma as any).$executeRawUnsafe(
		`UPDATE "ClientBooking" SET "status" = 'CANCELLED' WHERE "id" = $1`,
		bookingId
	)

	return NextResponse.json({ ok: true })
}

export async function PATCH(
	req: Request,
	ctx: { params: Promise<{ id: string }> }
) {
	const session = await getSessionUser()
	if (!session) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}

	await ensureBookingTables()
	const { id } = await ctx.params
	const bookingId = Number(id)
	if (!Number.isFinite(bookingId)) {
		return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
	}

	const rows = (await (prisma as any).$queryRawUnsafe(
		`
		SELECT "id", "barberId", "startAt", "endAt"
		FROM "ClientBooking"
		WHERE "id" = $1
		LIMIT 1
		`,
		bookingId
	)) as Array<{ id: number; barberId: number; startAt: Date; endAt: Date }>

	if (!rows[0]) {
		return NextResponse.json({ message: 'Запис не знайдено' }, { status: 404 })
	}

	if (session.role !== 'ADMIN' && rows[0].barberId !== session.id) {
		return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
	}

	const body = await req.json()
	const status = body?.status as string | undefined
	const newBarberId = body?.barberId ? Number(body.barberId) : null
	const paymentMethod: 'CASH' | 'CARD' = body?.paymentMethod === 'CARD' ? 'CARD' : 'CASH'
	const discount: number = Number(body?.discount || 0)
	const serviceIds: number[] = Array.isArray(body?.serviceIds)
		? body.serviceIds.map((v: unknown) => Number(v)).filter((v: number) => Number.isFinite(v) && v > 0)
		: []
	const cosmeticsItems: Array<{ itemId: number; quantity: number }> = Array.isArray(body?.cosmeticsItems)
		? body.cosmeticsItems
			.map((item: any) => ({ itemId: Number(item?.itemId), quantity: Number(item?.quantity) }))
			.filter((item: { itemId: number; quantity: number }) => Number.isFinite(item.itemId) && item.itemId > 0 && Number.isFinite(item.quantity) && item.quantity > 0)
		: []
	const newStartAt = body?.startAt ? new Date(body.startAt) : null

	if (status && !['DONE', 'BOOKED', 'CANCELLED'].includes(status)) {
		return NextResponse.json({ message: 'Невірний статус' }, { status: 400 })
	}

	// If completing — require active shift for transactions
	let shift: { id: number } | null = null
	if (status === 'DONE') {
		shift = await getActiveShift()
		if (!shift) {
			return NextResponse.json({ message: 'Немає активної зміни. Відкрийте зміну, щоб завершити запис.' }, { status: 400 })
		}
	}

	const effectiveBarberId = newBarberId || rows[0].barberId

	// Handle cosmetics stock validation before transaction
	let cosmeticsTotal = 0
	const soldItems: Array<{ itemId: number; itemName: string; price: number; quantity: number; lineTotal: number }> = []

	if (status === 'DONE' && cosmeticsItems.length > 0) {
		await ensureInventoryTables()
		const invRows = (await (prisma as any).$queryRawUnsafe(
			`SELECT "id", "shortName", "price", "quantity", "isActive" FROM "InventoryItem" WHERE "id" = ANY($1::int[])`,
			cosmeticsItems.map(i => i.itemId)
		)) as Array<{ id: number; shortName: string; price: number; quantity: number; isActive: boolean }>

		const invMap = new Map(invRows.map(r => [r.id, r]))
		for (const item of cosmeticsItems) {
			const dbItem = invMap.get(item.itemId)
			if (!dbItem || !dbItem.isActive) {
				return NextResponse.json({ message: `Товар #${item.itemId} недоступний` }, { status: 400 })
			}
			if (dbItem.quantity < item.quantity) {
				return NextResponse.json({ message: `Недостатньо товару "${dbItem.shortName}" на складі` }, { status: 400 })
			}
			cosmeticsTotal += dbItem.price * Math.round(item.quantity)
			soldItems.push({
				itemId: dbItem.id,
				itemName: dbItem.shortName,
				price: dbItem.price,
				quantity: Math.round(item.quantity),
				lineTotal: dbItem.price * Math.round(item.quantity)
			})
		}
	}

	let barberTotal = 0
	const serviceItems: Array<{ name: string; price: number; durationMin: number }> = []

	await (prisma as any).$transaction(async (tx: any) => {
		const updates: string[] = []
		const params: any[] = []

		if (status) {
			params.push(status)
			updates.push(`"status" = $${params.length}`)
		}

		if (newBarberId) {
			params.push(newBarberId)
			updates.push(`"barberId" = $${params.length}`)
		}

		// If startAt provided — update start time and recalculate endAt
		if (newStartAt && !isNaN(newStartAt.getTime())) {
			params.push(newStartAt)
			updates.push(`"startAt" = $${params.length}`)
		}

		// If serviceIds provided, replace services and recalculate
		if (serviceIds.length > 0) {
			const uniqueServiceIds = Array.from(new Set(serviceIds))
			const services = (await tx.$queryRawUnsafe(
				`
				SELECT
					s."id",
					s."name",
					COALESCE(us."price", s."price") AS "price",
					COALESCE(us."durationMin", s."durationMin") AS "durationMin"
				FROM "BarberService" s
				JOIN "UserBarberService" us
					ON us."serviceId" = s."id"
					AND us."userId" = $1
				WHERE s."id" = ANY($2::int[]) AND s."isActive" = TRUE
				`,
				effectiveBarberId,
				uniqueServiceIds
			)) as Array<{ id: number; name: string; price: number; durationMin: number }>

			const totalDuration = services.reduce((sum, s) => sum + Number(s.durationMin || 0), 0)
			barberTotal = services.reduce((sum, s) => sum + Number(s.price || 0), 0)
			const startAt = newStartAt || new Date(rows[0].startAt)
			const newEndAt = new Date(startAt.getTime() + totalDuration * 60000)
			params.push(newEndAt)
			updates.push(`"endAt" = $${params.length}`)

			await tx.$executeRawUnsafe(
				`DELETE FROM "ClientBookingService" WHERE "bookingId" = $1`,
				bookingId
			)

			const orderedServices = serviceIds
				.map((sid: number) => services.find((s) => s.id === sid))
				.filter(Boolean) as Array<{ id: number; name: string; price: number; durationMin: number }>

			for (let i = 0; i < orderedServices.length; i++) {
				const service = orderedServices[i]
				await tx.$executeRawUnsafe(
					`INSERT INTO "ClientBookingService" ("bookingId","serviceId","price","durationMin","orderIndex") VALUES ($1,$2,$3,$4,$5)`,
					bookingId, service.id, Math.round(service.price), Math.round(service.durationMin), i
				)
			}

			// Save service details for receipt
			for (const s of orderedServices) {
				serviceItems.push({ name: s.name, price: Number(s.price), durationMin: Number(s.durationMin) })
			}
		} else if (status === 'DONE') {
			// No new serviceIds — compute total from existing services
			const existingSvcs = (await tx.$queryRawUnsafe(
				`SELECT "price", s."name" FROM "ClientBookingService" cbs LEFT JOIN "BarberService" s ON s."id" = cbs."serviceId" WHERE cbs."bookingId" = $1`,
				bookingId
			)) as Array<{ price: number; name: string | null }>
			barberTotal = existingSvcs.reduce((sum, s) => sum + Number(s.price || 0), 0)
			for (const s of existingSvcs) {
				serviceItems.push({ name: s.name || 'Послуга', price: Number(s.price), durationMin: 0 })
			}
		} else if (newStartAt && !isNaN(newStartAt.getTime())) {
			// Only startAt changed — recalculate endAt from existing duration
			const existingDuration = new Date(rows[0].endAt).getTime() - new Date(rows[0].startAt).getTime()
			const newEndAt = new Date(newStartAt.getTime() + existingDuration)
			params.push(newEndAt)
			updates.push(`"endAt" = $${params.length}`)
		}

		if (updates.length > 0) {
			params.push(bookingId)
			await tx.$executeRawUnsafe(
				`UPDATE "ClientBooking" SET ${updates.join(', ')} WHERE "id" = $${params.length}`,
				...params
			)
		}

		// Write off cosmetics stock
		if (status === 'DONE' && soldItems.length > 0) {
			for (const item of soldItems) {
				await tx.$executeRawUnsafe(
					`UPDATE "InventoryItem" SET "quantity" = "quantity" - $1, "updatedAt" = NOW() WHERE "id" = $2`,
					item.quantity, item.itemId
				)
				await tx.$executeRawUnsafe(
					`INSERT INTO "InventorySupply" ("itemId","operationType","quantity","note","createdAt") VALUES ($1,'WRITEOFF',$2,$3,NOW())`,
					item.itemId, item.quantity, `Продаж при завершенні запису #${bookingId}`
				)
			}
		}
	})

	console.log('[PATCH complete]', { status, shift: shift?.id, barberTotal, cosmeticsTotal, effectiveBarberId, paymentMethod })

	// Create transactions + receipt
	if (status === 'DONE' && shift) {
		await ensureReceiptTables()
		const barberAmount = Math.round(Number(barberTotal))
		const cosmeticsAmount = Math.round(Number(cosmeticsTotal))

		let barberTxId: number | null = null
		let cosmeticsTxId: number | null = null

		if (barberAmount > 0) {
			try {
				const tx = await addTransaction({
					userId: effectiveBarberId,
					amount: barberAmount,
					discount: discount,
					paymentMethod,
					serviceType: 'BARBER',
					shiftId: shift.id
				})
				barberTxId = Number(tx?.id) || null
			} catch (e) {
				console.error('[PATCH] BARBER transaction error:', e)
			}
		}
		if (cosmeticsAmount > 0) {
			try {
				const tx = await addTransaction({
					userId: effectiveBarberId,
					amount: cosmeticsAmount,
					discount: barberAmount === 0 ? discount : 0,
					paymentMethod,
					serviceType: 'COSMETICS',
					shiftId: shift.id
				})
				cosmeticsTxId = Number(tx?.id) || null
			} catch (e) {
				console.error('[PATCH] COSMETICS transaction error:', e)
			}
		}

		// Create CashierReceipt with items
		const totalAmount = Math.max(0, barberAmount + cosmeticsAmount - discount)
		if (barberAmount > 0 || cosmeticsAmount > 0) {
			try {
				const receiptRows = (await (prisma as any).$queryRawUnsafe(
					`INSERT INTO "CashierReceipt"
						("userId","shiftId","paymentMethod","barberAmount","cosmeticsAmount","discount","totalAmount","barberTransactionId","cosmeticsTransactionId","createdAt")
					VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
					RETURNING "id"`,
					effectiveBarberId,
					shift.id,
					paymentMethod,
					barberAmount,
					cosmeticsAmount,
					discount,
					totalAmount,
					barberTxId,
					cosmeticsTxId
				)) as Array<{ id: number }>

				const receiptId = receiptRows[0]?.id
				if (receiptId) {
					// Add service items to receipt
					for (const svc of serviceItems) {
						await (prisma as any).$executeRawUnsafe(
							`INSERT INTO "CashierReceiptItem" ("receiptId","itemId","itemName","price","quantity","lineTotal") VALUES ($1,$2,$3,$4,$5,$6)`,
							receiptId, null, svc.name, Math.round(svc.price), 1, Math.round(svc.price)
						)
					}
					// Add cosmetics items to receipt
					for (const item of soldItems) {
						await (prisma as any).$executeRawUnsafe(
							`INSERT INTO "CashierReceiptItem" ("receiptId","itemId","itemName","price","quantity","lineTotal") VALUES ($1,$2,$3,$4,$5,$6)`,
							receiptId, item.itemId, item.itemName, item.price, item.quantity, item.lineTotal
						)
					}
				}
			} catch (e) {
				console.error('[PATCH] Receipt creation error:', e)
			}
		}
	}

	return NextResponse.json({ ok: true })
}
