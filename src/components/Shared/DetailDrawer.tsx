import { useEffect, useRef, type ReactNode } from 'react'

interface DetailDrawerProps {
	open: boolean
	title: string
	children: ReactNode
	onClose: () => void
}

export const DetailDrawer = ({ open, title, children, onClose }: DetailDrawerProps) => {
	const closeButtonRef = useRef<HTMLButtonElement>(null)
	const previousFocusRef = useRef<HTMLElement | null>(null)
	const onCloseRef = useRef(onClose)

	useEffect(() => {
		onCloseRef.current = onClose
	}, [onClose])

	useEffect(() => {
		if (!open) return
		previousFocusRef.current = document.activeElement as HTMLElement | null
		closeButtonRef.current?.focus()
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onCloseRef.current()
		}
		document.addEventListener('keydown', onKeyDown)
		return () => {
			document.removeEventListener('keydown', onKeyDown)
			previousFocusRef.current?.focus()
		}
	}, [open])

	if (!open) return null

	return (
		<div className='drawer-backdrop' role='presentation' onMouseDown={(event) => {
			if (event.target === event.currentTarget) onClose()
		}}>
			<aside className='detail-drawer' role='dialog' aria-modal='true' aria-label={title}>
				<header>
					<h2>{title}</h2>
					<button ref={closeButtonRef} type='button' onClick={onClose} aria-label='Close details'>
						Close
					</button>
				</header>
				<div>{children}</div>
			</aside>
		</div>
	)
}
