'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { formatCurrency } from '@/lib/currency'

const fetcher = (url: string) => fetch(url).then(res => res.json())

type Service = {
    id: number
    name: string
    price: number
    durationMin: number
}

type CosmeticItem = {
    id: number
    shortName: string
    price: number
    quantity: number
}

type BookingCompletionModalProps = {
    booking: any
    onClose: () => void
    onSuccess: () => void
    allowBarberChange?: boolean
    allBarbers?: { id: number, name: string }[]
}

export default function BookingCompletionModal({
    booking,
    onClose,
    onSuccess,
    allowBarberChange = false,
    allBarbers = []
}: BookingCompletionModalProps) {
    const [barberId, setBarberId] = useState(booking.barberId)
    const [serviceIds, setServiceIds] = useState<number[]>([])
    const [cosmeticsItems, setCosmeticsItems] = useState<{ itemId: number; quantity: number }[]>([])
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH')
    const [discountValue, setDiscountValue] = useState('')
    const [isCompleting, setIsCompleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch inventory
    const { data: inventoryData } = useSWR('/api/admin/inventory', fetcher)
    const inventoryItems: CosmeticItem[] = Array.isArray(inventoryData?.data) ? inventoryData.data : []

    // Fetch services for selected barber
    const { data: servicesData, isLoading: servicesLoading } = useSWR(
        barberId ? `/api/appointments/services?barberId=${barberId}` : null,
        fetcher
    )
    const barberServices: Service[] = Array.isArray(servicesData?.data) ? servicesData.data : []

    // Initialize serviceIds on mount or when barber changes
    useEffect(() => {
        if (barberId === booking.barberId && booking.services) {
            setServiceIds(booking.services.map((s: any) => s.serviceId))
        } else {
            setServiceIds([])
        }
    }, [barberId, booking])

    async function completeBooking() {
        if (isCompleting) return
        setIsCompleting(true)
        setError(null)
        try {
            const body: any = {
                status: 'DONE',
                paymentMethod
            }

            if (barberId !== booking.barberId) {
                body.barberId = barberId
            }

            if (serviceIds.length > 0) {
                body.serviceIds = serviceIds
            }

            if (cosmeticsItems.length > 0) {
                body.cosmeticsItems = cosmeticsItems
            }

            if (discountValue) {
                body.discount = Number(discountValue)
            }

            const res = await fetch(`/api/appointments/bookings/${booking.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const json = await res.json().catch(() => ({}))

            if (res.ok) {
                onSuccess()
            } else {
                setError(json?.message || 'Помилка завершення запису')
            }
        } finally {
            setIsCompleting(false)
        }
    }

    const svcTotal = barberServices.filter(s => serviceIds.includes(s.id)).reduce((sum, s) => sum + s.price, 0)
    const cosTotal = cosmeticsItems.reduce((sum, c) => {
        const item = inventoryItems.find(i => i.id === c.itemId)
        return sum + (item ? item.price * c.quantity : 0)
    }, 0)
    const discountAmount = Number(discountValue || 0)
    const grandTotal = Math.max(0, svcTotal + cosTotal - discountAmount)

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Завершити запис</h3>
                        <p className="text-[13px] text-slate-500 mt-0.5">{booking.clientName} • {new Date(booking.startAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Barber selector */}
                    {allowBarberChange ? (
                        <div>
                            <label className="block text-[13px] font-bold text-slate-700 mb-2">Майстер</label>
                            <select
                                value={barberId || ''}
                                onChange={(e) => setBarberId(Number(e.target.value))}
                                className="w-full px-4 py-2.5 text-[14px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                {allBarbers.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-[13px] font-bold text-slate-700 mb-2">Майстер</label>
                            <div className="w-full px-4 py-2.5 text-[14px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl cursor-not-allowed opacity-80 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">{booking.barberName?.charAt(0) || 'Б'}</span>
                                {booking.barberName || 'Майстер'}
                            </div>
                        </div>
                    )}

                    {/* Services */}
                    <div>
                        <label className="block text-[13px] font-bold text-slate-700 mb-2">Послуги</label>
                        {servicesLoading ? (
                            <div className="flex items-center justify-center py-6 text-slate-400">
                                <svg className="h-5 w-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span className="text-[13px] font-medium">Завантаження послуг…</span>
                            </div>
                        ) : (
                            <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                                {barberServices.map((service) => {
                                    const isSelected = serviceIds.includes(service.id)
                                    return (
                                        <button
                                            key={service.id}
                                            type="button"
                                            onClick={() => {
                                                setServiceIds(prev =>
                                                    isSelected
                                                        ? prev.filter(id => id !== service.id)
                                                        : [...prev, service.id]
                                                )
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${isSelected
                                                ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200 shadow-sm text-blue-900'
                                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                                }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[14px] font-semibold block truncate leading-tight mb-0.5">{service.name}</span>
                                                <span className={`text-[12px] ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>{service.durationMin} хв • {formatCurrency(service.price)}</span>
                                            </div>
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                                                }`}>
                                                {isSelected && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Cosmetics */}
                    <div>
                        <label className="block text-[13px] font-bold text-slate-700 mb-2">Косметика зі складу</label>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                            {!inventoryData && (
                                <div className="text-[13px] text-slate-400 py-2">Перевірка складу...</div>
                            )}
                            {inventoryData && inventoryItems.length === 0 && (
                                <p className="text-[13px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-3">На складі немає товарів для продажу.</p>
                            )}
                            {inventoryItems.map((item) => {
                                const entry = cosmeticsItems.find(c => c.itemId === item.id)
                                const qty = entry?.quantity || 0
                                return (
                                    <div
                                        key={item.id}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${qty > 0 ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200 shadow-sm' : 'bg-white border-slate-200'
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <span className={`text-[14px] font-bold block truncate leading-tight mb-0.5 ${qty > 0 ? 'text-emerald-800' : 'text-slate-800'}`}>{item.shortName}</span>
                                            <span className={`text-[12px] font-medium ${qty > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>{formatCurrency(item.price)} <span className="text-slate-400 mx-1">•</span> залишок: {item.quantity}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 bg-white rounded-lg p-1 border border-slate-100 shadow-sm">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (qty <= 0) return
                                                    setCosmeticsItems(prev =>
                                                        qty === 1
                                                            ? prev.filter(c => c.itemId !== item.id)
                                                            : prev.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity - 1 } : c)
                                                    )
                                                }}
                                                className={`w-7 h-7 rounded-md flex items-center justify-center text-[16px] font-bold transition-all ${qty > 0 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-50 text-slate-300'
                                                    }`}
                                            >
                                                −
                                            </button>
                                            <span className={`w-6 text-center text-[14px] font-bold ${qty > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>{qty}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (qty >= item.quantity) return
                                                    setCosmeticsItems(prev => {
                                                        const existing = prev.find(c => c.itemId === item.id)
                                                        if (existing) {
                                                            return prev.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c)
                                                        }
                                                        return [...prev, { itemId: item.id, quantity: 1 }]
                                                    })
                                                }}
                                                className={`w-7 h-7 rounded-md flex items-center justify-center text-[16px] font-bold transition-all ${qty < item.quantity ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-50 text-slate-300'
                                                    }`}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Payment method */}
                    <div>
                        <label className="block text-[13px] font-bold text-slate-700 mb-2">Метод оплати</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('CASH')}
                                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all border-2 ${paymentMethod === 'CASH'
                                    ? 'bg-green-50 text-green-700 border-green-500 shadow-sm shadow-green-500/10'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="text-xl mb-1">💵</span>
                                <span className="text-[13px] font-bold">Готівка</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('CARD')}
                                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all border-2 ${paymentMethod === 'CARD'
                                    ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-sm shadow-blue-500/10'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="text-xl mb-1">💳</span>
                                <span className="text-[13px] font-bold">Картка</span>
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    {grandTotal > 0 && (
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-4 border border-slate-200">
                            <div className="space-y-1.5 mb-3">
                                {svcTotal > 0 && (
                                    <div className="flex justify-between text-[13px] items-center">
                                        <span className="text-slate-600 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Послуги</span>
                                        <span className="font-bold text-slate-800">{formatCurrency(svcTotal)}</span>
                                    </div>
                                )}
                                {cosTotal > 0 && (
                                    <div className="flex justify-between text-[13px] items-center">
                                        <span className="text-slate-600 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Косметика</span>
                                        <span className="font-bold text-emerald-700">{formatCurrency(cosTotal)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-3 bg-red-50/50 p-2.5 rounded-xl border border-red-100 mb-3">
                                <label className="text-[13px] font-semibold text-red-700">
                                    Знижка (zł)
                                </label>
                                <div className="relative w-24">
                                    <input
                                        type="number"
                                        min={0}
                                        step="1"
                                        placeholder="0"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        className="w-full rounded-lg border border-red-200 bg-white px-2 py-1.5 pr-6 text-right font-bold text-red-700 outline-none ring-red-200 transition focus:border-red-400 focus:ring-2 text-[14px]"
                                    />
                                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-red-400">
                                        zł
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end pt-3 border-t border-slate-200/80">
                                <span className="text-slate-700 font-bold text-[13px] uppercase tracking-wider">Сума до сплати</span>
                                <span className="font-black text-2xl text-slate-900 leading-none">{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-700 font-medium flex items-start gap-2">
                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={completeBooking}
                        disabled={isCompleting || serviceIds.length === 0}
                        className="flex-[2] py-3.5 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
                    >
                        {isCompleting ? (
                            <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                Провести оплату
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
