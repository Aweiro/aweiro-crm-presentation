import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signJWT } from '@/lib/auth'

export async function POST(req: Request) {
	const { login, password } = await req.json()

	const user = await prisma.user.findUnique({
		where: { login }
	})
	console.log('LOGIN RESULT:', user)

	if (!user || !user.isActive) {
		return NextResponse.json(
			{ message: 'Невірний логін або пароль' },
			{ status: 401 }
		)
	}

	const ok = await bcrypt.compare(password, user.passwordHash)

	if (!ok) {
		return NextResponse.json(
			{ message: 'Невірний логін або пароль' },
			{ status: 401 }
		)
	}

	console.log('LOGIN:', login)
	console.log('PASSWORD:', password)
	console.log('HASH:', user.passwordHash)

	const test = await bcrypt.compare(password, user.passwordHash)
	console.log('BCRYPT RESULT:', test)

	const token = signJWT({
		userId: user.id,
		role: user.role
	})

	const res = NextResponse.json({
		ok: true,
		role: user.role // 🔥 ОБОВʼЯЗКОВО
	})

	res.cookies.set('auth_token', token, {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		secure: process.env.NODE_ENV === 'production'
	})

	return res
}
