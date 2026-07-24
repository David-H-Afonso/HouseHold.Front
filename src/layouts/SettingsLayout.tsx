import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectIsAdmin } from '@/store/features/auth/selector'

const links = [
	{ to: '/settings/integrations', label: 'Integrations' },
	{ to: '/settings/dashboard', label: 'Dashboard' },
	{ to: '/settings/apps', label: 'Apps & providers' },
	{ to: '/settings/profile', label: 'Profile' },
]

export const SettingsLayout = ({ children }: { children: ReactNode }) => {
	const isAdmin = useAppSelector(selectIsAdmin)
	return <div className='settings-shell'>
		<header className='settings-shell__header'>
			<span>Household settings</span>
			<h1>Settings</h1>
			<p>Personalize your hub and manage the services connected to your account.</p>
		</header>
		<div className='settings-shell__body'>
			<nav className='settings-nav' aria-label='Settings sections'>
				{links.map((link) => <NavLink key={link.to} to={link.to}>{link.label}</NavLink>)}
				{isAdmin && <NavLink to='/settings/users'>Users</NavLink>}
			</nav>
			<section className='settings-shell__content'>{children}</section>
		</div>
	</div>
}
