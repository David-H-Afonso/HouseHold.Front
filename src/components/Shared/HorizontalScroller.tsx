import { useRef, type ReactNode, type WheelEvent, type PointerEvent } from 'react'
import { Icon } from './Icons'

export const HorizontalScroller = ({ children, label, className = '' }: { children: ReactNode; label: string; className?: string }) => {
	const ref = useRef<HTMLDivElement>(null)
	const drag = useRef({ active: false, x: 0, left: 0, moved: false })

	const scroll = (direction: number) => ref.current?.scrollBy({ left: direction * Math.max(240, ref.current.clientWidth * 0.75), behavior: 'smooth' })
	const onWheel = (event: WheelEvent<HTMLDivElement>) => {
		if (!ref.current || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
		if (ref.current.scrollWidth <= ref.current.clientWidth) return
		event.preventDefault()
		ref.current.scrollLeft += event.deltaY
	}
	const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
		if (event.pointerType === 'mouse' && event.button !== 0) return
		if (!ref.current) return
		drag.current = { active: true, x: event.clientX, left: ref.current.scrollLeft, moved: false }
		ref.current.dataset.dragging = 'true'
		for (const child of ref.current.children) child.setAttribute('inert', '')
		ref.current.setPointerCapture(event.pointerId)
	}
	const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
		if (!drag.current.active || !ref.current) return
		const distance = event.clientX - drag.current.x
		if (Math.abs(distance) > 5) drag.current.moved = true
		ref.current.scrollLeft = drag.current.left - distance
	}
	const stopDrag = () => {
		drag.current.active = false
		if (ref.current) {
			delete ref.current.dataset.dragging
			for (const child of ref.current.children) child.removeAttribute('inert')
		}
	}

	return <div className={`horizontal-scroller ${className}`}>
		<div className='horizontal-scroller__controls' aria-label={`${label} carousel controls`}>
			<button type='button' onClick={() => scroll(-1)} aria-label={`Scroll ${label} left`}><Icon name='chevronLeft' /></button>
			<button type='button' onClick={() => scroll(1)} aria-label={`Scroll ${label} right`}><Icon name='chevronRight' /></button>
		</div>
		<div
			ref={ref}
			className='horizontal-scroller__track'
			tabIndex={0}
			role='region'
			aria-label={label}
			onWheel={onWheel}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={stopDrag}
			onPointerCancel={stopDrag}
			onKeyDown={(event) => {
				if (event.key === 'ArrowLeft') { event.preventDefault(); scroll(-0.45) }
				if (event.key === 'ArrowRight') { event.preventDefault(); scroll(0.45) }
			}}
			onClickCapture={(event) => {
				if (drag.current.moved) { event.preventDefault(); event.stopPropagation(); drag.current.moved = false }
			}}
		>
			{children}
		</div>
	</div>
}
