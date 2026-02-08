import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET!

export type AppRole = 'ADMIN' | 'USER'

export function signJWT(payload: { userId: number; role: AppRole }) {
	return jwt.sign(payload, SECRET, { expiresIn: '1d' })
}
export type JWTPayload = {
	userId: number
	role: AppRole
}

export function verifyJWT(token: string): JWTPayload {
	return jwt.verify(token, SECRET) as JWTPayload
}
