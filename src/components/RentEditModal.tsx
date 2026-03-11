'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

type RentEditModalProps = {
    isOpen: boolean
    onClose: () => void
    onSaved: () => void
    initialRentAmount: number
}

export default function RentEditModal({ isOpen, onClose, onSaved, initialRentAmount }: RentEditModalProps) {
    const [mounted, setMounted] = useState(false)
    const [amount, setAmount] = useState(initialRentAmount.toString())
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => setMounted(true), [])

    useEffect(() => {
        if (isOpen) {
            setAmount(initialRentAmount.toString())
            setError('')
        }
    }, [isOpen, initialRentAmount])

    if (!isOpen || !mounted) return null

    async function handleSave() {
        if (isSaving) return
        setError('')

        const parsed = Number(amount)
        if (isNaN(parsed) || parsed < 0) {
            setError('Сума оренди має бути 0 або більше')
            return
        }

        setIsSaving(true)
        try {
            const res = await fetch('/api/admin/settings/rent', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rentAmount: parsed })
            })

            if (!res.ok) {
                throw new Error('Не вдалося зберегти суму оренди')
            }

            onSaved()
            onClose()
        } catch (err: any) {
            setError(err.message || 'Сталася невідома помилка')
        } finally {
            setIsSaving(false)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]" onClick={() => !isSaving && onClose()}>
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 text-xl">
                        🏢
                    </div>
                    <h2 className="text-lg font-bold text-slate-900"><span className="text-xl font-black text-slate-400">zł</span> Змінити варість оренди</h2>
                </div>

                <p className="text-sm text-slate-600 mb-5">
                    Ця сума автоматично розподіляється як щоденна витрата. В архіві (за минулі місяці) оренду можна додати разово на весь місяць.
                </p>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
                        {error}
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Сума на місяць (₴)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-lg font-bold text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:font-normal placeholder:text-slate-400"
                        placeholder="0"
                        min="0"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {isSaving ? (
                            <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Збереження...</>
                        ) : 'Зберегти'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
