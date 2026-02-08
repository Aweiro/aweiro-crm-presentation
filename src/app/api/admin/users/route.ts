import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { isActive: 'desc' }
  })

  return NextResponse.json({ data: users })
}

export async function POST(req: Request) {
	try {
		const body = await req.json()

		const { login, password, name, role } = body

		if (!login || !password || !name) {
			return NextResponse.json(
				{ message: 'Missing fields' },
				{ status: 400 }
			)
		}

		// 🔒 хеш пароля
		const passwordHash = await bcrypt.hash(password, 10)

		const user = await prisma.user.create({
			data: {
				login,
				passwordHash,
				name,
				role: role ?? 'USER',
			}
		})

		return NextResponse.json(user)

	} catch (e) {
		console.error('❌ create user error', e)

		return NextResponse.json(
			{ message: 'Internal error' },
			{ status: 500 }
		)
	}
}