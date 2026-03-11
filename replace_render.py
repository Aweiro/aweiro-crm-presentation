import re

with open('src/app/appointments/page.tsx', 'r') as f:
    content = f.read()

# Find the split point
split_marker = "if (loading) {\n\t\treturn <PageLoader message=\"Завантаження записів…\" />\n\t}\n"
parts = content.split(split_marker)

if len(parts) != 2:
    print("Failed to find split marker exactly once.")
    exit(1)

new_render = """
const displayedBarbers = user?.role === 'ADMIN' && listBarberId
? allBarbers.filter(b => b.id === listBarberId)
: (user?.role === 'ADMIN' ? allBarbers : barbers.filter(b => b.id === user?.id))

const START_HOUR = 8
const END_HOUR = 21
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
const PIXELS_PER_MINUTE = 2 // 1 hour = 120 pixels

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
                        onClick={() => {
                            setStep(1)
                            setIsDrawerOpen(true)
                        }}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                    >
                        + Новий запис
                    </button>
                </div>
</div>

{/* DATE NAVIGATOR STRIP */}
<div className="flex-none bg-white border-b border-slate-100 px-2 sm:px-6 py-3 shadow-sm z-10">
<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
{calendarDays.map((day) => {
const active = listDate === day.value
return (
<button
key={day.value}
type="button"
onClick={() => setListDate(day.value)}
className={`group flex min-w-[70px] flex-col items-center justify-center rounded-2xl py-2 transition-all shrink-0 ${
active
? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-1 scale-105'
: 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
}`}
>
<span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${active ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-500'}`}>
{day.weekday}
</span>
<span className="text-[18px] font-black tracking-tight leading-none mb-1">
{day.day}
</span>
<span className={`text-[9px] uppercase font-bold ${active ? 'text-blue-100' : 'text-slate-400'}`}>
{day.month}
</span>
</button>
)
})}
</div>
</div>

{/* CALENDAR TIMELINE BODY */}
<div className="flex-1 overflow-auto bg-slate-50 relative pb-10 scrollbar-thin">
<div className="flex min-w-max relative mt-4">
{/* Time Index Column */}
<div className="w-16 flex-none bg-slate-50 sticky left-0 z-20 pointer-events-none">
{HOURS.map(hour => (
<div
key={hour}
className="relative"
style={{ height: `${60 * PIXELS_PER_MINUTE}px` }}
>
<span className="absolute -top-2.5 right-2 text-[12px] font-bold text-slate-400 bg-slate-50 pl-1 leading-none z-10">
{String(hour).padStart(2, '0')}:00
</span>
</div>
))}
</div>

{/* Barber Columns Wrapper */}
<div className="flex flex-1 rounded-tl-2xl rounded-tr-2xl bg-white border border-slate-200 shadow-sm mr-6 overflow-hidden min-w-[600px]">
{displayedBarbers.map((barber, index) => {
const barberBookings = bookings.filter(b => b.barberId === barber.id)
const isLast = index === displayedBarbers.length - 1

return (
<div key={barber.id} className={`flex-1 min-w-[200px] relative ${!isLast ? 'border-r border-slate-100' : ''}`}>
{/* Column Header */}
<div className="h-12 border-b border-slate-200 bg-slate-50/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-center shadow-sm">
<div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                                                {barber.name[0].toUpperCase()}
                                            </div>
                                            <span className="text-[14px] font-bold text-slate-800">{barber.name}</span>
                                        </div>
</div>

{/* Background Grid Lines */}
<div className="relative">
{HOURS.map(hour => (
<div
key={hour}
className="border-b border-slate-100"
style={{ height: `${60 * PIXELS_PER_MINUTE}px` }}
>
                                                {/* Half-hour dashed line */}
                                                <div className="absolute w-full border-b border-dashed border-slate-100" style={{ marginTop: `${30 * PIXELS_PER_MINUTE}px` }}></div>
                                            </div>
))}

{/* Bookings */}
{barberBookings.map(booking => {
const d = new Date(booking.startAt)
const hoursInt = d.getHours()
const minutesInt = d.getMinutes()
const totalMinutesFromStart = (hoursInt - START_HOUR) * 60 + minutesInt

const top = totalMinutesFromStart * PIXELS_PER_MINUTE
const height = booking.totalDuration * PIXELS_PER_MINUTE

if (hoursInt < START_HOUR || hoursInt > END_HOUR) return null

return (
<div
key={booking.id}
className="absolute left-1 right-1 rounded-xl bg-blue-50 border border-blue-200/60 shadow-sm overflow-hidden p-2 group hover:z-30 transition-all hover:shadow-md hover:border-blue-300 hover:ring-1 hover:ring-blue-300"
style={{ top: `${top}px`, height: `${height}px` }}
>
                                                    {/* Color strip on the left */}
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl"></div>

                                                    <div className="flex flex-col h-full relative pl-2">
<div className="flex justify-between items-start mb-0.5">
<p className="font-bold text-[13px] text-slate-900 leading-tight truncate pr-4">
{booking.clientName}
</p>
<button
onClick={() => setBookingToDelete(booking)}
className="absolute -top-1 -right-1 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-bl-lg rounded-tr-lg z-10"
title="Видалити"
>
<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
</svg>
</button>
</div>
<p className="text-[10px] font-bold tracking-wide text-blue-600 uppercase mb-1">
{hoursInt.toString().padStart(2, '0')}:{minutesInt.toString().padStart(2, '0')} - { booking.totalDuration }хв
</p>
<p className="text-[11px] font-medium text-slate-600 line-clamp-2 leading-snug">
{booking.services.map(s => s.name).join(', ')}
</p>
                                                        {booking.comment && (
                                                            <div className="mt-auto pt-1 flex items-center gap-1 text-[10px] text-amber-600 font-medium truncate">
                                                                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span className="truncate">{booking.comment}</span>
                                                            </div>
                                                        )}
</div>
</div>
)
})}
</div>
</div>
)
})}
</div>
</div>
</div>

{/* SLIDE OVER DRAWER FOR NEW APPOINTMENT */}
            <div 
                className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <div 
                    className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" 
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
                    <div className="flex-none bg-slate-50/50 p-4 border-b border-slate-100">
                        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide">
                            {visibleBreadcrumbs.map((crumb) => {
                                const active = step === crumb.key
                                const isPast = step > crumb.key
                                return (
                                    <button
                                        key={crumb.key}
                                        onClick={() => crumb.enabled && setStep(crumb.key)}
                                        disabled={!crumb.enabled}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[64px] transition-colors ${active ? 'bg-white shadow-sm ring-1 ring-slate-200/60' : crumb.enabled ? 'hover:bg-white/50 cursor-pointer' : 'opacity-50 grayscale cursor-not-allowed'}`}
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

                        {step === 2 && (
                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Оберіть майстра</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {barbersLoading ? (
                                        <div className="p-8 text-center"><PageLoader message="..." /></div>
                                    ) : barbers.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500">Немає майстрів для обраних послуг</div>
                                    ) : barbers.map((barber) => {
                                        const active = barberId === barber.id
                                        return (
                                            <button
                                                key={barber.id}
                                                type="button"
                                                onClick={() => { setSelectedTime(''); setBarberId(barber.id); setStep(3) }}
                                                className={`flex items-center gap-4 rounded-2xl p-4 text-left transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-transparent' : 'bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50'}`}
                                            >
                                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold text-lg shadow-sm transition-colors ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                    {barber.name[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[16px]">{barber.name}</span>
                                                    <span className={`text-[13px] font-medium ${active ? 'text-blue-100' : 'text-slate-500'}`}>Майстер</span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Оберіть день</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {calendarDays.map((day) => {
                                        const active = date === day.value
                                        return (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => { setSelectedTime(''); setDate(day.value); setStep(4) }}
                                                className={`flex flex-col items-center justify-center rounded-2xl py-3 transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-transparent scale-105' : 'bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50 text-slate-700'}`}
                                            >
                                                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${active ? 'text-blue-100' : 'text-slate-400'}`}>{day.weekday}</span>
                                                <span className="text-[20px] font-black tracking-tight leading-none mb-1">{day.day}</span>
                                                <span className={`text-[9px] uppercase font-bold ${active ? 'text-blue-100' : 'text-slate-500'}`}>{day.month}</span>
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
                                onClick={() => setStep(2)}
                                disabled={!hasServices}
                                className="w-full flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3.5 text-[15px] font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
                            >
                                Продовжити
                            </button>
                        )}
                        {step > 1 && step < 5 && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep((s) => s - 1 as any)}
                                    className="flex-1 rounded-xl bg-slate-100 font-bold text-slate-700 py-3.5 hover:bg-slate-200"
                                >
                                    Назад
                                </button>
                                <button
                                    onClick={() => setStep((s) => s + 1 as any)}
                                    className="flex-[2] rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
                                >
                                    Далі
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
</main>
)
}
"""

with open('src/app/appointments/page.tsx', 'w') as f:
    f.write(parts[0] + split_marker + new_render)

print("Done writing to page.tsx.")
