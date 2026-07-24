import { forwardRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectCurrentUser, selectIsAdmin, selectRefreshToken } from '@/store/features/auth/selector'
import { logout } from '@/store/features/auth/authSlice'
import { authService } from '@/services'
import { BrandMark, Icon } from '@/components/Shared'

const primaryLinks = [
	{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
	{ to: '/today', label: 'Today', icon: 'today' },
	{ to: '/apps', label: 'Apps', icon: 'apps' },
	{ to: '/games', label: 'Games', icon: 'games' },
	{ to: '/media', label: 'Jellywatch', icon: 'media' },
	{ to: '/jellyfin', label: 'Jellyfin', icon: 'jellyfin' },
	{ to: '/pokemon', label: 'Pokémon', icon: 'pokemon' },
	{ to: '/warcraft', label: 'Warcraft', icon: 'warcraft' },
	{ to: '/workflows', label: 'Workflows', icon: 'workflows' },
]

const plannedItems = ['Downloads', 'Network']

export const SidebarNav = forwardRef<HTMLElement, { open: boolean; onClose: () => void }>(({ open, onClose }, ref) => {
	const user = useAppSelector(selectCurrentUser)
	const isAdmin = useAppSelector(selectIsAdmin)
	const refreshToken = useAppSelector(selectRefreshToken)
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	const signOut = async () => {
		if (refreshToken) await authService.logout(refreshToken)
		dispatch(logout())
		navigate('/login', { replace: true })
	}

	return (
		<aside ref={ref} id='primary-navigation' className={`sidebar-nav${open ? ' is-open' : ''}`} aria-label='Application navigation' aria-modal={open ? 'true' : undefined} role={open ? 'dialog' : undefined} tabIndex={open ? -1 : undefined}>
			<div className='sidebar-nav__brand'>
				<BrandMark provider='household' />
				<div><span className='sidebar-nav__title'>Household</span><span className='sidebar-nav__subtitle'>Home operations</span></div>
				<button type='button' className='sidebar-nav__close' onClick={onClose} aria-label='Close navigation'><Icon name='close' /></button>
			</div>

			<nav className='sidebar-nav__section' aria-label='Main navigation'>
				{primaryLinks.map((link) => (
					<NavLink key={link.to} to={link.to} className='sidebar-nav__link'>
						<Icon name={link.icon} /><span>{link.label}</span>
					</NavLink>
				))}
			</nav>

			<nav className='sidebar-nav__section sidebar-nav__section--settings' aria-label='Settings navigation'>
				<NavLink to='/settings/integrations' className='sidebar-nav__link'><Icon name='settings' /><span>Settings</span></NavLink>
				{import.meta.env.DEV && isAdmin && <NavLink to='/playground' className='sidebar-nav__link'><Icon name='workflows' /><span>API playground</span></NavLink>}
			</nav>

			<section className='sidebar-nav__planned' aria-labelledby='planned-navigation-title'>
				<h2 id='planned-navigation-title'>Planned</h2>
				{plannedItems.map((item) => (
					<span key={item} className='sidebar-nav__planned-item' aria-disabled='true'>
						<span>{item}</span><small>Soon</small>
					</span>
				))}
			</section>

			<div className='sidebar-nav__user'>
				<div><span>{user?.userName ?? user?.email ?? 'User'}</span>{isAdmin && <span className='sidebar-nav__role'>Admin</span>}</div>
				<button type='button' onClick={signOut} aria-label='Sign out'><Icon name='logout' /></button>
			</div>
		</aside>
	)
})

SidebarNav.displayName = 'SidebarNav'
