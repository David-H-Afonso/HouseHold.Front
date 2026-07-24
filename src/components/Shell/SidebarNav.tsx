import { NavLink } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectCurrentUser, selectIsAdmin } from '@/store/features/auth/selector'

const primaryLinks = [
	{ to: '/', label: 'Dashboard' },
	{ to: '/today', label: 'Today' },
	{ to: '/apps', label: 'Apps' },
	{ to: '/games', label: 'Games' },
	{ to: '/media', label: 'Media' },
	{ to: '/pokemon', label: 'Pokemon' },
	{ to: '/warcraft', label: 'Warcraft' },
]

const settingsLinks = [
	{ to: '/settings/integrations', label: 'Integrations' },
	{ to: '/playground', label: 'API playground' },
]

const plannedItems = ['Downloads', 'Network', 'Dashboard settings']

export const SidebarNav = () => {
	const user = useAppSelector(selectCurrentUser)
	const isAdmin = useAppSelector(selectIsAdmin)

	return (
		<aside className='sidebar-nav'>
			<div className='sidebar-nav__brand'>
				<span className='sidebar-nav__title'>Household</span>
				<span className='sidebar-nav__subtitle'>Home dashboard</span>
			</div>

			<nav className='sidebar-nav__section' aria-label='Main navigation'>
				{primaryLinks.map((link) => (
					<NavLink key={link.to} to={link.to} end={link.to === '/'} className='sidebar-nav__link'>
						{link.label}
					</NavLink>
				))}
			</nav>

			<nav className='sidebar-nav__section sidebar-nav__section--settings' aria-label='Settings navigation'>
				{settingsLinks.map((link) => (
					<NavLink key={link.to} to={link.to} className='sidebar-nav__link'>
						{link.label}
					</NavLink>
				))}
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
				<span>{user?.userName ?? user?.email ?? 'User'}</span>
				{isAdmin && <span className='sidebar-nav__role'>Admin</span>}
			</div>
		</aside>
	)
}
