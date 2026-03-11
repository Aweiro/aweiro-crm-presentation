'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

type UserRow = {
    id: number
    name: string
    login: string
    isActive: boolean
}

type ShiftOpenModalProps = {
    isOpen: boolean
    onClose: () => void
    onConfirm: (selectedUserIds: number[], cashStartAmount: number) => void
    isSubmitting: boolean
}

export default function ShiftOpenModal({ isOpen, onClose, onConfirm, isSubmitting }: ShiftOpenModalProps) {
    // We fetch all active users
    const { data, isLoading } = useSWR(isOpen ? '/api/admin/users' : null, fetcher)
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [amount, setAmount] = useState('')

    // Initially select everyone when data loads
    useEffect(() => {
        if (data?.data && isOpen) {
            const activeUsers = (data.data as UserRow[]).filter(u => u.isActive)
            setSelectedIds(new Set(activeUsers.map(u => u.id)))
        }
    }, [data, isOpen])

    if (!isOpen) return null

    const activeUsers = (data?.data as UserRow[] | undefined)?.filter(u => u.isActive) || []

    function toggleUser(id: number) {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Відкриття зміни: Хто сьогодні працює?</h2>
                    <p className="text-slate-600 text-sm mb-6">
                        Позначте касирів та майстрів, які присутні на зміні.
                        Їх графік на сьогодні буде автоматично оновлено.
                    </p>

                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                        {isLoading ? (
                            <p className="text-slate-500 text-center py-4">Завантаження працівників...</p>
                        ) : activeUsers.length === 0 ? (
                            <p className="text-slate-500 text-center py-4">Немає активних працівників.</p>
                        ) : (
                            activeUsers.map(user => {
                                const isSelected = selectedIds.has(user.id)
                                return (
                                    <label
                                        key={user.id}
                                        onClick={() => toggleUser(user.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                            ? 'border-blue-500 bg-blue-50/50'
                                            : 'border-slate-200 bg-white hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'
                                                }`}>
                                                {isSelected && (
                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                                                {user.name || user.login}
                                            </span>
                                        </div>
                                    </label>
                                )
                            })
                        )}
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-5">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Сума в касі на початок зміни (₴)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-bold text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:font-normal placeholder:text-slate-400"
                            placeholder="0"
                            min="0"
                        />
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={() => onConfirm(Array.from(selectedIds), Number(amount) || 0)}
                            disabled={isSubmitting || isLoading}
                            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Відкриваємо...
                                </>
                            ) : (
                                'Відкрити зміну'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
