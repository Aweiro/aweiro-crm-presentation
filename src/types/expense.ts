export type Expense = {
  id?: number
  shiftId: number
  amount: number
  category?: 'SALARY' | 'RENT' | 'UTILITIES' | 'OTHER'
  salaryUserId?: number | null
  comment?: string
  createdAt: string
}
