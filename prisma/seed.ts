import { prisma } from '@/lib/prisma'

async function main() {
  await prisma.user.createMany({
    data: [
      {
        login: 'admin',
        name: 'Адміністратор',
        passwordHash: '$2b$10$heAJeZfRd7VN.BHa7L78FuCEgr8uXBbJtzLiVy3bxPjSi9A36fhM6',
        role: 'ADMIN',
      },
      {
        login: 'user',
        name: 'Працівник',
        passwordHash: '$2b$10$CWeruiX7EPuaAuz9mPq/V.SJfJsjW8X1r9xe6EZ5LRFgj8bgFerp6',
        role: 'USER',
      },
    ],
    skipDuplicates: true,
  })
}

main()
  .then(() => {
    console.log('🌱 Seed completed')
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })