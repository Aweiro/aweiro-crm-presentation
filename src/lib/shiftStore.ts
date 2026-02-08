import { prisma } from '@/lib/prisma'

// активна зміна
export async function getActiveShift() {
  return prisma.shift.findFirst({
    where: { isOpen: true }
  })
}

// відкрити зміну
export async function openShift() {
  const active = await getActiveShift()
  if (active) throw new Error('Shift already open')

  return prisma.shift.create({
    data: {
      isOpen: true,
      openedAt: new Date()
    }
  })
}

// каса 1
export async function setCashStart(amount: number) {
  const shift = await getActiveShift()
  if (!shift) throw new Error('No active shift')

  return prisma.shift.update({
    where: { id: shift.id },
    data: { cashStart: amount }
  })
}

// закрити зміну
export async function closeShift() {
  const shift = await getActiveShift()
  if (!shift) throw new Error('No active shift')

  const cashIncome = await prisma.transaction.aggregate({
    where: {
      shiftId: shift.id,
      paymentMethod: 'CASH'
    },
    _sum: { amount: true }
  })

  const expenses = await prisma.expense.aggregate({
    where: { shiftId: shift.id },
    _sum: { amount: true }
  })

  const cashStart = shift.cashStart ?? 0
  const cashIn = cashIncome._sum.amount ?? 0
  const cashOut = expenses._sum.amount ?? 0

  const cashEnd = cashStart + cashIn - cashOut

  return prisma.shift.update({
    where: { id: shift.id },
    data: {
      isOpen: false,
      cashEnd,
      closedAt: new Date()
    }
  })
}

// архів змін
export async function getArchivedShifts() {
  return prisma.shift.findMany({
    where: { isOpen: false },
    orderBy: { closedAt: 'desc' }
  })
}