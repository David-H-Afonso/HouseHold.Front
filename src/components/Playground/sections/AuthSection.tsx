import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginUser } from '@/store/features/auth/authSlice'
import {
	selectAccessToken,
	selectRefreshToken,
	selectCurrentUser,
	selectIsAuthenticated,
} from '@/store/features/auth/selector'
import { authService } from '@/services'
import { useApiCall } from '@/hooks/useApiCall'
import { ApiResultPanel } from '../elements/ApiResultPanel'

export const AuthSection = () => {
	const dispatch = useAppDispatch()
	const accessToken = useAppSelector(selectAccessToken)
	const refreshToken = useAppSelector(selectRefreshToken)
	const user = useAppSelector(selectCurrentUser)
	const isAuthenticated = useAppSelector(selectIsAuthenticated)

	const [email, setEmail] = useState('admin@local')
	const [password, setPassword] = useState('')

	const [loginState, loginActions] = useApiCall()
	const [meState, meActions] = useApiCall()
	const [logoutState, logoutActions] = useApiCall()
	const [logoutAllState, logoutAllActions] = useApiCall()

	const handleLogin = () =>
		loginState.loading ||
		loginActions.call(
			async () => {
				const r = await dispatch(loginUser({ email, password }))
				if (loginUser.rejected.match(r)) throw new Error(r.payload as string)
				return r.payload
			},
			{ email, password }
		)

	const handleMe = () => meActions.call(() => authService.me())

	const handleLogout = () =>
		logoutActions.call(
			async () => {
				if (!refreshToken) throw new Error('No refresh token stored')
				await authService.logout(refreshToken)
				return { revoked: true }
			},
			{ refreshToken: refreshToken?.slice(0, 20) + '…' }
		)

	const handleLogoutAll = () => logoutAllActions.call(() => authService.logoutAll())

	return (
		<section className='pg-section'>
			<h2 className='pg-section__title'>A) Auth</h2>

			{/* Token state */}
			<div className='pg-infobox'>
				<strong>Status:</strong> {isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}
				{user && (
					<>
						{' '}
						· {user.email} {user.isAdmin && <span className='badge badge--admin'>Admin</span>}
					</>
				)}
				<br />
				{accessToken && (
					<>
						Access: <code>{accessToken.slice(0, 30)}…</code>
						<br />
					</>
				)}
				{refreshToken && (
					<>
						Refresh: <code>{refreshToken.slice(0, 30)}…</code>
					</>
				)}
			</div>

			{/* Login form */}
			<div className='pg-form'>
				<h3>POST /auth/login</h3>
				<div className='pg-form__row'>
					<label>Email</label>
					<input
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder='admin@local'
					/>
				</div>
				<div className='pg-form__row'>
					<label>Password</label>
					<input type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
				</div>
				<button onClick={handleLogin} disabled={loginState.loading}>
					Login
				</button>
				<ApiResultPanel state={loginState} label='POST /auth/login' />
			</div>

			{/* Me */}
			<div className='pg-form'>
				<h3>GET /auth/me</h3>
				<button onClick={handleMe} disabled={meState.loading}>
					GET /auth/me
				</button>
				<ApiResultPanel state={meState} label='GET /auth/me' />
			</div>

			{/* Logout */}
			<div className='pg-form'>
				<h3>POST /auth/logout</h3>
				<button onClick={handleLogout} disabled={logoutState.loading}>
					Logout (revoke current token)
				</button>
				<ApiResultPanel state={logoutState} label='POST /auth/logout' />
			</div>

			{/* Logout all */}
			<div className='pg-form'>
				<h3>POST /auth/logout-all</h3>
				<button onClick={handleLogoutAll} disabled={logoutAllState.loading}>
					Logout all devices
				</button>
				<ApiResultPanel state={logoutAllState} label='POST /auth/logout-all' />
			</div>
		</section>
	)
}
