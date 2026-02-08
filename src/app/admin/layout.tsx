export default function AdminLayout({
	children
}: {
	children: React.ReactNode
}) {
	return (
		<div className="min-h-screen bg-slate-50">
			<main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
				{children}
			</main>
		</div>
	)
}
