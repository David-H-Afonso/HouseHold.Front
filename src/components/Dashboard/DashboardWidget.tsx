import type { ReactNode } from 'react'

interface DashboardWidgetProps {
	title: string
	description?: string
	children?: ReactNode
}

export const DashboardWidget = ({ title, description, children }: DashboardWidgetProps) => {
	return (
		<section className='dashboard-widget'>
			<header className='dashboard-widget__header'>
				<h2>{title}</h2>
				{description && <p>{description}</p>}
			</header>
			<div className='dashboard-widget__body'>{children}</div>
		</section>
	)
}
