import type { ReactNode } from 'react'

interface DetailDrawerProps {
	open: boolean
	title: string
	children: ReactNode
	onClose: () => void
}

export const DetailDrawer = ({ open, title, children, onClose }: DetailDrawerProps) => {
	if (!open) return null

	return (
		<div className='drawer-backdrop' role='presentation'>
			<aside className='detail-drawer' aria-label={title}>
				<header>
					<h2>{title}</h2>
					<button type='button' onClick={onClose} aria-label='Close details'>
						Close
					</button>
				</header>
				<div>{children}</div>
			</aside>
		</div>
	)
}
