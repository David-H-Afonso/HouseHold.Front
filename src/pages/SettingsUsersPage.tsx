import { useEffect, useState, type FormEvent } from 'react'
import type { UserDto } from '@/models/api/Auth'
import { authService, operationsService } from '@/services'
import { ModuleState, OneUseSecret } from '@/components/Shared'
import { useUserPreferences } from '@/contexts/useUserPreferences'

type OneUseValue = { title: string; value: string; detail: string }

const UserEditor = ({ user, onUpdated, onNotice, onSecret, onError }: { user: UserDto; onUpdated: (user: UserDto) => void; onNotice: (message: string) => void; onSecret: (secret: OneUseValue) => void; onError: (message: string) => void }) => {
	const [draft, setDraft] = useState(user)
	const [saving, setSaving] = useState(false)
	const save = async () => {
		setSaving(true)
		try {
			const updated = await operationsService.updateUser(user.id, { userName: draft.userName, email: draft.email, isAdmin: draft.isAdmin, isActive: draft.isActive })
			onUpdated(updated)
			onNotice(`${updated.userName} was updated.`)
		} catch { onError('The user could not be updated. The final active administrator cannot be removed.') }
		finally { setSaving(false) }
	}
	const reset = async () => {
		try {
			const result = await operationsService.resetPassword(user.id)
			if (result.temporaryPassword) onSecret({ title: `Temporary password for ${user.userName}`, value: result.temporaryPassword, detail: 'Copy it now and share it through a trusted channel. It will not be shown again.' })
			else onNotice(`Password reset for ${user.userName}.`)
		} catch { onError('The password could not be reset.') }
	}
	return <article><div className='user-editor__identity'><label><span>Name</span><input name={`userName-${user.id}`} value={draft.userName} onChange={(event) => setDraft({ ...draft, userName: event.target.value })} /></label><label><span>Email</span><input name={`email-${user.id}`} type='email' value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} autoComplete='email' spellCheck={false} /></label></div><label className='user-editor__select'><span>Role</span><select name={`role-${user.id}`} value={draft.isAdmin ? 'admin' : 'member'} onChange={(event) => setDraft({ ...draft, isAdmin: event.target.value === 'admin' })}><option value='member'>Member</option><option value='admin'>Admin</option></select></label><label className='switch-field user-editor__active'><input type='checkbox' checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /><span aria-hidden='true' /><div><strong>{draft.isActive ? 'Active' : 'Disabled'}</strong><small>Account access</small></div></label><div className='user-editor__actions'><button type='button' onClick={() => void reset()}>Reset password</button><button type='button' onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save user'}</button></div></article>
}

export const SettingsUsersPage = () => {
	const { preferences } = useUserPreferences()
	const [users, setUsers] = useState<UserDto[]>([])
	const [loading, setLoading] = useState(true)
	const [notice, setNotice] = useState<string | null>(null)
	const [oneUseValue, setOneUseValue] = useState<OneUseValue | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let active = true
		operationsService.users().then((result) => { if (active) setUsers(result) }).catch(() => { if (active) setError('Household users could not be loaded.') }).finally(() => { if (active) setLoading(false) })
		return () => { active = false }
	}, [])

	const createUser = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		setError(null)
		setOneUseValue(null)
		try {
			const result = await authService.adminCreateUser({ email: String(form.get('email')), userName: String(form.get('userName')), temporaryPassword: String(form.get('password')), isAdmin: form.get('role') === 'Admin' })
			setUsers((current) => [...current, result.user])
			event.currentTarget.reset()
			if (result.temporaryPassword) setOneUseValue({ title: `Temporary password for ${result.user.userName}`, value: result.temporaryPassword, detail: 'Copy it now and share it through a trusted channel. It will not be shown again.' })
			setNotice(`${result.user.userName} was created. Their temporary password must be changed after sign-in.`)
		} catch { setError('The user could not be created.') }
	}

	const invite = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		setOneUseValue(null)
		try {
			const result = await operationsService.createInvitation({ email: String(form.get('email')), userName: String(form.get('userName')), isAdmin: form.get('role') === 'Admin', expiresInHours: Number(form.get('expiresInHours')) })
			const inviteUrl = `${window.location.origin}/invite#token=${encodeURIComponent(result.token)}`
			setOneUseValue({ title: 'Single-use invitation link', value: inviteUrl, detail: `Expires ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: preferences.timezone }).format(new Date(result.expiresAt))}. Copy it now and share it through a trusted channel.` })
			setNotice('Invitation created. Its one-use link is shown separately below.')
			event.currentTarget.reset()
		} catch { setError('The invitation could not be created.') }
	}

	return <div className='settings-page settings-users'>
		<header><h2>Users</h2><p>Create accounts, issue one-use invitations, and manage household access.</p></header>
		{notice && <p className='notice-banner' role='status'>{notice}</p>}{error && <p className='error-banner' role='alert'>{error}</p>}
		{oneUseValue && <OneUseSecret {...oneUseValue} onDismiss={() => setOneUseValue(null)} />}
		<div className='settings-users__forms'>
			<form className='settings-section settings-form-card' onSubmit={createUser}><div><h3>Create user</h3><p>The password is temporary and should be changed after sign-in.</p></div><label className='settings-field'><span>Name</span><input name='userName' required /></label><label className='settings-field'><span>Email</span><input name='email' type='email' required /></label><label className='settings-field'><span>Temporary password</span><input name='password' type='password' minLength={12} autoComplete='new-password' required /></label><label className='settings-field'><span>Role</span><select name='role'><option>Member</option><option>Admin</option></select></label><button className='button-primary' type='submit'>Create user</button></form>
			<form className='settings-section settings-form-card' onSubmit={invite}><div><h3>Create invitation</h3><p>The token is shown once, stored hashed, and must be shared through a trusted channel.</p></div><label className='settings-field'><span>Name</span><input name='userName' required /></label><label className='settings-field'><span>Email</span><input name='email' type='email' required /></label><label className='settings-field'><span>Role</span><select name='role'><option>Member</option><option>Admin</option></select></label><label className='settings-field'><span>Expires</span><select name='expiresInHours' defaultValue='24'><option value='1'>1 hour</option><option value='24'>24 hours</option><option value='72'>3 days</option></select></label><button className='button-primary' type='submit'>Create invitation</button></form>
		</div>
		<section className='settings-section'><div><h3>Household users</h3><p>Changes revoke active sessions when identity, role or access changes. The final administrator is protected by the server.</p></div>{loading ? <ModuleState kind='loading' title='Loading users'>Checking Household accounts.</ModuleState> : users.length === 0 ? <p className='muted'>No users were returned.</p> : <div className='users-list'>{users.map((user) => <UserEditor key={user.id} user={user} onUpdated={(updated) => setUsers((current) => current.map((item) => item.id === updated.id ? updated : item))} onNotice={setNotice} onSecret={setOneUseValue} onError={setError} />)}</div>}</section>
	</div>
}
