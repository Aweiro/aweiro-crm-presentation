'use client'

import { useRouter } from 'next/navigation'

type Props = {
  employee: {
    id: number
    name: string
  }
  disabled?: boolean
}

export default function EmployeeButton({ employee, disabled }: Props) {
  const router = useRouter()

  return (
    <button
      onClick={() => {
        if (!disabled) {
          router.push(`/amount?user=${employee.id}&userName=${encodeURIComponent(employee.name)}`)
        }
      }}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-xl font-bold text-lg transition-all duration-200 
        p-6 transform border-2
        ${disabled
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50 border-slate-200'
          : 'bg-gradient-to-br from-white to-slate-50 border-blue-300 text-blue-900 shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 cursor-pointer hover:border-blue-400'
        }
      `}
    >
      <div className="flex items-center justify-center gap-3">
        <span className="text-3xl">👤</span>
        <div className="text-left">
          <div className="font-bold">{employee.name}</div>
          <div className="text-xs opacity-75">Натисніть для платежу</div>
        </div>
      </div>
      
      {!disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      )}
    </button>
  )
}