import type { ReactNode } from 'react'
import { SidebarNav } from './SidebarNav'

interface AppShellProps {
	children: ReactNode
}

export const AppShell = ({ children }: AppShellProps) => {
	return (
		<div className='app-shell'>
			<SidebarNav />
			<main className='app-shell__main'>{children}</main>
		</div>
	)
}
