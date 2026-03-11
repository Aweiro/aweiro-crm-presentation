import re

files_to_fix = [
    'src/app/book/page.tsx',
    'src/app/appointments/page.tsx'
]

for file_path in files_to_fix:
    with open(file_path, 'r') as f:
        content = f.read()
    
    # 1. Add dateOffset state and update calendarDays useMemo
    state_hook = "const [dateOffset, setDateOffset] = useState(0)\n\tconst calendarDays = useMemo(() => buildCalendarDays(dateOffset, 14), [dateOffset])"
    content = re.sub(r'const calendarDays = useMemo\(\(\) => buildCalendarDays\(.*?\), \[\]\)', state_hook, content)

    # 2. Fix Step 3 (Calendar Days Grid) clipping
    # Find the step 3 block
    if "step === 3" in content:
        # We need to change the grid to have enough padding to not clip the scale-105 active item.
        # old: <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
        # new: <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2 p-1">
        content = content.replace(
            '<div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">',
            '<div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2 p-1">'
        )
        content = content.replace(
            '<div className="grid grid-cols-4 gap-2">',
            '<div className="grid grid-cols-4 gap-2 p-1">'
        )
        
        # Add Prev / Next buttons to the Step 3 Header
        step3_header_old = '<p className="mt-1 mb-6 text-sm text-slate-500">Графік майстра на найближчі 14 днів</p>'
        step3_header_new = '''<div className="mt-1 mb-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">Оберіть зручну для вас дату</p>
            <div className="flex gap-1.5">
                <button type="button" onClick={() => setDateOffset(prev => prev - 7)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button type="button" onClick={() => setDateOffset(prev => prev + 7)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>'''
        content = content.replace(step3_header_old, step3_header_new)

    # 3. Fix Horizontal Selector clipping (Appointments page only)
    if "overflow-x-auto pb-1 scrollbar-hide" in content:
        # old: <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        # new: <div className="mb-6 flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide"> + add Prev/Next
        content = content.replace(
            '<div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">',
            '''<div className="mb-6 flex items-center gap-2">
    <button type="button" onClick={() => setDateOffset(prev => prev - 7)} className="flex-none p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
    </button>
    <div className="flex gap-2 overflow-x-auto pb-2 pt-1 px-1 scrollbar-hide flex-1">'''
        )
        
        # Close the div that we just opened above instead of closing the single div
        # Find the end of calendarDays.map inside Horizontal Selector
        # This is tricky with simple replace, let's use regex
        horizontal_grid_pattern = r'(\<div className="flex gap-2 overflow-x-auto pb-2 pt-1 px-1 scrollbar-hide flex-1"\>.*?\}\)\}\n\s*\<\/div\>)'
        
        new_horizontal_grid = r'\1\n\t\t\t\t<button type="button" onClick={() => setDateOffset(prev => prev + 7)} className="flex-none p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">\n\t\t\t\t\t<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>\n\t\t\t\t</button>\n\t\t\t</div>'
        
        content = re.sub(horizontal_grid_pattern, new_horizontal_grid, content, flags=re.DOTALL)

    # Fix horizontal clipping on the top horizontal list in appointments by adding pt-1 px-1
    content = content.replace(
        `className={"group flex min-w-[70px] flex-col items-center justify-center rounded-2xl py-2 transition-all shrink-0 ${`,
        `className={"group flex min-w-[70px] flex-col items-center justify-center rounded-2xl py-2 transition-all shrink-0 ${`
    )

    with open(file_path, 'w') as f:
        f.write(content)

print("UI fixes applied.")
