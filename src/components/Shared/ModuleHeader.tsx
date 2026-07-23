import type { ReactNode } from 'react'

interface ModuleHeaderProps {
	title: string
	description?: string
	actions?: ReactNode
}

export const ModuleHeader = ({ title, description, actions }: ModuleHeaderProps) => {
	return (
		<header className='module-header'>
			<div>
				<h1>{title}</h1>
				{description && <p>{description}</p>}
			</div>
			{actions && <div className='module-header__actions'>{actions}</div>}
		</header>
	)
}
