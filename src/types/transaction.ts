export type Transaction = {
  shiftId: number
  userId: string
  amount: number
  paymentMethod: 'CASH' | 'CARD'
  createdAt: string
}