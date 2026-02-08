'use client'

export default function CashSummary({ summary }: any) {
	if (!summary) return null

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('uk-UA', {
			style: 'currency',
			currency: 'UAH',
			minimumFractionDigits: 0
		}).format(value)
	}

	return (
		<div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
			<div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
				<p className="text-sm text-blue-700 font-semibold">Каса на старт</p>
				<p className="text-xl font-bold text-blue-900 mt-1">{formatCurrency(summary.cashStart)}</p>
			</div>

			<div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
				<p className="text-sm text-green-700 font-semibold">Готівка</p>
				<p className="text-xl font-bold text-green-900 mt-1">+{formatCurrency(summary.cashIncome)}</p>
			</div>

			<div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
				<p className="text-sm text-purple-700 font-semibold">Карта</p>
				<p className="text-xl font-bold text-purple-900 mt-1">+{formatCurrency(summary.cardIncome)}</p>
			</div>

			<div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
				<p className="text-sm text-red-700 font-semibold">Витрати</p>
				<p className="text-xl font-bold text-red-900 mt-1">-{formatCurrency(summary.expenses)}</p>
			</div>

			<div className="bg-gradient-to-br from-slate-100 to-slate-200 p-4 rounded-lg border border-slate-300 shadow-md">
				<p className="text-sm text-slate-700 font-semibold">Каса на закрит</p>
				<p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(summary.cashEnd)}</p>
			</div>
		</div>
	)
}
