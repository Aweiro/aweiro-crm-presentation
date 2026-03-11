import re

files_to_fix = [
    'src/app/book/page.tsx',
    'src/app/appointments/page.tsx'
]

replacement_build = """function buildCalendarDays(startOffset = 0, length = 14): CalendarDay[] {
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
}"""

for file_path in files_to_fix:
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Replace buildCalendarDays
    content = re.sub(r'function buildCalendarDays\(length(.*?)\{(.*?)\n\}', replacement_build, content, flags=re.DOTALL)
    
    with open(file_path, 'w') as f:
        f.write(content)

print("buildCalendarDays updated.")
