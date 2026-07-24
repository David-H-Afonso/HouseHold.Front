import type { ReactNode } from 'react'

export const HorizontalScroller = ({ children, label, className = '' }: { children: ReactNode; label: string; className?: string }) => {
	return <div className={`horizontal-scroller ${className}`}>
		<div
			className='horizontal-scroller__track'
			tabIndex={0}
			role='region'
			aria-label={label}
		>
			{children}
		</div>
	</div>
}
