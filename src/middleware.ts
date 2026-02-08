import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
	const { pathname, searchParams } = req.nextUrl

	console.log('🧱 MIDDLEWARE RUN:', pathname)

	const token = req.cookies.get('auth_token')?.value

	// 🔹 LOGIN СТОРІНКА
	if (pathname === '/login') {
		if (!token) {
			return NextResponse.next()
		}

		const payload = decodeJWT(token)
		if (!payload?.role) {
			return NextResponse.next()
		}

		const from = searchParams.get('from')
		const target =
			from && from.startsWith('/')
				? from
				: payload.role === 'ADMIN'
				? '/admin/day'
				: '/cashier'

		return NextResponse.redirect(new URL(target, req.url))
	}

	// 🔹 API auth — дозволено
	if (pathname.startsWith('/api/auth')) {
		return NextResponse.next()
	}

	// 🔹 ВСЕ ІНШЕ — ПОТРЕБУЄ АВТОРИЗАЦІЇ
	if (!token) {
		return redirectToLogin(req)
	}

	const payload = decodeJWT(token)
	if (!payload?.role) {
		return redirectToLogin(req)
	}

	const role = payload.role

	// 🔹 USER сторінки тільки для USER
	if (pathname.startsWith('/user')) {
		if (role === 'USER') {
			return NextResponse.next()
		}
		return NextResponse.redirect(new URL('/admin/day', req.url))
	}

	// 🔹 ADMIN може все
	if (role === 'ADMIN') {
		return NextResponse.next()
	}

	// 🔹 USER — cashier сторінки
	if (role === 'USER' && pathname.startsWith('/cashier')) {
		return NextResponse.next()
	}

	return redirectToLogin(req)
}

function redirectToLogin(req: NextRequest) {
	const url = new URL('/login', req.url)
	url.searchParams.set('from', req.nextUrl.pathname)
	return NextResponse.redirect(url)
}

function decodeJWT(token: string) {
	try {
		const base64 = token.split('.')[1]
		return JSON.parse(Buffer.from(base64, 'base64').toString())
	} catch {
		return null
	}
}

export const config = {
	matcher: ['/login', '/admin/:path*', '/cashier/:path*', '/user/:path*'],
}
