import re

files_to_fix = [
    'src/app/book/page.tsx',
    'src/app/appointments/page.tsx'
]

for file_path in files_to_fix:
    with open(file_path, 'r') as f:
        content = f.read()

    # 1. Disable past dates offset in /book (only if it's the public page, offset should not go below 0)
    # Actually wait, we can just disable the prev button if dateOffset <= 0
    if 'PublicBookingPage' in content:
        content = content.replace(
            '<button type="button" onClick={() => setDateOffset(prev => prev - 7)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">',
            '<button type="button" onClick={() => setDateOffset(prev => prev - 14)} disabled={dateOffset <= 0} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:pointer-events-none">'
        )
        content = content.replace(
            '<button type="button" onClick={() => setDateOffset(prev => prev + 7)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">',
            '<button type="button" onClick={() => setDateOffset(prev => prev + 14)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">'
        )
        
    # Same logic for the Admin Drawer (which matches PublicBookingPage exactly in structure)
    if 'AppointmentsPage' in content:
        # Drawer grid prev/next (14 items visible)
        content = content.replace(
            '<button type="button" onClick={() => setDateOffset(prev => prev - 7)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">',
            '<button type="button" onClick={() => setDateOffset(prev => prev - 14)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">'
        )
        content = content.replace(
            '<button type="button" onClick={() => setDateOffset(prev => prev + 7)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">',
            '<button type="button" onClick={() => setDateOffset(prev => prev + 14)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">'
        )
        # Horizontal strip prev/next (approx 14 items visible on desktop)
        content = content.replace(
            '<button type="button" onClick={() => setDateOffset(prev => prev - 7)} className="flex-none p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all shadow-sm">',
            '<button type="button" onClick={() => setDateOffset(prev => prev - 14)} className="flex-none p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all shadow-sm z-20 relative">'
        )
        content = content.replace(
            '<button type="button" onClick={() => setDateOffset(prev => prev + 7)} className="flex-none p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all shadow-sm">',
            '<button type="button" onClick={() => setDateOffset(prev => prev + 14)} className="flex-none p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all shadow-sm z-20 relative">'
        )
        # Fix z-index of the scale-105 active item so it doesn't hide behind locks (add relative z-10)
        content = content.replace(
            "? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-1 scale-105'",
            "? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-1 scale-105 z-10 relative'"
        )

        # 2. Fix the aesthetic of the booking cards (remove left unpolished border, add better contrast)
        content = content.replace(
            'className="absolute left-1 right-1 rounded-xl bg-blue-50 border border-blue-200/60 shadow-sm overflow-hidden p-2 group hover:z-30 transition-all hover:shadow-md hover:border-blue-300 hover:ring-1 hover:ring-blue-300"',
            'className="absolute left-1 right-1 rounded-[10px] bg-blue-50/90 backdrop-blur-sm border border-blue-200 shadow-sm overflow-hidden p-[7px] group hover:z-30 transition-all hover:shadow-md hover:bg-blue-100/90 z-20"'
        )
        # Adjust text logic inside booking card
        content = content.replace(
            '<p className="font-bold text-[13px] text-slate-900 leading-tight truncate pr-4">',
            '<p className="font-extrabold text-[12px] text-slate-900 leading-tight truncate pr-4">'
        )
        content = content.replace(
            '<p className="text-[10px] font-bold tracking-wide text-blue-600 uppercase mb-1">',
            '<p className="text-[10px] font-bold tracking-tight text-blue-700 uppercase mb-0.5">'
        )

    with open(file_path, 'w') as f:
        f.write(content)

print("Date offset and aesthetics fixed.")
