import re

file_path = 'src/app/book/page.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Bring back dateOffset state to /book
content = content.replace(
    "const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)\n\tconst calendarDays = useMemo(() => buildCalendarDays(0, 60), [])",
    "const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)\n\tconst [dateOffset, setDateOffset] = useState(0)\n\tconst calendarDays = useMemo(() => buildCalendarDays(dateOffset, 14), [dateOffset])"
)

# 2. Add Prev/Next buttons to step 3 header
old_step_3_header = """\t\t\t\t\t\t\t\t<div className="flex-none">
\t\t\t\t\t\t\t\t\t<h2 className="text-xl font-bold text-slate-900">Оберіть день</h2>
\t\t\t\t\t\t\t\t\t<p className="mt-1 mb-6 text-sm text-slate-500">Графік майстра на найближчі дні</p>
\t\t\t\t\t\t\t\t</div>"""
new_step_3_header = """\t\t\t\t\t\t\t\t<div className="flex-none">
\t\t\t\t\t\t\t\t\t<h2 className="text-xl font-bold text-slate-900">Оберіть день</h2>
\t\t\t\t\t\t\t\t\t<div className="mt-1 mb-6 flex items-center justify-between">
\t\t\t\t\t\t\t\t\t\t<p className="text-sm text-slate-500">Графік майстра на найближчі дні</p>
\t\t\t\t\t\t\t\t\t\t<div className="flex gap-1.5 ml-4">
\t\t\t\t\t\t\t\t\t\t\t<button type="button" onClick={() => setDateOffset(prev => prev - 14)} disabled={dateOffset <= 0} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:pointer-events-none">
\t\t\t\t\t\t\t\t\t\t\t\t<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
\t\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t\t\t<button type="button" onClick={() => setDateOffset(prev => prev + 14)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
\t\t\t\t\t\t\t\t\t\t\t\t<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
\t\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</div>"""
content = content.replace(old_step_3_header, new_step_3_header)

with open(file_path, 'w') as f:
    f.write(content)

print("Restored Prev/Next pagination to /book.")
