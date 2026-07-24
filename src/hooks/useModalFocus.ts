import { useEffect, useRef } from 'react'

const focusableSelector = [
	'a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
	'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',')

export const useModalFocus = (open: boolean, onClose: () => void) => {
	const containerRef = useRef<HTMLElement>(null)
	const previousFocusRef = useRef<HTMLElement | null>(null)
	const onCloseRef = useRef(onClose)

	useEffect(() => { onCloseRef.current = onClose }, [onClose])

	useEffect(() => {
		if (!open) return
		previousFocusRef.current = document.activeElement as HTMLElement | null
		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		const element = containerRef.current
		const first = element?.querySelector<HTMLElement>(focusableSelector)
		window.requestAnimationFrame(() => (first ?? element)?.focus())

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault()
				onCloseRef.current()
				return
			}
			if (event.key !== 'Tab' || !element) return
			const focusable = [...element.querySelectorAll<HTMLElement>(focusableSelector)]
			if (focusable.length === 0) {
				event.preventDefault()
				element.focus()
				return
			}
			const firstElement = focusable[0]
			const lastElement = focusable[focusable.length - 1]
			if (event.shiftKey && document.activeElement === firstElement) {
				event.preventDefault()
				lastElement.focus()
			} else if (!event.shiftKey && document.activeElement === lastElement) {
				event.preventDefault()
				firstElement.focus()
			}
		}

		document.addEventListener('keydown', onKeyDown)
		return () => {
			document.removeEventListener('keydown', onKeyDown)
			document.body.style.overflow = previousOverflow
			previousFocusRef.current?.focus()
		}
	}, [open])

	return containerRef
}
