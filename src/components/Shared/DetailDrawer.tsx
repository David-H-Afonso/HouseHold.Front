import { useId, type ReactNode } from 'react'
import { useModalFocus } from '@/hooks/useModalFocus'
import { Icon } from './Icons'

interface DetailDrawerProps {
	open: boolean
	title: string
	children: ReactNode
	onClose: () => void
}

export const DetailDrawer = ({ open, title, children, onClose }: DetailDrawerProps) => {
	const drawerRef = useModalFocus(open, onClose)
	const titleId = useId()

	if (!open) return null

	return (
		<div className='drawer-backdrop' role='presentation' onMouseDown={(event) => {
			if (event.target === event.currentTarget) onClose()
		}}>
			<aside ref={drawerRef} className='detail-drawer' role='dialog' aria-modal='true' aria-labelledby={titleId} tabIndex={-1}>
				<header>
					<h2 id={titleId}>{title}</h2>
					<button type='button' onClick={onClose} aria-label='Close details'>
						<Icon name='close' />
					</button>
				</header>
				<div>{children}</div>
			</aside>
		</div>
	)
}
