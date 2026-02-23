import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
	selectCurrentUser,
	selectIsAuthenticated,
	selectIsAdmin,
	selectRefreshToken,
} from '@/store/features/auth/selector'
import { logout } from '@/store/features/auth/authSlice'
import { authService } from '@/services'

export const Header = () => {
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
			<div className='app-header__brand'>
				<span>🏠 Household</span>
			</div>

			{isAuthenticated && (
				<nav className='app-header__nav'>
					<a href='/playground'>Playground</a>
				</nav>
			)}

			<div className='app-header__user'>
				{isAuthenticated ? (
					<>
						<span className='app-header__email'>{user?.email}</span>
						{isAdmin && <span className='app-header__badge app-header__badge--admin'>Admin</span>}
						<button className='app-header__logout' onClick={handleLogout}>
							Logout
						</button>
					</>
				) : (
					<a href='/login'>Login</a>
				)}
			</div>
		</header>
	)
}
