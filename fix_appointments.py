import re

file_path = 'src/app/appointments/page.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# Add useRef import
if "import { useEffect, useMemo, useState, useRef } from 'react'" not in content:
    content = content.replace(
        "import { useEffect, useMemo, useState } from 'react'",
        "import { useEffect, useMemo, useState, useRef } from 'react'"
    )

# 1. Remove dateOffset
content = content.replace("const [dateOffset, setDateOffset] = useState(0)\n", "")

# 2. Update calendarDays to 60 days
content = content.replace(
    "const calendarDays = useMemo(() => buildCalendarDays(dateOffset, 14), [dateOffset])",
    "const calendarDays = useMemo(() => buildCalendarDays(0, 60), [])"
)

# 3. Add stripRef
if "const stripRef = useRef<HTMLDivElement>(null)" not in content:
    content = content.replace(
        "const calendarDays = useMemo(() => buildCalendarDays(0, 60), [])\n",
        "const calendarDays = useMemo(() => buildCalendarDays(0, 60), [])\n\tconst stripRef = useRef<HTMLDivElement>(null)\n"
    )

# 4. Modify strip Prev/Next
content = content.replace(
    '<button type="button" onClick={() => setDateOffset(prev => prev - 14)} className="flex-none p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all shadow-sm z-20 relative">',
    '<button type="button" onClick={() => stripRef.current?.scrollBy({ left: -300, behavior: \'smooth\' })} className="flex-none p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all shadow-sm z-20 relative">'
)
content = content.replace(
    '<button type="button" onClick={() => setDateOffset(prev => prev + 14)} className="flex-none p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all shadow-sm z-20 relative">',
    '<button type="button" onClick={() => stripRef.current?.scrollBy({ left: 300, behavior: \'smooth\' })} className="flex-none p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all shadow-sm z-20 relative">'
)

# Add ref to strip
content = content.replace(
    '<div className="flex gap-2 overflow-x-auto pb-1 pt-1 px-1 scrollbar-hide flex-1">',
    '<div ref={stripRef} className="flex gap-2 overflow-x-auto pb-1 pt-1 px-1 scrollbar-hide flex-1">'
)

# 5. Modify Step 3 (remove Prev/Next)
# We completely strip out the Prev/Next buttons in Step 3
old_step3_header = """                                <div className="flex items-center justify-between mb-4 mt-1">
                                    <h3 className="text-lg font-bold text-slate-900">Оберіть день</h3>
                                    <div className="flex gap-1.5">
                                        <button type="button" onClick={() => setDateOffset(prev => prev - 14)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                        </button>
                                        <button type="button" onClick={() => setDateOffset(prev => prev + 14)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                </div>"""
new_step3_header = """                                <h3 className="text-lg font-bold text-slate-900 mb-4 mt-1">Оберіть день</h3>"""
content = content.replace(old_step3_header, new_step3_header)

# 6. Remove scale-105 active styling to prevent clipping in both places
content = content.replace(
    "? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-1 scale-105 z-10 relative'",
    "? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2 z-10 relative'"
)
content = content.replace(
    "? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-transparent scale-105'",
    "? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2'"
)

with open(file_path, 'w') as f:
    f.write(content)

print("Fixed appointments calendar")
