import { NextResponse } from 'next/server'
import { addExpense, getShiftExpenses } from '@/lib/expensesStore'
import { getActiveShift } from '@/lib/shiftStore'
import { prisma } from '@/lib/prisma'

type ExpenseCategory = 'SALARY' | 'RENT' | 'UTILITIES' | 'OTHER'

async function getMonthlyRentAmount() {
	try {
		const appSetting = (prisma as any).appSetting
		if (appSetting?.findUnique) {
			const row = await appSetting.findUnique({
				where: { key: 'monthlyRentAmount' }
			})
			return Number(row?.value || 0) || 0
		}

		const rows = (await (prisma as any).$queryRawUnsafe(
			'SELECT "value" FROM "AppSetting" WHERE "key" = $1 LIMIT 1',
			'monthlyRentAmount'
		)) as Array<{ value: string }>
		return Number(rows[0]?.value || 0) || 0
	} catch {
		return 0
	}
}

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const archive = searchParams.get('archive')

	// Якщо потрібні видатки з архіву (усі видатки)
	if (archive === 'true') {
		try {
			const rentAmount = await getMonthlyRentAmount()
			const expenses = await prisma.expense.findMany({
				orderBy: { createdAt: 'desc' }
			})
			return NextResponse.json({
				data: expenses,
				rentAmount
			})
		} catch (e) {
			console.error('❌ admin/expenses archive error', e)
			return NextResponse.json({ message: 'Internal error' }, { status: 500 })
		}
	}

	// Інакше повертаємо видатки активної змін
	const shift = await getActiveShift()

	if (!shift) {
		return NextResponse.json({ data: [] })
	}

	const expenses = await getShiftExpenses(shift.id)
	return NextResponse.json({ data: expenses })
}

export async function POST(req: Request) {
	try {
		const body = await req.json()
		const { amount, comment } = body
		const category: ExpenseCategory =
			body.category === 'SALARY' ||
			body.category === 'RENT' ||
			body.category === 'UTILITIES'
				? body.category
				: 'OTHER'
		const salaryUserId =
			Number.isFinite(Number(body.salaryUserId)) && Number(body.salaryUserId) > 0
				? Number(body.salaryUserId)
				: undefined
		let finalAmount = Number(amount)

		if (category === 'SALARY' && !salaryUserId) {
			return NextResponse.json(
				{ message: 'salaryUserId is required for salary expense' },
				{ status: 400 }
			)
		}

		const shift = await getActiveShift()
		if (!shift) {
			return NextResponse.json({ message: 'Shift is closed' }, { status: 403 })
		}

		if (category === 'RENT') {
			const rentAmount = await getMonthlyRentAmount()

			if (!rentAmount || rentAmount <= 0) {
				return NextResponse.json(
					{
						message:
							'Не задано фіксовану суму оренди. Вкажіть її у вкладці користувачів.'
					},
					{ status: 400 }
				)
			}

			const now = new Date()
			const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
			const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)

			const existingRent = await (async () => {
				try {
					return await (prisma.expense as any).findFirst({
						where: {
							category: 'RENT',
							createdAt: {
								gte: monthStart,
								lt: nextMonthStart
							}
						},
						select: { id: true }
					})
				} catch {
					// Legacy fallback: no category column yet, detect rent by comment text.
					const legacy = await prisma.expense.findFirst({
						where: {
							createdAt: {
								gte: monthStart,
								lt: nextMonthStart
							},
							OR: [
								{ comment: { contains: 'Оренда' } },
								{ comment: { contains: 'оренда' } },
								{ comment: { contains: 'rent' } }
							]
						},
						select: { id: true }
					})
					return legacy
				}
			})()
			if (existingRent) {
				return NextResponse.json(
					{ message: 'Оренда за цей місяць вже додана' },
					{ status: 400 }
				)
			}

			finalAmount = rentAmount
		}

		if ((category === 'UTILITIES' || category === 'OTHER' || category === 'SALARY') && finalAmount <= 0) {
			return NextResponse.json(
				{ message: 'Amount must be greater than 0' },
				{ status: 400 }
			)
		}

		let expense
		try {
			expense = await addExpense({
				amount: finalAmount,
				category,
				comment: comment?.trim() || undefined,
				salaryUserId,
				shiftId: shift.id
			})
		} catch (createError: any) {
			const message = String(createError?.message || '')
			if (
				message.includes('category') ||
				message.includes('salaryUserId') ||
				message.includes('Unknown arg')
			) {
				// Legacy fallback when DB/client is still on old Expense shape.
				const preparedComment = comment?.trim() || ''
				const hasSalaryUserPrefix = /^Зарплата\s*\(userId:\d+\):/i.test(
					preparedComment
				)
				const fallbackComment =
					category === 'SALARY'
						? (
								hasSalaryUserPrefix
									? preparedComment
									: `Зарплата (userId:${salaryUserId}): ${preparedComment}`
							).trim()
						: category === 'RENT'
							? preparedComment || 'Оренда'
							: category === 'UTILITIES'
								? `Комунальні: ${preparedComment}`.trim()
								: preparedComment || undefined

				expense = await prisma.expense.create({
					data: {
						amount: finalAmount,
						comment: fallbackComment,
						createdAt: new Date(),
						shiftId: shift.id
					}
				})
			} else {
				throw createError
			}
		}

		return NextResponse.json(expense)
	} catch (e) {
		const message = String((e as any)?.message || '')
		if (
			message.includes('category') ||
			message.includes('salaryUserId') ||
			message.includes('AppSetting') ||
			message.includes('appSetting')
		) {
			return NextResponse.json(
				{
					message:
						'Потрібно застосувати Prisma міграцію для нових витрат. Виконайте: npx prisma migrate dev'
				},
				{ status: 400 }
			)
		}
		console.error('❌ add expense error', e)
		return NextResponse.json(
			{ message: 'Помилка створення витрати' },
			{ status: 500 }
		)
	}
}
