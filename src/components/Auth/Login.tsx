import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginUser } from '@/store/features/auth/authSlice'
import { selectAuthLoading, selectAuthError } from '@/store/features/auth/selector'

export const Login = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const location = useLocation()
	const loading = useAppSelector(selectAuthLoading)
	const error = useAppSelector(selectAuthError)

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	const from = (location.state as any)?.from?.pathname || '/playground'

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		const result = await dispatch(loginUser({ email, password }))
		if (loginUser.fulfilled.match(result)) {
			navigate(from, { replace: true })
		}
	}

	return (
		<div className='login'>
			<div className='login__card'>
				<h1 className='login__title'>🏠 Household</h1>
				<p className='login__subtitle'>Sign in to continue</p>

				<form className='login__form' onSubmit={handleSubmit}>
					<div className='login__field'>
						<label htmlFor='email'>Email</label>
						<input
							id='email'
							type='email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder='admin@local'
							autoComplete='email'
							required
						/>
					</div>

					<div className='login__field'>
						<label htmlFor='password'>Password</label>
						<input
							id='password'
							type='password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder='••••••••'
							autoComplete='current-password'
							required
						/>
					</div>

					{error && <p className='login__error'>{error}</p>}

					<button className='login__submit' type='submit' disabled={loading}>
						{loading ? 'Signing in…' : 'Sign in'}
					</button>
				</form>
			</div>
		</div>
	)
}
