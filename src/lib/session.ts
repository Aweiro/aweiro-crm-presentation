import { cookies } from 'next/headers'
import { verifyJWT, type AppRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type SessionUser = {
	id: number
	role: AppRole
}

export async function getSessionUser(): Promise<SessionUser | null> {
	const cookieStore = await cookies()
	const token = cookieStore.get('auth_token')?.value
	if (!token) return null

	try {
		const payload = verifyJWT(token)
		const user = await prisma.user.findUnique({
			where: { id: payload.userId },
			select: { id: true, role: true, isActive: true }
		})

		if (!user || !user.isActive) return null
		return { id: user.id, role: user.role as AppRole }
	} catch {
		return null
	}
}

