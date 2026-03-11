type PageLoaderProps = {
	message?: string
	backgroundClassName?: string
	spinnerClassName?: string
}

export default function PageLoader({
	message = 'Завантаження…',
	backgroundClassName = 'bg-gradient-to-br from-slate-50 to-blue-50',
	spinnerClassName = 'border-blue-600'
}: PageLoaderProps) {
	return (
		<main className={`min-h-screen p-0 ${backgroundClassName}`}>
			<div className="w-full">
				<div className="flex items-center justify-center py-20">
					<div className="text-center">
						<div
							className={`mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 ${spinnerClassName}`}
						/>
						<p className="text-lg text-slate-600">{message}</p>
					</div>
				</div>
			</div>
		</main>
	)
}
