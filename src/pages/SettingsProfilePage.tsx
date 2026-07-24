import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserPreferences } from '@/contexts/useUserPreferences'
import { authService } from '@/services'
import { persistor } from '@/store'
import { useAppDispatch } from '@/store/hooks'
import { forceLogout } from '@/store/features/auth/authSlice'

const commonTimezones = ['UTC', 'Europe/Madrid', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Australia/Sydney']

export const SettingsProfilePage = () => {
	const { preferences, updatePreferences, saving, persistence, ready } = useUserPreferences()
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const [timezone, setTimezone] = useState(preferences.timezone)
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [passwordSaving, setPasswordSaving] = useState(false)
	const [passwordError, setPasswordError] = useState<string | null>(null)

	useEffect(() => {
		if (ready) setTimezone(preferences.timezone)
	}, [preferences.timezone, ready])

	const changePassword = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setPasswordError(null)
		if (newPassword !== confirmPassword) {
			setPasswordError('The new passwords do not match.')
			return
		}
		if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/.test(newPassword)) {
			setPasswordError('Use 12–128 characters with uppercase, lowercase, a number, and a symbol.')
			return
		}
		setPasswordSaving(true)
		try {
			await authService.changePassword({ currentPassword, newPassword })
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
			dispatch(forceLogout())
			await persistor.purge()
			try { localStorage.removeItem('persist:root') } catch { /* State is already cleared in memory. */ }
			navigate('/login', { replace: true, state: { message: 'Password changed. Sign in again with your new password.' } })
		} catch {
			setCurrentPassword('')
			setPasswordError('Your password could not be changed. Check your current password and try again.')
		} finally {
			setPasswordSaving(false)
		}
	}
	return <div className='settings-page'>
		<header><h2>Profile</h2><p>Control how Household presents time-sensitive information.</p></header>
		<section className='settings-section'>
			<div><h3>Timezone</h3><p>Dates are stored in UTC and displayed in this IANA timezone. Browser fallback: <strong>{Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}</strong>.</p></div>
			<form onSubmit={(event) => { event.preventDefault(); void updatePreferences({ timezone: timezone.trim() || 'UTC' }) }}>
				<label className='settings-field'><span>IANA timezone</span><input name='timeZoneId' list='timezone-options' value={timezone} onChange={(event) => setTimezone(event.target.value)} autoComplete='off' required /><datalist id='timezone-options'>{commonTimezones.map((zone) => <option key={zone} value={zone} />)}</datalist></label>
				<button className='button-primary' type='submit' disabled={saving}>Save timezone</button>
			</form>
		</section>
		<section className='settings-section'>
			<div><h3>Appearance</h3><p>Use your device theme or keep Household consistently light or dark.</p></div>
			<label className='settings-field'><span>Theme</span><select value={preferences.visualPreference} onChange={(event) => void updatePreferences({ visualPreference: event.target.value as 'system' | 'light' | 'dark' })}><option value='system'>System</option><option value='light'>Light</option><option value='dark'>Dark</option></select></label>
		</section>
		<section className='settings-section'>
			<div><h3>Change password</h3><p>Changing your password ends your Household sessions. You will need to sign in again on this and other devices.</p></div>
			<form onSubmit={changePassword}>
				<label className='settings-field'><span>Current password</span><input name='currentPassword' type='password' value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete='current-password' maxLength={1024} required /></label>
				<label className='settings-field'><span>New password</span><input name='newPassword' type='password' value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete='new-password' minLength={12} maxLength={128} aria-describedby='new-password-help' required /></label>
				<label className='settings-field'><span>Confirm new password</span><input name='confirmPassword' type='password' value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete='new-password' minLength={12} maxLength={128} required /></label>
				<small className='settings-help' id='new-password-help'>12–128 characters with uppercase, lowercase, a number, and a symbol.</small>
				{passwordError && <p className='error-banner' role='alert'>{passwordError}</p>}
				<button className='button-primary' type='submit' disabled={passwordSaving}>{passwordSaving ? 'Changing password…' : 'Change password'}</button>
			</form>
		</section>
		<p className='settings-persistence' role='status'>Saved to {persistence === 'server' ? 'your Household account' : 'this device'}.</p>
	</div>
}
