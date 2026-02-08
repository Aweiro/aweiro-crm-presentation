import { NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

function sessionResponse(user: unknown) {
	const res = NextResponse.json({ user })
	res.headers.set('Cache-Control', 'no-store')
	return res
}

function clearAuthCookieResponse() {
	const res = sessionResponse(null)
	res.cookies.set('auth_token', '', {
		httpOnly: true,
		expires: new Date(0),
		path: '/',
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
	})
	return res
}

export async function GET() {
	const cookieStore = await cookies()
	const token = cookieStore.get('auth_token')?.value
	if (!token) {
		return sessionResponse(null)
	}

	try {
		const payload = verifyJWT(token)

		const user = await prisma.user.findUnique({
			where: { id: payload.userId },
			select: {
				id: true,
				login: true,
				name: true,
				role: true,
			},
		})

		if (!user) {
			return clearAuthCookieResponse()
		}

		return sessionResponse(user)
	} catch (err) {
		console.error('auth/me error', err)
		return clearAuthCookieResponse()
	}
}
