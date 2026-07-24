import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandMark } from '@/components/Shared'
import { authService } from '@/services'
import { persistor } from '@/store'
import { useAppDispatch } from '@/store/hooks'
import { forceLogout } from '@/store/features/auth/authSlice'
import { isApiError } from '@/utils/customFetch'

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/

export const ChangePasswordPage = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		const currentPassword = String(form.get('currentPassword') ?? '')
		const newPassword = String(form.get('newPassword') ?? '')
		const confirmation = String(form.get('confirmation') ?? '')
		setError(null)
		if (newPassword !== confirmation) {
			setError('The new passwords do not match.')
			return
		}
		if (!passwordPattern.test(newPassword)) {
			setError('Use 12–128 characters with uppercase, lowercase, a number, and a symbol.')
			return
		}
		setSubmitting(true)
		try {
			await authService.changePassword({ currentPassword, newPassword })
			dispatch(forceLogout())
			await persistor.purge()
			try { localStorage.removeItem('persist:root') } catch { /* State is already cleared in memory. */ }
			navigate('/login', { replace: true, state: { message: 'Password changed. Sign in again with your new password.' } })
		} catch (reason) {
			setError(isApiError(reason) && reason.code === 'invalid_current_password'
				? 'The current password is incorrect.'
				: isApiError(reason) && reason.code === 'password_too_weak'
					? 'Use 12–128 characters with uppercase, lowercase, a number, and a symbol.'
					: 'Your password could not be changed. Try again.')
		} finally {
			setSubmitting(false)
		}
	}

	return <main className='auth-gate-page'>
		<section className='auth-gate-card' aria-labelledby='change-password-title'>
			<BrandMark provider='household' name='Household' size='large' />
			<span>Account security</span>
			<h1 id='change-password-title'>Change Your Temporary Password</h1>
			<p>Choose a private password before continuing to Household. Changing it will end every current session.</p>
			<form onSubmit={submit}>
				<label className='settings-field'><span>Current temporary password</span><input name='currentPassword' type='password' autoComplete='current-password' maxLength={1024} required /></label>
				<label className='settings-field'><span>New password</span><input name='newPassword' type='password' autoComplete='new-password' minLength={12} maxLength={128} aria-describedby='forced-password-help' required /></label>
				<label className='settings-field'><span>Confirm new password</span><input name='confirmation' type='password' autoComplete='new-password' minLength={12} maxLength={128} required /></label>
				<small className='settings-help' id='forced-password-help'>12–128 characters with uppercase, lowercase, a number, and a symbol.</small>
				{error && <p className='error-banner' role='alert'>{error}</p>}
				<button className='button-primary' type='submit' disabled={submitting}>{submitting ? 'Changing password…' : 'Change password'}</button>
			</form>
		</section>
	</main>
}
