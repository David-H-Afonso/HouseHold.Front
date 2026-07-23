import type { ReactNode } from 'react'

interface DashboardGridProps {
	children: ReactNode
}

export const DashboardGrid = ({ children }: DashboardGridProps) => {
	return <div className='dashboard-grid'>{children}</div>
}
