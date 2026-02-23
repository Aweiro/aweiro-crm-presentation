'use client'

import { useRouter } from 'next/navigation'

type Props = {
	employee: {
		id: number
		name: string
	}
	disabled?: boolean
}

export default function EmployeeButton({ employee, disabled }: Props) {
	const router = useRouter()
	const initial = employee.name?.trim()?.charAt(0)?.toUpperCase() || 'К'

	return (
		<button
			onClick={() => {
				if (!disabled) {
					router.push(
						`/payment?user=${employee.id}&userName=${encodeURIComponent(employee.name)}`
					)
				}
			}}
			disabled={disabled}
			className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 ${
				disabled
					? 'cursor-not-allowed border-slate-200 bg-slate-100/80 text-slate-400 opacity-70'
					: 'cursor-pointer border-slate-200 bg-white text-slate-900 shadow-sm hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg active:translate-y-0'
			}`}
		>
			<div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/50 blur-2xl" />
			<div className="relative flex items-center gap-3">
				<div
					className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold ${
						disabled
							? 'bg-slate-200 text-slate-500'
							: 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
					}`}
				>
					{initial}
				</div>
				<div className="min-w-0">
					<p className="truncate text-base font-bold">{employee.name}</p>
					<p
						className={`text-xs ${
							disabled ? 'text-slate-500' : 'text-slate-500 group-hover:text-slate-600'
						}`}
					>
						Натисніть для платежу
					</p>
				</div>
				<div
					className={`ml-auto text-lg transition-transform ${
						disabled ? 'text-slate-400' : 'text-blue-600 group-hover:translate-x-0.5'
					}`}
				>
					→
				</div>
			</div>

			{disabled ? (
				<div className="relative mt-3 rounded-lg border border-slate-200 bg-slate-200/60 px-2 py-1 text-xs font-semibold text-slate-500">
					Зміна закрита
				</div>
			) : null}
		</button>
	)
}
