'use client'

import { useEffect } from 'react'

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

	if (!isOpen) return null

	const confirmButtonClass =
		tone === 'danger'
			? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
			: 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
			onClick={() => {
				if (!isLoading) onClose()
			}}
		>
			<div
				className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
				onClick={(event) => event.stopPropagation()}
			>
				<p className="text-base font-bold text-slate-900">{title}</p>
				{description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
				<div className="mt-5 flex gap-2">
					<button
						onClick={onClose}
						disabled={isLoading}
						className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
					>
						{cancelText}
					</button>
					<button
						onClick={onConfirm}
						disabled={isLoading}
						className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed ${confirmButtonClass}`}
					>
						{isLoading ? 'Зачекайте…' : confirmText}
					</button>
				</div>
			</div>
		</div>
	)
}
