'use client'

import { useEffect, useLayoutEffect, useMemo, useState, useRef } from 'react'
import useSWR, { mutate } from 'swr'
import { useUser } from '@/lib/useUser'
import { formatCurrency } from '@/lib/currency'
import ConfirmModal from '@/components/ConfirmModal'
import { fetcher } from '@/lib/fetcher'
import PageLoader from '@/components/PageLoader'

type Service = {
    id: number
    name: string
    price: number
    durationMin: number
}

type Barber = {
    id: number
    name: string
    role: 'ADMIN' | 'USER'
}

type Slot = {
    time: string
    startAt: string
    endAt: string
}

type Booking = {
    id: number
    clientName: string
    clientPhone: string | null
    comment: string | null
    barberId: number
    barberName: string
    startAt: string
    endAt: string
    status: string
    totalPrice: number
    totalDuration: number
    services: Array<{
        serviceId: number
        name: string
        price: number
        durationMin: number
    }>
}

type CalendarDay = {
    value: string
    weekday: string
    day: string
    month: string
}

function ymd(value: Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function buildCalendarDays(startOffset = 0, length = 14): CalendarDay[] {
    const now = new Date()
    const days: CalendarDay[] = []
    for (let i = 0; i < length; i += 1) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + startOffset + i)
        days.push({
            value: ymd(d),
            weekday: d.toLocaleDateString('uk-UA', { weekday: 'short' }),
            day: String(d.getDate()),
            month: d.toLocaleDateString('uk-UA', { month: 'short' })
        })
    }
    return days
}

export default function AppointmentsPage() {
    const { user, loading } = useUser()
    const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([])
    const [barberId, setBarberId] = useState<number | null>(null)
    const [date, setDate] = useState<string>(ymd(new Date()))
    const [selectedTime, setSelectedTime] = useState<string>('')
    const [clientName, setClientName] = useState('')
    const [clientPhone, setClientPhone] = useState('')
    const [comment, setComment] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [bookingToComplete, setBookingToComplete] = useState<Booking | null>(null)
    const [editBarberId, setEditBarberId] = useState<number | null>(null)
    const [editServiceIds, setEditServiceIds] = useState<number[]>([])
    const [isCompleting, setIsCompleting] = useState(false)
    const [editCosmeticsItems, setEditCosmeticsItems] = useState<Array<{ itemId: number; quantity: number }>>([])
    const [editPaymentMethod, setEditPaymentMethod] = useState<'CASH' | 'CARD'>('CASH')
    const [completeError, setCompleteError] = useState<string | null>(null)
    const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null)
    const [editTime, setEditTime] = useState('')
    const [editError, setEditError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'BOOKED' | 'DONE'>('ALL')
    const [scheduleSaving, setScheduleSaving] = useState(false)
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [listDate, setListDate] = useState<string>(ymd(new Date()))
    const [listBarberId, setListBarberId] = useState<number | null>(null)
    const [weekOffset, setWeekOffset] = useState(0)
    const dateInputRef = useRef<HTMLInputElement>(null)

    // Build 7 days for the current week view
    const weekDays = useMemo(() => {
        const today = new Date()
        const monday = new Date(today)
        monday.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7) // Start from Monday
        const days: CalendarDay[] = []
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday)
            d.setDate(monday.getDate() + i)
            days.push({
                value: ymd(d),
                weekday: d.toLocaleDateString('uk-UA', { weekday: 'short' }),
                day: String(d.getDate()),
                month: d.toLocaleDateString('uk-UA', { month: 'short' })
            })
        }
        return days
    }, [weekOffset])

    // Navigate to the week containing a given date
    const navigateToDate = (dateStr: string) => {
        setListDate(dateStr)
        const target = new Date(dateStr + 'T00:00:00')
        const today = new Date()
        const monday = new Date(today)
        monday.setDate(today.getDate() - today.getDay() + 1)
        monday.setHours(0, 0, 0, 0)
        const diffDays = Math.floor((target.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24))
        setWeekOffset(Math.floor(diffDays / 7))
    }

    const isCurrentWeek = weekOffset === 0

    const { data: servicesData, isLoading: servicesLoading } = useSWR(
        barberId ? `/api/appointments/services?barberId=${barberId}` : '/api/appointments/services',
        fetcher
    )
    const services: Service[] = Array.isArray(servicesData?.data)
        ? servicesData.data
        : []

    const { data: inventoryData } = useSWR('/api/admin/inventory', fetcher)
    const inventoryItems: Array<{ id: number; shortName: string; price: number; quantity: number }> = Array.isArray(inventoryData?.data) ? inventoryData.data : []

    // Services for the completion modal (based on editBarberId)
    const { data: editServicesData, isLoading: editServicesLoading } = useSWR(
        editBarberId ? `/api/appointments/services?barberId=${editBarberId}` : null,
        fetcher
    )
    const editBarberServices: Service[] = Array.isArray(editServicesData?.data) ? editServicesData.data : []

    // Slots for the edit modal (based on editBarberId + editServiceIds + booking date)
    const editServiceIdsParam = editServiceIds.join(',')
    const editBookingDate = bookingToEdit ? bookingToEdit.startAt.split('T')[0] : null
    const { data: editSlotsData, isLoading: editSlotsLoading } = useSWR(
        editBarberId && editServiceIdsParam && editBookingDate
            ? `/api/appointments/slots?barberId=${editBarberId}&date=${editBookingDate}&serviceIds=${encodeURIComponent(editServiceIdsParam)}`
            : null,
        fetcher
    )
    const editSlots: Slot[] = Array.isArray(editSlotsData?.data) ? editSlotsData.data : []

    // Auto-select booking services when editBarberServices loads
    const [prevEditBarberId, setPrevEditBarberId] = useState<number | null>(null)
    const activeBookingForEdit = bookingToComplete || bookingToEdit
    if (editBarberId !== prevEditBarberId && editBarberServices.length > 0 && !editServicesLoading && activeBookingForEdit) {
        setPrevEditBarberId(editBarberId)
        const bookingServiceIds = activeBookingForEdit.services.map(s => s.serviceId)
        const matchingIds = editBarberServices.filter(s => bookingServiceIds.includes(s.id)).map(s => s.id)
        setEditServiceIds(matchingIds)
    }

    const serviceIdsParam = selectedServiceIds.join(',')


    const { data: slotsData, isLoading: slotsLoading } = useSWR(
        barberId && selectedServiceIds.length > 0 && date
            ? `/api/appointments/slots?barberId=${barberId}&date=${date}&serviceIds=${encodeURIComponent(serviceIdsParam)}`
            : null,
        fetcher
    )
    const slots: Slot[] = Array.isArray(slotsData?.data) ? slotsData.data : []

    const { data: allBarbersData, isLoading: barbersLoading } = useSWR(
        user?.role === 'ADMIN' ? `/api/appointments/barbers?date=${listDate}` : null,
        fetcher
    )
    // This line is part of the diff, but it's not clear if it's meant to replace the existing `allBarbers` or be in addition.
    // Given the instruction to remove schedule modal state, and `allBarbers` is used elsewhere, I'll assume the existing `allBarbers` is correct.
    // const [allBarbers, setAllBarbers] = useState<any[]>([]) // This line was in the diff, but seems to be a state declaration, not a useSWR.
    // I will keep the useSWR for allBarbers and the type definition.
    // The diff also had `const [allBarbers, setAllBarbers] = useState<any[]>([])` which is a state declaration.
    // I will assume the `allBarbers` from useSWR is the intended source of truth.
    // The diff also had `const [editError, setEditError] = useState('')` which is a duplicate. I'll keep the first one.

    const allBarbers: Barber[] = Array.isArray(allBarbersData?.data)
        ? allBarbersData.data
        : []

    const bookingsQueryDate = user?.role === 'ADMIN' ? listDate : date
    const bookingsKey = `/api/appointments/bookings?date=${bookingsQueryDate}${user?.role === 'ADMIN' && listBarberId ? `&barberId=${listBarberId}` : ''
        }`

    const { data: bookingsData, isLoading: bookingsLoading } = useSWR<{
        data: Booking[]
        schedules?: Record<number, { isWorking: boolean, startHour: number, endHour: number }>
    }>(
        bookingsKey,
        fetcher
    )
    const bookings: Booking[] = Array.isArray(bookingsData?.data)
        ? bookingsData.data as unknown as Booking[]
        : []

    const selectedServices = useMemo(
        () => services.filter((s) => selectedServiceIds.includes(s.id)),
        [services, selectedServiceIds]
    )
    const totalDuration = selectedServices.reduce(
        (sum, service) => sum + service.durationMin,
        0
    )
    const fallbackTotalPrice = selectedServices.reduce(
        (sum, service) => sum + service.price,
        0
    )
    const totalPrice =
        typeof slotsData?.summary?.totalPrice === 'number'
            ? slotsData.summary.totalPrice
            : fallbackTotalPrice
    const hasServices = selectedServiceIds.length > 0
    const hasBarber = Boolean(barberId)
    const hasTime = Boolean(selectedTime)

    const breadcrumbs = [
        { key: 1 as const, label: 'Послуги', value: selectedServices.length ? `${selectedServices.length} обрано` : null, enabled: true },
        { key: 4 as const, label: 'Час', value: selectedTime || null, enabled: hasServices && hasBarber },
        { key: 5 as const, label: 'Клієнт', value: clientName || null, enabled: hasServices && hasBarber && hasTime }
    ]
    const visibleBreadcrumbs = breadcrumbs.filter((crumb) => crumb.key <= step)

    function toggleService(serviceId: number) {
        setSelectedTime('')
        setSelectedServiceIds((prev) =>
            prev.includes(serviceId)
                ? prev.filter((id) => id !== serviceId)
                : [...prev, serviceId]
        )
    }

    async function createBooking() {
        setError(null)
        if (!clientName.trim() || !barberId || !selectedTime || selectedServiceIds.length === 0) {
            setError('Заповніть клієнта, послуги, барбера та час')
            return
        }

        setIsCreating(true)
        try {
            const res = await fetch('/api/appointments/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName: clientName.trim(),
                    clientPhone: clientPhone.trim(),
                    comment: comment.trim(),
                    barberId,
                    date,
                    time: selectedTime,
                    serviceIds: selectedServiceIds
                })
            })

            const json = await res.json().catch(() => ({}))
            if (!res.ok) {
                setError(json?.message || 'Не вдалося створити запис')
                return
            }

            setClientName('')
            setClientPhone('')
            setComment('')
            setSelectedTime('')
            setStep(4)
            setIsDrawerOpen(false)
            mutate(bookingsKey)
            mutate(
                barberId && selectedServiceIds.length > 0 && date
                    ? `/api/appointments/slots?barberId=${barberId}&date=${date}&serviceIds=${encodeURIComponent(serviceIdsParam)}`
                    : null
            )
        } finally {
            setIsCreating(false)
        }
    }

    async function deleteBooking() {
        if (!bookingToDelete || isDeleting) return
        setIsDeleting(true)
        try {
            await fetch(`/api/appointments/bookings/${bookingToDelete.id}`, {
                method: 'DELETE'
            })
            setBookingToDelete(null)
            mutate(bookingsKey)
            mutate(
                barberId && selectedServiceIds.length > 0 && date
                    ? `/api/appointments/slots?barberId=${barberId}&date=${date}&serviceIds=${encodeURIComponent(serviceIdsParam)}`
                    : null
            )
        } finally {
            setIsDeleting(false)
        }
    }

    async function saveBookingEdit() {
        if (!bookingToEdit || isSaving) return
        setIsSaving(true)
        setEditError(null)
        try {
            const body: any = {}
            // Time change
            if (editTime) {
                const bookingDate = bookingToEdit.startAt.split('T')[0]
                body.startAt = `${bookingDate}T${editTime}:00`
            }
            // Barber change
            if (editBarberId && editBarberId !== bookingToEdit.barberId) {
                body.barberId = editBarberId
            }
            // Services change
            if (editServiceIds.length > 0) {
                body.serviceIds = editServiceIds
            }
            const res = await fetch(`/api/appointments/bookings/${bookingToEdit.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            const json = await res.json().catch(() => ({}))
            if (res.ok) {
                setBookingToEdit(null)
                mutate(bookingsKey)
            } else {
                setEditError(json?.message || 'Помилка збереження')
            }
        } finally {
            setIsSaving(false)
        }
    }

    async function completeBooking() {
        if (!bookingToComplete || isCompleting) return
        setIsCompleting(true)
        setCompleteError(null)
        try {
            const body: any = {
                status: 'DONE',
                paymentMethod: editPaymentMethod
            }
            if (editBarberId && editBarberId !== bookingToComplete.barberId) {
                body.barberId = editBarberId
            }
            if (editServiceIds.length > 0) {
                body.serviceIds = editServiceIds
            }
            if (editCosmeticsItems.length > 0) {
                body.cosmeticsItems = editCosmeticsItems
            }
            const res = await fetch(`/api/appointments/bookings/${bookingToComplete.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            const json = await res.json().catch(() => ({}))
            if (res.ok) {
                setBookingToComplete(null)
                setEditCosmeticsItems([])
                setCompleteError(null)
                mutate(bookingsKey)
            } else {
                setCompleteError(json?.message || 'Помилка завершення запису')
            }
        } finally {
            setIsCompleting(false)
        }
    }

    if (loading) {
        return <PageLoader message="Завантаження записів…" />
    }

    const displayedBarbers = user?.role === 'ADMIN' && listBarberId
        ? allBarbers.filter(b => b.id === listBarberId)
        : (user?.role === 'ADMIN' ? allBarbers : allBarbers.filter(b => b.id === user?.id))

    // Replaced START_HOUR and END_HOUR with dynamic values from the API

    const now = new Date()
    const nowYmd = ymd(now)
    const isToday = listDate === nowYmd
    const isPastDay = listDate < nowYmd
    const currentMins = now.getHours() * 60 + now.getMinutes()

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden font-sans">
            {/* HEADER */}
            <div className="flex-none bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Календар запису</h1>
                    <p className="mt-0.5 text-[14px] font-medium text-slate-500">Управління записами на обраний день</p>
                </div>
                <div className="flex items-center gap-3">
                    {user?.role === 'ADMIN' && (
                        <div className="relative group hidden sm:block">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <select
                                value={listBarberId ? String(listBarberId) : ''}
                                onChange={(e) => setListBarberId(e.target.value ? Number(e.target.value) : null)}
                                className="block w-full pl-9 pr-10 py-2.5 text-[14px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl appearance-none transition-all hover:border-blue-400 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 min-w-[180px]"
                            >
                                <option value="">Всі майстри</option>
                                {allBarbers.map((barber) => (
                                    <option key={barber.id} value={barber.id}>
                                        {barber.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => dateInputRef.current?.showPicker?.()}
                        className="relative flex-none rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-blue-400 transition-all shadow-sm flex items-center justify-center cursor-pointer group h-[42px] w-[42px]"
                    >
                        <svg className="h-5 w-5 text-slate-500 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={listDate}
                            onChange={(e) => {
                                if (e.target.value) navigateToDate(e.target.value)
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            tabIndex={-1}
                        />
                    </button>
                    {!isCurrentWeek && (
                        <button
                            type="button"
                            onClick={() => { setWeekOffset(0); setListDate(ymd(new Date())) }}
                            className="flex-none h-[42px] px-4 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 transition-all shadow-sm"
                        >
                            Сьогодні
                        </button>
                    )}
                </div>
            </div>

            {/* DATE NAVIGATOR STRIP */}
            <div className="flex-none bg-white border-b border-slate-100 px-3 sm:px-6 py-3 shadow-sm z-10">
                <div className="flex items-center gap-1.5 w-full max-w-[1920px] mx-auto">
                    {/* Prev */}
                    <button
                        type="button"
                        onClick={() => setWeekOffset(w => w - 1)}
                        className="flex-none w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 active:scale-95 transition-all"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    {/* 7-day grid */}
                    <div className="flex-1 grid grid-cols-7 gap-1">
                        {weekDays.map((day) => {
                            const active = listDate === day.value
                            const isDayToday = day.value === ymd(new Date())
                            return (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => setListDate(day.value)}
                                    className={`group flex flex-col items-center justify-center rounded-xl py-2 transition-all duration-150 ${active
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.03]'
                                        : isDayToday
                                            ? 'bg-blue-50 border-2 border-blue-300 text-blue-700 hover:bg-blue-100'
                                            : 'bg-slate-50/80 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                                        }`}
                                >
                                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${active ? 'text-blue-200' : isDayToday ? 'text-blue-400' : 'text-slate-400'
                                        }`}>
                                        {day.weekday}
                                    </span>
                                    <span className={`text-[17px] font-black tracking-tight leading-none mb-0.5 ${active ? 'text-white' : isDayToday ? 'text-blue-700' : 'text-slate-800'
                                        }`}>
                                        {day.day}
                                    </span>
                                    <span className={`text-[9px] uppercase font-bold ${active ? 'text-blue-200' : isDayToday ? 'text-blue-400' : 'text-slate-400'
                                        }`}>
                                        {day.month}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Next */}
                    <button
                        type="button"
                        onClick={() => setWeekOffset(w => w + 1)}
                        className="flex-none w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 active:scale-95 transition-all"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            {/* Status filter */}
            <div className="flex-none bg-white border-b border-slate-100 px-3 sm:px-6 py-2 z-10">
                <div className="flex items-center gap-2 justify-center">
                    {([['ALL', 'Всі'], ['BOOKED', 'Активні'], ['DONE', 'Виконані']] as const).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key as any)}
                            className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${statusFilter === key
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CALENDAR TIMELINE BODY */}
            <div className="flex-1 overflow-auto bg-slate-50 relative pb-10 scrollbar-thin">
                <div className="flex min-w-full relative mt-4 w-full justify-center">
                    {/* Time Index Column Removed for flexible Agenda View */}

                    {/* Barber Columns Wrapper */}
                    <div className="flex flex-1 rounded-tl-2xl rounded-tr-2xl bg-white border border-slate-200 shadow-sm overflow-hidden min-w-[600px] relative">
                        {bookingsLoading && displayedBarbers.length > 0 && (
                            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-[2px] rounded-t-2xl pointer-events-none transition-all duration-300">
                                <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center top-[30vh]">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600 mb-4 shadow-sm"></div>
                                    <p className="text-slate-800 font-bold text-base bg-white/60 px-4 py-1.5 rounded-full backdrop-blur-md whitespace-nowrap shadow-sm">Завантаження розкладу...</p>
                                </div>
                            </div>
                        )}
                        {(loading || barbersLoading) ? (
                            <div className="flex flex-1 w-full animate-pulse">
                                {[...Array(user?.role === 'ADMIN' ? 4 : 1)].map((_, i) => (
                                    <div key={i} className={`flex-1 min-w-[200px] flex flex-col ${i < 3 ? 'border-r border-slate-100' : ''}`}>
                                        <div className="h-12 border-b border-slate-200 bg-slate-50 relative flex items-center justify-center">
                                            <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
                                        </div>
                                        <div className="flex-1 p-4 flex flex-col gap-4 bg-slate-50/30">
                                            {[...Array(4)].map((_, j) => (
                                                <div key={j} className="flex gap-4">
                                                    <div className="w-12 shrink-0 flex flex-col items-end pt-1">
                                                        <div className="h-4 w-8 bg-slate-200 rounded"></div>
                                                    </div>
                                                    <div className="h-24 flex-1 bg-slate-100 rounded-xl border border-slate-200"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : displayedBarbers.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50/50">
                                <span className="text-4xl mb-4">📭</span>
                                <h3 className="text-lg font-bold text-slate-600">Немає графіків</h3>
                                <p className="text-sm mt-1">Виберіть інший день або працівника у фільтрах.</p>
                            </div>
                        ) : (
                            displayedBarbers.map((barber: Barber, index: number) => {
                                const bSched = bookingsData?.schedules?.[barber.id] || { isWorking: true, startHour: 8, endHour: 21 }

                                const allBarberBookings = bookings
                                    .filter(b => b.barberId === barber.id)
                                    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
                                const barberBookings = allBarberBookings
                                    .filter(b => statusFilter === 'ALL' ? (b.status === 'BOOKED' || b.status === 'DONE') : b.status === statusFilter)
                                const cancelledBookings = statusFilter === 'ALL' ? allBarberBookings.filter(b => b.status === 'CANCELLED') : []
                                const isLast = index === displayedBarbers.length - 1

                                return (
                                    <div key={barber.id} className={`flex-1 min-w-[200px] relative ${!isLast ? 'border-r border-slate-100' : ''}`}>
                                        {/* Column Header */}
                                        <div className="h-12 border-b border-slate-200 bg-slate-50/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-center shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                                                    {barber.name[0].toUpperCase()}
                                                </div>
                                                <span className="text-[14px] font-bold text-slate-800">{barber.name}</span>
                                            </div>
                                        </div>

                                        {/* Agenda List */}
                                        <div className="flex flex-col p-2 gap-2 bg-slate-50/30 flex-1 min-h-[500px]">
                                            {!bSched.isWorking ? (
                                                <div className="flex flex-col items-center justify-center flex-1 text-slate-400 text-sm font-medium opacity-50 mt-20">
                                                    <span className="text-[14px] font-bold uppercase tracking-wider text-slate-400 border border-slate-300 rounded-lg px-3 py-1 bg-slate-100">Вихідний</span>
                                                </div>
                                            ) : barberBookings.length === 0 ? (() => {
                                                const gapStartMins = bSched.startHour * 60;
                                                const gapEndMins = bSched.endHour * 60;
                                                const effectiveStartMins = isToday ? Math.max(gapStartMins, currentMins) : gapStartMins;
                                                const isBookable = !isPastDay && ((gapEndMins - effectiveStartMins) >= 15);

                                                if (!isBookable) {
                                                    return (
                                                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm font-medium mt-10 opacity-50">
                                                            <span className="text-[13px]">{isPastDay ? 'Минулий день' : 'Час минув'}</span>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div
                                                        className="flex-1 relative rounded-xl bg-slate-100/40 border-2 border-dashed border-slate-300 flex flex-col justify-center items-center py-10 transition-all hover:bg-slate-100 hover:border-slate-400 hover:shadow-sm cursor-pointer mt-1 opacity-70 hover:opacity-100"
                                                        onClick={() => {
                                                            setBarberId(barber.id);
                                                            setDate(listDate);
                                                            setStep(1);
                                                            setIsDrawerOpen(true);
                                                        }}
                                                        title="Створити запис"
                                                    >
                                                        <svg className="h-10 w-10 mb-2 text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="text-[14px] font-bold text-slate-500 mb-1">
                                                            Вільний день
                                                        </span>
                                                        <span className="text-[12px] font-medium text-slate-400">
                                                            {bSched.startHour}:00 - {bSched.endHour}:00
                                                        </span>
                                                    </div>
                                                );
                                            })() : (
                                                barberBookings.map((booking, bIdx) => {
                                                    const d = new Date(booking.startAt);

                                                    // Check for gap before this booking
                                                    let gapTime = null;
                                                    const mStart = (d.getHours() * 60) + d.getMinutes();

                                                    if (bIdx === 0) {
                                                        const shiftStart = bSched.startHour * 60;
                                                        if (mStart > shiftStart) {
                                                            const gapDuration = mStart - shiftStart;
                                                            gapTime = { startHours: bSched.startHour, startMins: 0, duration: gapDuration };
                                                        }
                                                    } else {
                                                        const prevEndD = new Date(barberBookings[bIdx - 1].endAt);
                                                        const mPrevEnd = (prevEndD.getHours() * 60) + prevEndD.getMinutes();
                                                        if (mStart > mPrevEnd) {
                                                            const gapDuration = mStart - mPrevEnd;
                                                            gapTime = { startHours: prevEndD.getHours(), startMins: prevEndD.getMinutes(), duration: gapDuration };
                                                        }
                                                    }

                                                    return (
                                                        <div key={booking.id} className="flex flex-col">
                                                            {gapTime && gapTime.duration >= 15 && (() => {
                                                                const gapStartMins = gapTime.startHours * 60 + gapTime.startMins;
                                                                const gapEndMins = gapStartMins + gapTime.duration;
                                                                const effectiveStartMins = isToday ? Math.max(gapStartMins, currentMins) : gapStartMins;
                                                                const effectiveDuration = gapEndMins - effectiveStartMins;
                                                                const isBookable = !isPastDay && (effectiveDuration >= 15);

                                                                const endMinsTotal = gapStartMins + gapTime.duration;
                                                                const endH = Math.floor(endMinsTotal / 60);
                                                                const endM = endMinsTotal % 60;

                                                                if (!isBookable) {
                                                                    return (
                                                                        <div className="flex flex-row items-center gap-2 group opacity-40 my-1">
                                                                            <div className="w-12 shrink-0 flex flex-col items-end justify-center">
                                                                                <span className="text-[11px] font-bold text-slate-400 leading-none">
                                                                                    {String(gapTime.startHours).padStart(2, '0')}:{String(gapTime.startMins).padStart(2, '0')}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex-1 h-px border-t border-dashed border-slate-300"></div>
                                                                        </div>
                                                                    );
                                                                }

                                                                const durText = gapTime.duration >= 60
                                                                    ? `${Math.floor(gapTime.duration / 60)} год${gapTime.duration % 60 > 0 ? ` ${gapTime.duration % 60} хв` : ''}`
                                                                    : `${gapTime.duration} хв`;

                                                                return (
                                                                    <div className="flex flex-row items-stretch gap-2 group opacity-70 hover:opacity-100 transition-opacity my-1">
                                                                        <div className="w-12 shrink-0 flex flex-col items-end justify-center">
                                                                            <span className="text-[12px] font-bold text-slate-400 leading-none">
                                                                                {String(gapTime.startHours).padStart(2, '0')}:{String(gapTime.startMins).padStart(2, '0')}
                                                                            </span>
                                                                            <span className="text-[10px] font-medium text-slate-400 mt-1">
                                                                                {durText}
                                                                            </span>
                                                                        </div>

                                                                        <div
                                                                            className="flex-1 relative rounded-xl bg-slate-100/40 border-2 border-dashed border-slate-300 flex flex-col justify-center items-center py-3.5 transition-all hover:bg-slate-100 hover:border-slate-400 hover:shadow-sm cursor-pointer"
                                                                            onClick={() => {
                                                                                setBarberId(barber.id);
                                                                                setDate(listDate);
                                                                                setStep(1);
                                                                                setIsDrawerOpen(true);
                                                                            }}
                                                                            title="Створити запис"
                                                                        >
                                                                            <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5">
                                                                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                                                </svg>
                                                                                Вільне вікно ({String(gapTime.startHours).padStart(2, '0')}:{String(gapTime.startMins).padStart(2, '0')} - {String(endH).padStart(2, '0')}:{String(endM).padStart(2, '0')})
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* Booking Card */}
                                                            <div className="flex flex-row items-stretch gap-2 group">
                                                                {/* Time Column (Left) */}
                                                                <div className="w-12 shrink-0 flex flex-col items-end pt-1.5">
                                                                    <span className="text-[12px] font-black text-slate-700 leading-none">
                                                                        {String(d.getHours()).padStart(2, '0')}:{String(d.getMinutes()).padStart(2, '0')}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                                        {booking.totalDuration} хв
                                                                    </span>
                                                                </div>
                                                                <div className={`flex-1 relative rounded-xl shadow-sm flex flex-col p-2.5 transition-all ${booking.status === 'DONE'
                                                                    ? 'bg-emerald-600 border border-emerald-500/50 opacity-70'
                                                                    : 'bg-blue-600 border border-blue-500/50 hover:bg-blue-700 hover:shadow-md'
                                                                    }`}>
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <p className="font-extrabold text-[13px] text-white leading-tight flex-1 whitespace-normal">
                                                                            {booking.status === 'DONE' && <span className="mr-1">✅</span>}
                                                                            {booking.clientName}
                                                                            {booking.clientPhone && (
                                                                                <span className={`block text-[11px] font-semibold mt-0.5 opacity-90 ${booking.status === 'DONE' ? 'text-emerald-200' : 'text-blue-200'}`}>{booking.clientPhone}</span>
                                                                            )}
                                                                        </p>
                                                                        {booking.status !== 'DONE' && (<>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setBookingToEdit(booking)
                                                                                    setEditBarberId(booking.barberId)
                                                                                    setPrevEditBarberId(null)
                                                                                    setEditServiceIds(booking.services.map(s => s.serviceId))
                                                                                    const d = new Date(booking.startAt)
                                                                                    setEditTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
                                                                                    setEditError(null)
                                                                                }}
                                                                                className="flex-none p-1.5 bg-white/10 text-white/70 hover:bg-amber-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                                                                title="Редагувати"
                                                                            >
                                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                                </svg>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setBookingToComplete(booking)
                                                                                    setEditBarberId(booking.barberId)
                                                                                    setEditServiceIds(booking.services.map(s => s.serviceId))
                                                                                }}
                                                                                className="flex-none p-1.5 bg-white/10 text-white/70 hover:bg-green-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                                                                title="Завершити"
                                                                            >
                                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setBookingToDelete(booking)}
                                                                                className="flex-none p-1.5 bg-white/10 text-white/70 hover:bg-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                                                                title="Видалити"
                                                                            >
                                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            </button>
                                                                        </>)}
                                                                    </div>

                                                                    <div className="mt-0.5 flex flex-wrap gap-1">
                                                                        {booking.services.map((s, si) => (
                                                                            <span key={si} className={`text-[10px] font-medium px-1.5 py-0.5 rounded border flex-none whitespace-normal ${booking.status === 'DONE'
                                                                                ? 'text-emerald-100 bg-emerald-800/40 border-emerald-500/30'
                                                                                : 'text-blue-100 bg-blue-800/40 border-blue-500/30'
                                                                                }`}>
                                                                                {s.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>

                                                                    {booking.comment && (
                                                                        <div className="mt-1.5 pt-1.5 border-t border-blue-500/50 flex items-start gap-1 text-[10px] text-blue-50 font-medium whitespace-normal">
                                                                            <svg className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
                                                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                                                            </svg>
                                                                            <span className="leading-snug">{booking.comment}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            )}

                                            {/* Optional end-of-day gap if last booking ends before 21:00 */}
                                            {barberBookings.length > 0 && (() => {
                                                const lastBooking = barberBookings[barberBookings.length - 1];
                                                const endD = new Date(lastBooking.endAt);
                                                const endM = (endD.getHours() * 60) + endD.getMinutes();
                                                const shiftEnd = bSched.endHour * 60;

                                                if (endM < shiftEnd) {
                                                    const gapDur = shiftEnd - endM;
                                                    if (gapDur >= 15) {
                                                        return (
                                                            (() => {
                                                                const gapStartMins = endM;
                                                                const gapEndMins = shiftEnd;
                                                                const effectiveStartMins = isToday ? Math.max(gapStartMins, currentMins) : gapStartMins;
                                                                const effectiveDuration = gapEndMins - effectiveStartMins;
                                                                const isBookable = !isPastDay && (effectiveDuration >= 15);

                                                                if (!isBookable) {
                                                                    return (
                                                                        <div className="flex flex-row items-center gap-2 group opacity-40 mt-1 mb-4">
                                                                            <div className="w-12 shrink-0 flex flex-col items-end justify-center">
                                                                                <span className="text-[11px] font-bold text-slate-400 leading-none">
                                                                                    {String(endD.getHours()).padStart(2, '0')}:{String(endD.getMinutes()).padStart(2, '0')}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex-1 h-px border-t border-dashed border-slate-300"></div>
                                                                        </div>
                                                                    );
                                                                }

                                                                const durText = gapDur >= 60
                                                                    ? `${Math.floor(gapDur / 60)} год${gapDur % 60 > 0 ? ` ${gapDur % 60} хв` : ''}`
                                                                    : `${gapDur} хв`;
                                                                return (
                                                                    <div className="flex flex-row items-stretch gap-2 group opacity-70 hover:opacity-100 transition-opacity mt-1 mb-4">
                                                                        <div className="w-12 shrink-0 flex flex-col items-end justify-center">
                                                                            <span className="text-[12px] font-bold text-slate-400 leading-none">
                                                                                {String(endD.getHours()).padStart(2, '0')}:{String(endD.getMinutes()).padStart(2, '0')}
                                                                            </span>
                                                                            <span className="text-[10px] font-medium text-slate-400 mt-1">
                                                                                {durText}
                                                                            </span>
                                                                        </div>

                                                                        <div
                                                                            className="flex-1 relative rounded-xl bg-slate-100/40 border-2 border-dashed border-slate-300 flex flex-col justify-center items-center py-3.5 transition-all hover:bg-slate-100 hover:border-slate-400 hover:shadow-sm cursor-pointer"
                                                                            onClick={() => {
                                                                                setBarberId(barber.id);
                                                                                setDate(listDate);
                                                                                setStep(1);
                                                                                setIsDrawerOpen(true);
                                                                            }}
                                                                            title="Створити запис"
                                                                        >
                                                                            <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5">
                                                                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                                                </svg>
                                                                                Вільне вікно ({String(endD.getHours()).padStart(2, '0')}:{String(endD.getMinutes()).padStart(2, '0')} - {bSched.endHour}:00)
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()
                                                        );
                                                    }
                                                }
                                                return null;
                                            })()}
                                        </div>


                                        {/* Cancelled bookings */}
                                        {cancelledBookings.length > 0 && (
                                            <div className="mt-4 px-2">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-400 mb-2 px-1">🚫 Видалені ({cancelledBookings.length})</p>
                                                <div className="space-y-1.5">
                                                    {cancelledBookings.map((booking) => {
                                                        const d = new Date(booking.startAt)
                                                        return (
                                                            <div key={booking.id} className="flex items-center gap-2 opacity-40">
                                                                <span className="text-[12px] font-bold text-slate-400 w-12 text-right shrink-0 line-through">{String(d.getHours()).padStart(2, '0')}:{String(d.getMinutes()).padStart(2, '0')}</span>
                                                                <div className="flex-1 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                                                                    <p className="text-[13px] font-semibold text-red-400 line-through">{booking.clientName}</p>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {booking.services.map((s, si) => (
                                                                            <span key={si} className="text-[10px] font-medium text-red-300 bg-red-100 px-1.5 py-0.5 rounded line-through">{s.name}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        <div className="pb-8" />
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* SLIDE OVER DRAWER FOR NEW APPOINTMENT */}
            <div
                className={`fixed inset-0 z-50 flex justify-end transition-all duration-200 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <div
                    className="absolute inset-0 bg-slate-900/30"
                    onClick={() => setIsDrawerOpen(false)}
                />

                <div
                    className={`relative w-full max-w-[440px] bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {/* Drawer Header */}
                    <div className="flex-none px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Новий запис</h2>
                            <p className="text-[13px] text-slate-500 font-medium mt-0.5">Заповніть деталі для створення</p>
                        </div>
                        <button
                            onClick={() => setIsDrawerOpen(false)}
                            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Progress Tabs inside Drawer */}
                    <div className="flex-none bg-slate-50/50 px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-1 w-full">
                            {visibleBreadcrumbs.map((crumb) => {
                                const active = step === crumb.key
                                const isPast = step > crumb.key
                                return (
                                    <button
                                        key={crumb.key}
                                        onClick={() => crumb.enabled && setStep(crumb.key)}
                                        disabled={!crumb.enabled}
                                        className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${active ? 'bg-white shadow-sm ring-1 ring-slate-200/60' : crumb.enabled ? 'hover:bg-white/50 cursor-pointer' : 'opacity-50 grayscale cursor-not-allowed'}`}
                                    >
                                        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold mb-1 ${active ? 'bg-blue-600 text-white' : isPast ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            {isPast ? (
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            ) : crumb.key}
                                        </div>
                                        <span className={`text-[10px] font-bold tracking-tight ${active ? 'text-blue-700' : isPast ? 'text-slate-800' : 'text-slate-500'}`}>{crumb.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Drawer Content */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-white">
                        {step === 1 && (
                            <div className="flex flex-col h-full animate-in fade-in duration-300">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Оберіть послуги</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {servicesLoading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="flex flex-col justify-between overflow-hidden rounded-2xl bg-slate-50 p-4 h-[80px] animate-pulse"></div>
                                        ))
                                    ) : services.map((service) => {
                                        const active = selectedServiceIds.includes(service.id)
                                        return (
                                            <button
                                                key={service.id}
                                                type="button"
                                                onClick={() => toggleService(service.id)}
                                                className={`group relative flex items-center justify-between overflow-hidden rounded-2xl p-4 text-left transition-all ${active ? 'bg-blue-50/50 ring-2 ring-inset ring-blue-600 shadow-sm' : 'bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300'}`}
                                            >
                                                <div className="flex flex-col pr-4">
                                                    <h4 className={`font-bold text-[14px] leading-snug transition-colors ${active ? 'text-blue-900' : 'text-slate-900'}`}>{service.name}</h4>
                                                    <span className="text-[12px] font-medium text-slate-500 mt-0.5">{service.durationMin} хв</span>
                                                </div>
                                                <div className={`shrink-0 flex items-center justify-center rounded-xl px-2.5 py-1.5 text-[13px] font-bold ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                                    {formatCurrency(service.price)}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}



                        {step === 4 && (
                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Оберіть час</h3>
                                {slotsLoading ? (
                                    <div className="p-8"><PageLoader message="..." /></div>
                                ) : slots.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">Немає вільних годин</div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2">
                                        {slots.map((slot) => {
                                            const active = selectedTime === slot.time
                                            return (
                                                <button
                                                    key={slot.time}
                                                    type="button"
                                                    onClick={() => { setSelectedTime(slot.time); setStep(5) }}
                                                    className={`flex items-center justify-center rounded-xl py-3 text-[14px] font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-transparent scale-105' : 'bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 text-slate-700'}`}
                                                >
                                                    {slot.time}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 5 && (
                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Дані клієнта</h3>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Ім'я</label>
                                        <input
                                            type="text"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            placeholder="Олександр"
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Номер телефону</label>
                                        <input
                                            type="text"
                                            value={clientPhone}
                                            onChange={(e) => setClientPhone(e.target.value)}
                                            placeholder="+380 99 123 45 67"
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Коментар</label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="min-h-[80px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>

                                    {error && (
                                        <div className="rounded-xl bg-red-50 p-3 border border-red-100">
                                            <p className="text-sm font-medium text-red-800">{error}</p>
                                        </div>
                                    )}

                                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 mt-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-500">До сплати</span>
                                            <span className="text-xl font-black text-slate-900">{formatCurrency(totalPrice)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Drawer Footer Actions */}
                    <div className="flex-none bg-white p-6 border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                        {step === 1 && (
                            <button
                                type="button"
                                onClick={() => setStep(4)}
                                disabled={!hasServices}
                                className="w-full flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3.5 text-[15px] font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
                            >
                                Продовжити
                            </button>
                        )}
                        {step === 4 && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 rounded-xl bg-slate-100 font-bold text-slate-700 py-3.5 hover:bg-slate-200"
                                >
                                    Назад
                                </button>
                            </div>
                        )}
                        {step === 5 && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(4)}
                                    className="flex-1 rounded-xl bg-slate-100 font-bold text-slate-700 py-3.5 hover:bg-slate-200"
                                >
                                    Назад
                                </button>
                                <button
                                    onClick={createBooking}
                                    disabled={isCreating}
                                    className="flex-[2] rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 flex items-center justify-center gap-2"
                                >
                                    {isCreating && <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                    Створити запис
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={Boolean(bookingToDelete)}
                title="Підтвердьте видалення запису"
                description={
                    bookingToDelete
                        ? `Запис ${bookingToDelete.clientName} на ${new Date(bookingToDelete.startAt).toLocaleTimeString('uk-UA', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })} буде видалений.`
                        : ''
                }
                confirmText="Видалити"
                cancelText="Скасувати"
                tone="danger"
                isLoading={isDeleting}
                onClose={() => setBookingToDelete(null)}
                onConfirm={deleteBooking}
            />

            {/* COMPLETE BOOKING MODAL */}
            {bookingToComplete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-900/40" onClick={() => setBookingToComplete(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Завершити запис</h3>
                                <p className="text-[13px] text-slate-500 mt-0.5">{bookingToComplete.clientName} • {new Date(bookingToComplete.startAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <button onClick={() => setBookingToComplete(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Barber selector */}
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-2">Майстер</label>
                                <select
                                    value={editBarberId || ''}
                                    onChange={(e) => {
                                        setEditBarberId(Number(e.target.value))
                                        setPrevEditBarberId(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-[14px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    {allBarbers.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Services */}
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-2">Послуги</label>
                                {editServicesLoading ? (
                                    <div className="flex items-center justify-center py-6 text-slate-400">
                                        <svg className="h-5 w-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span className="text-[13px] font-medium">Завантаження послуг…</span>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                                        {editBarberServices.map((service: Service) => {
                                            const isSelected = editServiceIds.includes(service.id)
                                            return (
                                                <button
                                                    key={service.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setEditServiceIds(prev =>
                                                            isSelected
                                                                ? prev.filter(id => id !== service.id)
                                                                : [...prev, service.id]
                                                        )
                                                    }}
                                                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${isSelected
                                                        ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <span className={`text-[14px] font-semibold block ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{service.name}</span>
                                                        <span className="text-[12px] text-slate-400">{service.durationMin} хв • {formatCurrency(service.price)}</span>
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
                                <label className="block text-[13px] font-bold text-slate-700 mb-2">Косметика</label>
                                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                                    {inventoryItems.length === 0 && (
                                        <p className="text-[13px] text-slate-400 italic py-2">Немає товарів на складі</p>
                                    )}
                                    {inventoryItems.map((item) => {
                                        const entry = editCosmeticsItems.find(c => c.itemId === item.id)
                                        const qty = entry?.quantity || 0
                                        return (
                                            <div
                                                key={item.id}
                                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${qty > 0 ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200' : 'bg-white border-slate-200'
                                                    }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <span className={`text-[14px] font-semibold block ${qty > 0 ? 'text-emerald-700' : 'text-slate-700'}`}>{item.shortName}</span>
                                                    <span className="text-[12px] text-slate-400">{formatCurrency(item.price)} • залишок: {item.quantity}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (qty <= 0) return
                                                            setEditCosmeticsItems(prev =>
                                                                qty === 1
                                                                    ? prev.filter(c => c.itemId !== item.id)
                                                                    : prev.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity - 1 } : c)
                                                            )
                                                        }}
                                                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[16px] font-bold transition-all ${qty > 0 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-300'
                                                            }`}
                                                    >
                                                        −
                                                    </button>
                                                    <span className={`w-6 text-center text-[14px] font-bold ${qty > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>{qty}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (qty >= item.quantity) return
                                                            setEditCosmeticsItems(prev => {
                                                                const existing = prev.find(c => c.itemId === item.id)
                                                                if (existing) {
                                                                    return prev.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c)
                                                                }
                                                                return [...prev, { itemId: item.id, quantity: 1 }]
                                                            })
                                                        }}
                                                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[16px] font-bold transition-all ${qty < item.quantity ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-300'
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
                                        onClick={() => setEditPaymentMethod('CASH')}
                                        className={`flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all border ${editPaymentMethod === 'CASH'
                                            ? 'bg-green-600 text-white border-green-600 shadow-md'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        💵 Готівка
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditPaymentMethod('CARD')}
                                        className={`flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all border ${editPaymentMethod === 'CARD'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        💳 Картка
                                    </button>
                                </div>
                            </div>

                            {/* Summary */}
                            {(() => {
                                const svcTotal = editBarberServices.filter((s: Service) => editServiceIds.includes(s.id)).reduce((sum: number, s: Service) => sum + s.price, 0)
                                const cosTotal = editCosmeticsItems.reduce((sum, c) => {
                                    const item = inventoryItems.find(i => i.id === c.itemId)
                                    return sum + (item ? item.price * c.quantity : 0)
                                }, 0)
                                const grandTotal = svcTotal + cosTotal
                                if (grandTotal <= 0) return null
                                return (
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1">
                                        {svcTotal > 0 && (
                                            <div className="flex justify-between text-[13px]">
                                                <span className="text-slate-500 font-medium">Послуги ({editServiceIds.length}):</span>
                                                <span className="font-bold text-slate-800">{formatCurrency(svcTotal)}</span>
                                            </div>
                                        )}
                                        {cosTotal > 0 && (
                                            <div className="flex justify-between text-[13px]">
                                                <span className="text-slate-500 font-medium">Косметика:</span>
                                                <span className="font-bold text-emerald-700">{formatCurrency(cosTotal)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-[14px] pt-1 border-t border-slate-200">
                                            <span className="text-slate-700 font-bold">Всього:</span>
                                            <span className="font-black text-slate-900">{formatCurrency(grandTotal)}</span>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Error */}
                            {completeError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-700 font-medium">
                                    {completeError}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-white">
                            <button
                                onClick={() => setBookingToComplete(null)}
                                className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={completeBooking}
                                disabled={isCompleting || editServiceIds.length === 0}
                                className="flex-[2] py-3 rounded-xl bg-green-600 font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-green-500/20"
                            >
                                {isCompleting && <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                Завершити
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Booking Modal */}
            {bookingToEdit && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-900/40" onClick={() => setBookingToEdit(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Редагувати запис</h3>
                                <p className="text-[13px] text-slate-500 mt-0.5">{bookingToEdit.clientName} • {new Date(bookingToEdit.startAt).toLocaleDateString('uk-UA')}</p>
                            </div>
                            <button onClick={() => setBookingToEdit(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Time */}
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-2">Час початку</label>
                                {editServiceIds.length === 0 ? (
                                    <p className="text-[13px] text-slate-400 italic">Оберіть послуги для вибору часу</p>
                                ) : editSlotsLoading ? (
                                    <div className="flex items-center justify-center py-6 text-slate-400">
                                        <svg className="h-5 w-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span className="text-[13px] font-medium">Завантаження слотів…</span>
                                    </div>
                                ) : editSlots.length === 0 ? (
                                    <p className="text-[13px] text-slate-400 italic">Немає вільних годин</p>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                                        {editSlots.map((slot) => {
                                            const active = editTime === slot.time
                                            return (
                                                <button
                                                    key={slot.time}
                                                    type="button"
                                                    onClick={() => setEditTime(slot.time)}
                                                    className={`flex items-center justify-center rounded-xl py-2.5 text-[14px] font-bold transition-all ${active ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25 ring-2 ring-transparent scale-105' : 'bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 text-slate-700'}`}
                                                >
                                                    {slot.time}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Barber */}
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-2">Майстер</label>
                                <select
                                    value={editBarberId || ''}
                                    onChange={(e) => {
                                        setEditBarberId(Number(e.target.value))
                                        setPrevEditBarberId(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-[14px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                >
                                    {allBarbers.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Services */}
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-2">Послуги</label>
                                {editServicesLoading ? (
                                    <div className="flex items-center justify-center py-6 text-slate-400">
                                        <svg className="h-5 w-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span className="text-[13px] font-medium">Завантаження послуг…</span>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                                        {editBarberServices.map((service: Service) => {
                                            const isSelected = editServiceIds.includes(service.id)
                                            return (
                                                <button
                                                    key={service.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setEditServiceIds(prev =>
                                                            isSelected
                                                                ? prev.filter(id => id !== service.id)
                                                                : [...prev, service.id]
                                                        )
                                                    }}
                                                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${isSelected
                                                        ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200'
                                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <span className={`text-[14px] font-semibold block ${isSelected ? 'text-amber-700' : 'text-slate-700'}`}>{service.name}</span>
                                                        <span className="text-[12px] text-slate-400">{service.durationMin} хв • {formatCurrency(service.price)}</span>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-amber-600 border-amber-600' : 'border-slate-300'
                                                        }`}>
                                                        {isSelected && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Error */}
                            {editError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-700 font-medium">
                                    {editError}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-white">
                            <button
                                onClick={() => setBookingToEdit(null)}
                                className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={saveBookingEdit}
                                disabled={isSaving || editServiceIds.length === 0}
                                className="flex-[2] py-3 rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                            >
                                {isSaving && <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                Зберегти
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
