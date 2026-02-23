import dotenv from 'dotenv'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const envPath = process.env.SEED_ENV_PATH || '.env.presentation'
dotenv.config({ path: envPath, override: true })

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
	throw new Error(
		`DATABASE_URL is empty. Check ${envPath} or set DATABASE_URL before running seed.`
	)
}

const pool = new Pool({
	connectionString: databaseUrl
})

const prisma = new PrismaClient({
	adapter: new PrismaPg(pool),
	log: ['error']
})

async function main() {
	await prisma.user.createMany({
		data: [
			{
				login: 'admin',
				name: 'Адміністратор',
				passwordHash:
					'$2b$10$heAJeZfRd7VN.BHa7L78FuCEgr8uXBbJtzLiVy3bxPjSi9A36fhM6',
				role: 'ADMIN'
			},
			{
				login: 'user',
				name: 'Працівник',
				passwordHash:
					'$2b$10$CWeruiX7EPuaAuz9mPq/V.SJfJsjW8X1r9xe6EZ5LRFgj8bgFerp6',
				role: 'USER'
			}
		],
		skipDuplicates: true
	})
}

main()
	.then(() => console.log('🌱 Seed completed'))
	.catch(console.error)
	.finally(async () => {
		await prisma.$disconnect()
		await pool.end()
	})
