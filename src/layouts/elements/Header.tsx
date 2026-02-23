import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
	selectCurrentUser,
	selectIsAuthenticated,
	selectIsAdmin,
	selectRefreshToken,
} from '@/store/features/auth/selector'
import { logout } from '@/store/features/auth/authSlice'
import { authService } from '@/services'

export const Header: React.FC = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const isAuthenticated = useAppSelector(selectIsAuthenticated)
	const user = useAppSelector(selectCurrentUser)
	const isAdmin = useAppSelector(selectIsAdmin)
	const refreshToken = useAppSelector(selectRefreshToken)

	const handleLogout = async () => {
		if (refreshToken) await authService.logout(refreshToken)
		dispatch(logout())
		navigate('/login')
	}

	return (
		<header className='app-header'>
			<div className='header-content'>
				<Link to={isAuthenticated ? '/playground' : '/login'} className='header-logo'>
					🏠 Household
				</Link>

				{isAuthenticated && (
					<nav className='header-nav'>
						<Link to='/playground' className='nav-link'>
							Playground
						</Link>
					</nav>
				)}

				<div className='quick-actions'>
					{isAuthenticated ? (
						<>
							<span className='header-user'>{user?.email}</span>
							{isAdmin && <span className='header-badge header-badge--admin'>Admin</span>}
							<button className='action-btn' onClick={handleLogout}>
								Logout
							</button>
						</>
					) : (
						<Link to='/login' className='action-btn'>
							Login
						</Link>
					)}
				</div>
			</div>
		</header>
	)
}
