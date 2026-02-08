import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'

const SECRET = process.env.JWT_SECRET!

export function signJWT(payload: { userId: number; role: Role }) {
	return jwt.sign(payload, SECRET, { expiresIn: '1d' })
}
export type JWTPayload = {
	userId: number
	role: 'ADMIN' | 'USER'
}

export function verifyJWT(token: string): JWTPayload {
	return jwt.verify(token, SECRET) as JWTPayload
}
