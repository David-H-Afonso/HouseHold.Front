import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/Shared'
import { authService } from '@/services'

let pendingFragmentToken: string | null = null
const consumeFragmentToken = () => {
	if (window.location.hash) {
		const fragment = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
		pendingFragmentToken = new URLSearchParams(fragment).get('token') ?? ''
		window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
	}
	return pendingFragmentToken ?? ''
}

export const InviteAcceptPage = () => {
	const [token, setToken] = useState(consumeFragmentToken)
	const [error, setError] = useState<string | null>(null)
	const [created, setCreated] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	useEffect(() => { pendingFragmentToken = null }, [])

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		const password = String(form.get('password'))
		const confirmation = String(form.get('confirmation'))
		if (password !== confirmation) {
			setError('Passwords do not match.')
			return
		}
		setSubmitting(true)
		setError(null)
		try {
			await authService.redeemInvitation({ token: token.trim(), password })
			setToken('')
			setCreated(true)
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'The invitation could not be redeemed.')
		} finally {
			setSubmitting(false)
		}
	}

	return <main className='invitation-page'>
		<section className='invitation-card'>
			<BrandMark provider='household' name='Household' size='large' />
			<span>Household invitation</span>
			<h1>{created ? 'Your account is ready' : 'Join your household'}</h1>
			{created ? <><p>Sign in with the email address from your invitation and the password you just chose.</p><Link className='button-primary' to='/login'>Continue to sign in</Link></> : <form onSubmit={submit}>
				{token ? <p className='invitation-token-loaded' role='status'>Invitation loaded securely from the link.</p> : <label className='settings-field'><span>Invitation token</span><input name='invitationToken' value={token} onChange={(event) => setToken(event.target.value)} autoComplete='off' autoCapitalize='off' spellCheck={false} required /></label>}
				<label className='settings-field'><span>Password</span><input name='password' type='password' minLength={12} autoComplete='new-password' required /></label>
				<label className='settings-field'><span>Confirm password</span><input name='confirmation' type='password' minLength={12} autoComplete='new-password' required /></label>
				{error && <p className='error-banner' role='alert'>{error}</p>}
				<button className='button-primary' type='submit' disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>
			</form>}
		</section>
	</main>
}
