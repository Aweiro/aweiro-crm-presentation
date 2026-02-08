import { NextResponse } from 'next/server'

export async function POST() {
	const res = NextResponse.json({ ok: true })

	// 🔥 видаляємо токен
	res.cookies.set('auth_token', '', {
		httpOnly: true,
		expires: new Date(0),
		path: '/',
	})

	return res
}