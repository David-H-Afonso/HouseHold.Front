import { useEffect, useState, type FormEvent } from 'react'
import { useUserPreferences } from '@/contexts/useUserPreferences'
import { monitoredRepositories, type PokemonSpriteSource } from '@/models/api/Preferences'
import { useAppSelector } from '@/store/hooks'
import { selectIsAdmin } from '@/store/features/auth/selector'
import { casaOsService, operationsService } from '@/services'
import type { GitHubActionsConfig, JellyfinConfig } from '@/models/api/Operations'
import type { CasaOsConfig } from '@/models/api/Apps'
import { isApiError } from '@/utils/customFetch'
import { SeerrAdminSettings } from '@/components/Seerr'
import { AppCatalogSettingsSection } from '@/components/Apps'
import './SettingsAppsPage.scss'

const spriteSources: Array<{ value: PokemonSpriteSource; label: string }> = [
	{ value: 'home', label: 'Pokémon HOME' },
	{ value: 'artwork', label: 'Official artwork' },
	{ value: 'default', label: 'Default game sprite' },
	{ value: 'showdown', label: 'Pokémon Showdown' },
	{ value: 'github', label: 'GitHub sprite cache' },
]

export const SettingsAppsPage = () => {
	const { preferences, updatePreferences, saving, persistence, ready } = useUserPreferences()
	const isAdmin = useAppSelector(selectIsAdmin)
	const [jellyfinId, setJellyfinId] = useState(preferences.jellyfinUserId)
	const [jellyfinConfig, setJellyfinConfig] = useState<JellyfinConfig | null>(null)
	const [githubConfig, setGitHubConfig] = useState<GitHubActionsConfig | null>(null)
	const [casaOsConfig, setCasaOsConfig] = useState<CasaOsConfig | null>(null)
	const [notice, setNotice] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (ready) setJellyfinId(preferences.jellyfinUserId)
	}, [preferences.jellyfinUserId, ready])

	useEffect(() => {
		if (!isAdmin) return
		void Promise.all([operationsService.jellyfinConfig(), operationsService.githubConfig(), casaOsService.config()])
			.then(([jellyfin, github, casaos]) => { setJellyfinConfig(jellyfin); setGitHubConfig(github); setCasaOsConfig(casaos) })
			.catch(() => setError('Server integration configuration could not be loaded.'))
	}, [isAdmin])

	const configureJellyfin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		setError(null)
		try {
			const result = await operationsService.updateJellyfinConfig({
				internalUrl: String(form.get('internalUrl')).trim(),
				publicUrl: String(form.get('publicUrl')).trim(),
				apiKey: String(form.get('apiKey')).trim() || null,
			})
			setJellyfinConfig(result)
			event.currentTarget.reset()
			setNotice('Jellyfin configuration saved. The API key remains write-only.')
		} catch { setError('Jellyfin configuration could not be saved.') }
	}

	const configureGitHub = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		setError(null)
		try {
			const result = await operationsService.updateGitHubConfig(String(form.get('token')).trim())
			setGitHubConfig(result)
			event.currentTarget.reset()
			setNotice('GitHub monitor configured. The token remains write-only and server-side.')
		} catch { setError('GitHub Actions configuration could not be saved.') }
	}

	const configureCasaOs = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const formElement = event.currentTarget
		const form = new FormData(formElement)
		const token = String(form.get('token')).trim()
		const refreshToken = String(form.get('refreshToken')).trim()
		setError(null)
		try {
			const result = await casaOsService.updateConfig({
				internalBaseUrl: String(form.get('baseUrl')).trim(),
				...(token ? { rawToken: token } : {}),
				...(refreshToken ? { rawRefreshToken: refreshToken } : {}),
			})
			setCasaOsConfig(result)
			formElement.reset()
			setNotice('CasaOS connection saved. Household will refresh it automatically when a refresh token is configured.')
		} catch (reason) {
			setError(isApiError(reason) && reason.code === 'casaos_token_pair_invalid'
				? 'CasaOS rejected this token pair. Sign in to CasaOS again, then copy both fresh tokens from the same session.'
				: 'CasaOS configuration could not be saved.')
		}
	}

	return <div className='settings-page'>
		<header><h2>Apps & providers</h2><p>Choose provider-specific display preferences and identity mappings.</p></header>
		{notice && <p className='notice-banner' role='status'>{notice}</p>}
		{error && <p className='error-banner' role='alert'>{error}</p>}
		<section className='settings-section'>
			<div><h3>Pokémon sprites</h3><p>The selected source is sent to the Household gateway. Beast Vault remains the safe fallback.</p></div>
			<label className='settings-field'><span>Sprite source</span><select value={preferences.pokemonSpriteSource} onChange={(event) => updatePreferences({ pokemonSpriteSource: event.target.value as PokemonSpriteSource })}>{spriteSources.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}</select></label>
		</section>
		<section className='settings-section'>
			<div><h3>Jellyfin profile mapping</h3><p>Household stores the mapping only. Changes require administrator approval before Seerr can use this identity.</p></div>
			<form onSubmit={(event) => { event.preventDefault(); void updatePreferences({ jellyfinUserId: jellyfinId.trim() }) }}>
				<label className='settings-field'><span>Jellyfin User ID</span><input name='jellyfinUserId' value={jellyfinId} onChange={(event) => setJellyfinId(event.target.value)} placeholder='Not mapped' autoComplete='off' /></label>
				<button className='button-primary' type='submit' disabled={saving}>Save mapping</button>
			</form>
		</section>
		<section className='settings-section'>
			<div><h3>Workflow visibility</h3><p>Choose which allowlisted repositories appear in Workflows and its dashboard widget.</p></div>
			<div className='repository-settings'>{monitoredRepositories.map((repository) => <label className='switch-field' key={repository}><input type='checkbox' checked={preferences.repositoryVisibility[repository] !== false} onChange={(event) => void updatePreferences({ repositoryVisibility: { ...preferences.repositoryVisibility, [repository]: event.target.checked } })} /><span aria-hidden='true' /><div><strong>{repository.split('/')[1]}</strong><small>{repository}</small></div></label>)}</div>
		</section>
		{isAdmin && <>
			<SeerrAdminSettings onNotice={(message) => { setError(null); setNotice(message) }} />
			<AppCatalogSettingsSection onNotice={(message) => { setError(null); setNotice(message) }} />
			<section className='settings-section'>
				<div>
					<h3>CasaOS app management</h3>
					<p>Status: <strong>{casaOsConfig?.configured ? 'Configured' : 'Not configured'}</strong>. Household uses this server-side connection to check and queue individual app updates. Automatic rollback stays disabled unless safety can be proven.</p>
					<p>Sign in to CasaOS, open browser DevTools → Application → Local Storage, and copy <code>access_token</code> and <code>refresh_token</code> from the same session. Household validates and rotates them when saved, then renews them automatically every hour.</p>
					<p>Tokens are write-only: Household never returns or displays them. You only need to repeat this after CasaOS UserService restarts and invalidates every existing CasaOS session.</p>
				</div>
				<form onSubmit={configureCasaOs}>
					<label className='settings-field'><span>CasaOS URL</span><input name='baseUrl' type='url' placeholder='http://casaos.local' autoComplete='url' required /></label>
					<label className='settings-field'><span>{casaOsConfig?.hasToken ? 'New token (leave empty to retain)' : 'Token'}</span><input name='token' type='password' autoComplete='new-password' required={!casaOsConfig?.hasToken} /></label>
					<label className='settings-field'><span>{casaOsConfig?.hasRefreshToken ? 'New refresh token (leave empty to retain)' : 'Refresh token'}</span><input name='refreshToken' type='password' autoComplete='new-password' required={!casaOsConfig?.hasRefreshToken} /></label>
					<button className='button-primary' type='submit'>Save CasaOS connection</button>
				</form>
			</section>
			<section className='settings-section'>
				<div><h3>Jellyfin server</h3><p>Status: <strong>{jellyfinConfig?.configured ? 'Configured' : 'Not configured'}</strong>. Re-enter both URLs when rotating the write-only key.</p></div>
				<form onSubmit={configureJellyfin}><label className='settings-field'><span>Internal server URL</span><input name='internalUrl' type='url' placeholder='http://jellyfin:8096' required /></label><label className='settings-field'><span>Public browser URL</span><input name='publicUrl' type='url' placeholder='https://jellyfin.example.com' required /></label><label className='settings-field'><span>{jellyfinConfig?.hasApiKey ? 'New API key (leave empty to retain)' : 'API key'}</span><input name='apiKey' type='password' autoComplete='new-password' required={!jellyfinConfig?.hasApiKey} /></label><button className='button-primary' type='submit'>Save Jellyfin</button></form>
			</section>
			<section className='settings-section'>
				<div><h3>GitHub Actions monitor</h3><p>Status: <strong>{githubConfig?.configured ? 'Configured' : 'Not configured'}</strong>. Use a fine-grained, read-only token limited to the 12 repositories above.</p></div>
				<form onSubmit={configureGitHub}><label className='settings-field'><span>{githubConfig?.hasToken ? 'Replace read-only token' : 'Read-only token'}</span><input name='token' type='password' minLength={20} autoComplete='new-password' required /></label><button className='button-primary' type='submit'>Save GitHub token</button></form>
			</section>
		</>}
		<p className='settings-persistence' role='status'>Preferences are currently saved to {persistence === 'server' ? 'your Household account' : 'this device until the preferences endpoint is available'}.</p>
	</div>
}
