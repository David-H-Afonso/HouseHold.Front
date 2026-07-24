import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { SidebarNav } from './SidebarNav'
import { Icon } from '@/components/Shared'
import { useModalFocus } from '@/hooks/useModalFocus'

interface AppShellProps {
	children: ReactNode
}

export const AppShell = ({ children }: AppShellProps) => {
	const [navigationOpen, setNavigationOpen] = useState(false)
	const triggerRef = useRef<HTMLButtonElement>(null)
	const navigationRef = useModalFocus(navigationOpen, () => setNavigationOpen(false))
	const location = useLocation()

	useEffect(() => { setNavigationOpen(false) }, [location.pathname])
	return (
		<div className='app-shell'>
			<a className='skip-link' href='#main-content'>Skip to main content</a>
			<header className='mobile-header'>
				<button ref={triggerRef} type='button' aria-label='Open navigation' aria-controls='primary-navigation' aria-expanded={navigationOpen} onClick={() => setNavigationOpen(true)}><Icon name='menu' /></button>
				<strong>Household</strong>
				<span aria-hidden='true' />
			</header>
			{navigationOpen && <button className='sidebar-nav__backdrop' type='button' aria-label='Close navigation' onClick={() => { setNavigationOpen(false); triggerRef.current?.focus() }} />}
			<SidebarNav ref={navigationRef} open={navigationOpen} onClose={() => { setNavigationOpen(false); triggerRef.current?.focus() }} />
			<main id='main-content' className='app-shell__main' tabIndex={-1} inert={navigationOpen ? true : undefined}>{children}</main>
		</div>
	)
}
