'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Info, Loader2, X } from 'lucide-react'

type ConfirmModalProps = {
	isOpen: boolean
	title: string
	description?: string
	confirmText?: string
	cancelText?: string
	tone?: 'danger' | 'primary'
	isLoading?: boolean
	onConfirm: () => void | Promise<void>
	onClose: () => void
}

export default function ConfirmModal({
	isOpen,
	title,
	description,
	confirmText = 'Підтвердити',
	cancelText = 'Скасувати',
	tone = 'danger',
	isLoading = false,
	onConfirm,
	onClose
}: ConfirmModalProps) {
	const [mounted, setMounted] = useState(false)
	useEffect(() => setMounted(true), [])

	useEffect(() => {
		if (!isOpen) return

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !isLoading) {
				onClose()
			}
		}

		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [isOpen, isLoading, onClose])

	if (!isOpen || !mounted) return null

	const confirmButtonClass =
		tone === 'danger'
			? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:from-rose-400 disabled:to-red-400'
			: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400'

	return createPortal(
		<div
			className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
			onClick={() => {
				if (!isLoading) onClose()
			}}
		>
			<div
				className="w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.25)] animate-in fade-in zoom-in-95 duration-200"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-6 py-5">
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-start gap-3">
							<div
								className={`mt-0.5 shrink-0 flex h-11 w-11 items-center justify-center rounded-xl border ${tone === 'danger'
										? 'border-rose-200 bg-rose-100 text-rose-600'
										: 'border-blue-200 bg-blue-100 text-blue-600'
									}`}
							>
								{tone === 'danger' ? <AlertTriangle size={20} strokeWidth={2.25} /> : <Info size={20} strokeWidth={2.25} />}
							</div>
							<div>
								<p className="text-lg font-black text-slate-900 tracking-tight">{title}</p>
								{description ? (
									<p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">
										{description}
									</p>
								) : null}
							</div>
						</div>
						<button
							onClick={onClose}
							disabled={isLoading}
							className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
							aria-label="Закрити"
						>
							<X size={16} />
						</button>
					</div>
				</div>
				<div className="flex gap-3 p-5">
					<button
						onClick={onClose}
						disabled={isLoading}
						className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
					>
						{cancelText}
					</button>
					<button
						onClick={onConfirm}
						disabled={isLoading}
						className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed ${confirmButtonClass}`}
					>
						{isLoading ? (
							<>
								<Loader2 size={15} className="animate-spin" />
								Зачекайте…
							</>
						) : (
							confirmText
						)}
					</button>
				</div>
			</div>
		</div>,
		document.body
	)
}
