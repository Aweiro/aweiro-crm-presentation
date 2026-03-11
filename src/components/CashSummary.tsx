'use client'

import { formatCurrency } from '@/lib/currency'
import {
	Wallet,
	ArrowDownRight,
	ArrowUpRight,
	TrendingUp,
	Receipt,
	Lock
} from 'lucide-react'

export default function CashSummary({ summary }: any) {
	if (!summary) return null

	const dayIncome = summary.cashIncome + summary.cardIncome

	const statCards = [
		{
			label: 'Каса на старт',
			value: summary.cashStart,
			icon: Wallet,
			color: 'text-blue-600',
			bg: 'bg-blue-50',
			border: 'border-blue-100'
		},
		{
			label: 'Готівка',
			value: summary.cashIncome,
			prefix: '+',
			icon: ArrowUpRight,
			color: 'text-emerald-600',
			bg: 'bg-emerald-50',
			border: 'border-emerald-100'
		},
		{
			label: 'Карта',
			value: summary.cardIncome,
			prefix: '+',
			icon: ArrowUpRight,
			color: 'text-purple-600',
			bg: 'bg-purple-50',
			border: 'border-purple-100'
		},
		{
			label: 'Дохід за день',
			value: dayIncome,
			prefix: '+',
			icon: TrendingUp,
			color: 'text-indigo-600',
			bg: 'bg-indigo-50',
			border: 'border-indigo-100'
		},
		{
			label: 'Витрати',
			value: summary.expenses,
			prefix: '-',
			icon: ArrowDownRight,
			color: 'text-red-500',
			bg: 'bg-red-50',
			border: 'border-red-100'
		},
		{
			label: 'Каса на закриття',
			value: summary.cashEnd,
			icon: Lock,
			color: 'text-slate-900',
			bg: 'bg-slate-50',
			border: 'border-slate-200',
			special: true
		}
	]

	return (
		<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
			{statCards.map((card, idx) => {
				const Icon = card.icon;
				return (
					<div
						key={idx}
						className={`relative overflow-hidden rounded-2xl p-5 border ${card.border} ${card.special ? 'bg-white shadow-md' : 'bg-white shadow-sm'} group hover:shadow-lg transition-all duration-300`}
					>
						<div className="flex items-center justify-between mb-4">
							<div className={`p-2 rounded-xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
								<Icon size={20} />
							</div>
						</div>
						<p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1">
							{card.label}
						</p>
						<p className={`text-xl font-black tracking-tight ${card.color}`}>
							{card.prefix}{formatCurrency(card.value, {
								minimumFractionDigits: 0,
								maximumFractionDigits: 0
							})}
						</p>
					</div>
				)
			})}
		</div>
	)
}
