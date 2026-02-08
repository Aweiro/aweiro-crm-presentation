'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function AmountPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('user')
  const userName = searchParams.get('userName')

  const [amount, setAmount] = useState('')

  // якщо зайшли без user — повертаємо на головну
  useEffect(() => {
    if (!userId) {
      router.push('/cashier')
    }
  }, [userId, router])

  const handleNext = () => {
    if (!amount) return
    router.push(`/payment?user=${userId}&userName=${encodeURIComponent(userName || '')}&amount=${amount}`)
  }

  const handleBack = () => {
    router.back()
  }

  const formatDisplay = (value: string) => {
    if (!value) return '0'
    const num = parseFloat(value)
    return isNaN(num) ? '0' : num.toFixed(2)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-8">
      <div className="max-w-md mx-auto h-screen sm:h-auto flex flex-col sm:justify-center sm:items-center">
        <button
          onClick={handleBack}
          className="p-2 text-slate-700 hover:text-slate-900 transition-colors sm:hidden mb-4"
        >
          ← Назад
        </button>

        <div className="flex-1 sm:flex-none flex flex-col justify-center w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                💵 Яка сума?
              </h1>
              {userName && <p className="text-slate-600 font-semibold text-lg">для {userName}</p>}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
              <p className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                💰 До сплати
              </p>
              <div className="text-5xl font-bold text-blue-700">
                {formatDisplay(amount)}
                <span className="text-2xl ml-2">грн</span>
              </div>
            </div>

            <div className="mb-6">
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                placeholder="0.00"
                className="w-full text-center text-4xl font-bold py-4 px-4 bg-slate-50 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            <button
              onClick={handleNext}
              disabled={!amount}
              className={`w-full py-4 px-4 rounded-lg font-bold text-lg transition-all mb-3 ${
                !amount
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
              }`}
            >
              ✓ Далі
            </button>

            <button
              onClick={handleBack}
              className="w-full py-3 px-4 rounded-lg font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors hidden sm:block"
            >
              ← Назад
            </button>
          </div>

          <p className="text-center text-slate-600 text-sm mt-6 sm:mt-8 font-medium">
            👆 Вводьте суму вручну
          </p>
        </div>
      </div>
    </main>
  )
}

export default function AmountPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-8" />}>
      <AmountPageContent />
    </Suspense>
  )
}
