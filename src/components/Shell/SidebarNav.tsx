import { forwardRef, useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectCurrentUser, selectIsAdmin, selectRefreshToken } from '@/store/features/auth/selector'
import { logout } from '@/store/features/auth/authSlice'
import { authService } from '@/services'
import { BrandMark, Icon } from '@/components/Shared'
import { useUserPreferences } from '@/contexts/useUserPreferences'

const primaryLinks: Array<{ to: string; label: string; icon: string; end?: boolean }> = [
	{ to: '/dashboard', label: 'Home', icon: 'home' },
	{ to: '/today', label: 'Today', icon: 'today' },
	{ to: '/calendar', label: 'Calendar', icon: 'calendar' },
	{ to: '/apps', label: 'Apps', icon: 'apps' },
	{ to: '/games', label: 'Games', icon: 'games' },
	{ to: '/media', label: 'Jellywatch', icon: 'media', end: true },
	{ to: '/media/requests', label: 'Requests', icon: 'requests' },
	{ to: '/jellyfin', label: 'Jellyfin', icon: 'jellyfin' },
	{ to: '/pokemon', label: 'Pokémon', icon: 'pokemon' },
	{ to: '/warcraft', label: 'Warcraft', icon: 'warcraft' },
	{ to: '/workflows', label: 'Workflows', icon: 'workflows' },
]

const plannedItems = ['Downloads', 'Network']
const SHOPPATION_URL = 'https://shoppation.com/?bungie=connected'
const SHOPPATION_TIME_ZONE = 'Europe/Madrid'

const secondsUntilShoppationReset = () => {
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone: SHOPPATION_TIME_ZONE,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hourCycle: 'h23',
	}).formatToParts(new Date())
	const values = Object.fromEntries(parts.filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, Number(value)]))
	const currentSeconds = values.hour * 3600 + values.minute * 60 + values.second
	const resetSeconds = 19 * 3600
	const remaining = resetSeconds - currentSeconds
	return remaining > 0 ? remaining : remaining + 24 * 3600
}

const formatCountdown = (totalSeconds: number) => {
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60
	return `${hours}h ${minutes}m ${seconds}s`
}

export const SidebarNav = forwardRef<HTMLElement, { open: boolean; onClose: () => void }>(({ open, onClose }, ref) => {
	const user = useAppSelector(selectCurrentUser)
	const isAdmin = useAppSelector(selectIsAdmin)
	const refreshToken = useAppSelector(selectRefreshToken)
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const { preferences } = useUserPreferences()
	const [shoppationCountdown, setShoppationCountdown] = useState(secondsUntilShoppationReset)

	useEffect(() => {
		if (!preferences.showShoppation) return
		const update = () => setShoppationCountdown(secondsUntilShoppationReset())
		const interval = window.setInterval(update, 1000)
		return () => window.clearInterval(interval)
	}, [preferences.showShoppation])

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
					<NavLink key={link.to} to={link.to} end={link.end} className='sidebar-nav__link'>
						<Icon name={link.icon} /><span>{link.label}</span>
					</NavLink>
				))}
				{preferences.showShoppation && <a className='sidebar-nav__link sidebar-nav__external-link' href={SHOPPATION_URL} target='_blank' rel='noopener noreferrer'>
					<Icon name='apps' /><span className='sidebar-nav__external-copy'><span>Shoppation</span><small aria-live='polite'>Reset in {formatCountdown(shoppationCountdown)}</small></span><Icon name='external' />
				</a>}
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
