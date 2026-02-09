type CurrencyOptions = {
	minimumFractionDigits?: number
	maximumFractionDigits?: number
}

export const CURRENCY_SYMBOL = 'zł'

export function formatCurrency(value: number, options: CurrencyOptions = {}) {
	return new Intl.NumberFormat('pl-PL', {
		style: 'currency',
		currency: 'PLN',
		minimumFractionDigits: options.minimumFractionDigits ?? 2,
		maximumFractionDigits: options.maximumFractionDigits ?? options.minimumFractionDigits ?? 2
	}).format(value)
}
