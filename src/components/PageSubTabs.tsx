'use client'

import { ReactNode } from 'react'

type SubTabItem = {
	key: string
	label: ReactNode
}

type PageSubTabsProps = {
	items: SubTabItem[]
	activeKey: string
	onChange: (key: string) => void
	className?: string
}

export default function PageSubTabs({
	items,
	activeKey,
	onChange,
	className = ''
}: PageSubTabsProps) {
	return (
		<div
			className={`p-1.5 rounded-2xl bg-slate-900/5 backdrop-blur-md border border-slate-200 overflow-x-auto no-scrollbar ${className}`.trim()}
		>
			<div className="flex min-w-max items-center gap-1">
				{items.map((item) => {
					const isActive = item.key === activeKey
					return (
						<button
							key={item.key}
							type="button"
							onClick={() => onChange(item.key)}
							className={`relative rounded-[14px] px-6 py-2.5 text-sm font-black transition-all duration-300 whitespace-nowrap ${isActive
								? 'bg-white text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.08)] scale-[1.02]'
								: 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
								}`}
						>
							{item.label}
						</button>
					)
				})}
			</div>
		</div>
	)
}
