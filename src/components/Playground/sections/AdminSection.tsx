import { useState } from 'react'
import { authService } from '@/services'
import { useApiCall } from '@/hooks/useApiCall'
import { ApiResultPanel } from '../elements/ApiResultPanel'

export const AdminSection = () => {
	const [email, setEmail] = useState('')
	const [userName, setUserName] = useState('')
	const [password, setPassword] = useState('')
	const [isAdmin, setIsAdmin] = useState(false)

	const [state, actions] = useApiCall()

	const handleCreate = () => {
		const body = { email, userName, password, isAdmin }
		actions.call(() => authService.adminCreateUser(body), body)
	}

	return (
		<section className='pg-section'>
			<h2 className='pg-section__title'>
				B) Admin <span className='badge badge--admin'>Admin only</span>
			</h2>

			<div className='pg-form'>
				<h3>POST /admin/users</h3>
				<div className='pg-form__row'>
					<label>Email</label>
					<input
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder='user@local'
					/>
				</div>
				<div className='pg-form__row'>
					<label>Username</label>
					<input
						value={userName}
						onChange={(e) => setUserName(e.target.value)}
						placeholder='username'
					/>
				</div>
				<div className='pg-form__row'>
					<label>Password</label>
					<input type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
				</div>
				<div className='pg-form__row'>
					<label>
						<input
							type='checkbox'
							checked={isAdmin}
							onChange={(e) => setIsAdmin(e.target.checked)}
						/>{' '}
						isAdmin
					</label>
				</div>
				<button onClick={handleCreate} disabled={state.loading}>
					Create user
				</button>
				<ApiResultPanel state={state} label='POST /admin/users' />
			</div>
		</section>
	)
}
