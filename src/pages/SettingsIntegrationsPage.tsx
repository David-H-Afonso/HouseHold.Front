import { useEffect, useState } from 'react'
import { ModuleHeader } from '@/components/Shared'
import type {
	HouseholdConnection,
	HouseholdConnectionStatus,
	HouseholdProviderId,
} from '@/models/api/Integrations'
import { integrationService } from '@/services'
import { BrandMark } from '@/components/Shared'
import { safeExternalUrl } from '@/utils'
import { useUserPreferences } from '@/contexts/useUserPreferences'

type ConnectionAction = 'connect' | 'test' | 'disconnect'
type Banner = { tone: 'success' | 'warning' | 'error'; message: string }

const providerNames: Record<HouseholdProviderId, string> = {
	doit: 'DoIt',
	'games-database': 'Games Database',
	jellywatch: 'Jellywatch',
	'beast-vault': 'Beast Vault',
	'warcraft-archive': 'Warcraft Archive',
}

const scopeNames: Record<string, string> = {
	'profile.read': 'View your profile',
	'tasks.read': 'View tasks',
	'tasks.complete': 'Complete tasks',
	'tasks.undo': 'Undo task completion',
	'tasks.create': 'Create tasks',
	'games.read': 'View games',
	'games.status.write': 'Update game status',
	'activity.read': 'View activity',
	'upcoming.read': 'View upcoming media',
	'media.state.write': 'Update watch state',
	'media.rating.write': 'Update ratings',
	'pokemon.read': 'View Pokemon',
	'pokemon.favorite.write': 'Update favorites',
	'pokemon.notes.write': 'Update notes',
	'pokemon.download': 'Download original Pokemon files',
	'dashboard.read': 'View dashboard',
	'tracking.status.write': 'Update tracking status',
}

const statusLabels: Record<HouseholdConnectionStatus, string> = {
	Disconnected: 'Not connected',
	Connected: 'Connected',
	Expired: 'Reconnect required',
	Error: 'Needs attention',
}

const safeErrors: Record<string, string> = {
	provider_not_configured: 'This application is not configured on the Household server.',
	provider_unavailable: 'The application could not be reached.',
	revocation_failed: 'The application could not be disconnected. Try again.',
	refresh_token_expired: 'Your connection expired. Reconnect to continue.',
	token_unavailable: 'The saved connection can no longer be read. Reconnect to continue.',
	identity_validation_failed: 'The connected account could not be verified.',
}

const formatDate = (value: string | null | undefined, timeZone: string) => {
	if (!value) return null
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date)
}

const readCallbackBanner = (): Banner | null => {
	const params = new URLSearchParams(window.location.search)
	const result = params.get('connection')
	const provider = params.get('provider') as HouseholdProviderId | null
	const reason = params.get('reason')
	if (!provider || !(provider in providerNames) || !result) return null

	if (result === 'connected') return { tone: 'success', message: `${providerNames[provider]} is now connected.` }
	if (reason === 'access_denied') return { tone: 'warning', message: `${providerNames[provider]} connection was cancelled.` }
	return { tone: 'error', message: `${providerNames[provider]} could not be connected. Please try again.` }
}

export const SettingsIntegrationsPage = () => {
	const { preferences } = useUserPreferences()
	const [connections, setConnections] = useState<HouseholdConnection[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [actions, setActions] = useState<Partial<Record<HouseholdProviderId, ConnectionAction>>>({})
	const [banner, setBanner] = useState<Banner | null>(() => readCallbackBanner())

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		if (params.has('connection') || params.has('provider') || params.has('reason')) {
			params.delete('connection')
			params.delete('provider')
			params.delete('reason')
			const query = params.toString()
			window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
		}

		let mounted = true
		integrationService
			.connections()
			.then((data) => {
				if (mounted) setConnections(data)
			})
			.catch(() => {
				if (mounted) setError('Connected applications could not be loaded. Try again.')
			})
			.finally(() => {
				if (mounted) setLoading(false)
			})

		return () => {
			mounted = false
		}
	}, [])

	const setAction = (provider: HouseholdProviderId, action?: ConnectionAction) => {
		setActions((current) => ({ ...current, [provider]: action }))
	}

	const replaceConnection = (updated: HouseholdConnection) => {
		setConnections((current) => current.map((item) => (item.provider === updated.provider ? updated : item)))
	}

	const connect = async (connection: HouseholdConnection) => {
		setAction(connection.provider, 'connect')
		setError(null)
		try {
			const response = await integrationService.authorizeConnection(connection.provider)
			const authorizationUrl = new URL(response.authorizationUrl)
			const configuredOpenUrl = safeExternalUrl(connection.openUrl)
			if (!configuredOpenUrl) throw new Error('Provider URL is unavailable')
			const configuredOrigin = new URL(configuredOpenUrl).origin
			if ((authorizationUrl.protocol !== 'http:' && authorizationUrl.protocol !== 'https:')
				|| authorizationUrl.origin !== configuredOrigin
				|| authorizationUrl.username
				|| authorizationUrl.password) throw new Error('Unsafe URL')
			window.location.assign(authorizationUrl.toString())
		} catch {
			setError(`${connection.displayName} could not start the connection flow. Try again.`)
			setAction(connection.provider)
		}
	}

	const test = async (connection: HouseholdConnection) => {
		setAction(connection.provider, 'test')
		setError(null)
		try {
			const updated = await integrationService.testConnection(connection.provider)
			replaceConnection(updated)
			setBanner(
				updated.status === 'Connected'
					? { tone: 'success', message: `${updated.displayName} connection is working.` }
					: { tone: 'error', message: safeErrors[updated.lastError ?? ''] ?? `${updated.displayName} could not be verified.` }
			)
		} catch {
			setError(`${connection.displayName} could not be verified. Try again.`)
		} finally {
			setAction(connection.provider)
		}
	}

	const disconnect = async (connection: HouseholdConnection) => {
		if (!window.confirm(`Disconnect ${connection.displayName} from Household?`)) return
		setAction(connection.provider, 'disconnect')
		setError(null)
		try {
			await integrationService.disconnect(connection.provider)
			replaceConnection({
				...connection,
				status: 'Disconnected',
				accountDisplayName: null,
				accountId: null,
				grantedScopes: [],
				connectedAt: null,
				lastValidatedAt: null,
				lastError: null,
			})
			setBanner({ tone: 'success', message: `${connection.displayName} was disconnected.` })
		} catch {
			setError(`${connection.displayName} could not be disconnected. Its saved connection was kept so you can retry.`)
		} finally {
			setAction(connection.provider)
		}
	}

	return (
		<div className='page-stack'>
			<ModuleHeader
				title='Connected applications'
				description='Choose which of your accounts Household can use. Every connection is optional and belongs only to you.'
			/>

			{banner && (
				<div className={`connection-banner connection-banner--${banner.tone}`} role='status'>
					<span>{banner.message}</span>
					<button type='button' onClick={() => setBanner(null)} aria-label='Dismiss message'>
						Dismiss
					</button>
				</div>
			)}
			{error && <p className='connection-banner connection-banner--error' role='alert'>{error}</p>}

			{loading ? (
				<section className='settings-panel' aria-busy='true'>
					<p className='muted'>Loading connected applications…</p>
				</section>
			) : (
				<section className='connections-grid' aria-label='Available applications'>
					{connections.map((connection) => {
						const action = actions[connection.provider]
						const isConnected = connection.status !== 'Disconnected'
						const lastValidated = formatDate(connection.lastValidatedAt, preferences.timezone)
						const connectedAt = formatDate(connection.connectedAt, preferences.timezone)

						return (
							<article className={`connection-card connection-card--${connection.status.toLowerCase()}`} key={connection.provider}>
								<header className='connection-card__header'>
									<BrandMark provider={connection.provider} />
									<div>
										<h2>{connection.displayName}</h2>
										<span className={`connection-state connection-state--${connection.status.toLowerCase()}`}>
											{connection.configured ? statusLabels[connection.status] : 'Unavailable'}
										</span>
									</div>
								</header>

								<div className='connection-card__body'>
									{!connection.configured && <p className='muted'>This application has not been configured by the Household administrator.</p>}
									{connection.accountDisplayName && (
										<div className='connection-account'>
											<span>Connected account</span>
											<strong>{connection.accountDisplayName}</strong>
										</div>
									)}
									{connection.lastError && (
										<p className='connection-card__error'>{safeErrors[connection.lastError] ?? 'This connection needs attention.'}</p>
									)}
									{connection.grantedScopes.length > 0 && (
										<div className='connection-permissions'>
											<span>Allowed access</span>
											<ul>
												{connection.grantedScopes.map((scope) => <li key={scope}>{scopeNames[scope] ?? scope}</li>)}
											</ul>
										</div>
									)}
									{(connectedAt || lastValidated) && (
										<p className='connection-card__meta'>
											{lastValidated ? `Last checked ${lastValidated}` : `Connected ${connectedAt}`}
										</p>
									)}
								</div>

								<footer className='connection-card__actions'>
								{safeExternalUrl(connection.openUrl) && (
										<a href={safeExternalUrl(connection.openUrl)!} target='_blank' rel='noopener noreferrer'>Open app</a>
									)}
									{isConnected && (
										<button type='button' onClick={() => test(connection)} disabled={Boolean(action)}>
										{action === 'test' ? 'Checking…' : 'Test'}
										</button>
									)}
									<button
										type='button'
										className='connection-card__primary'
										onClick={() => connect(connection)}
										disabled={!connection.configured || Boolean(action)}
									>
									{action === 'connect' ? 'Opening…' : isConnected ? 'Reconnect' : 'Connect'}
									</button>
									{isConnected && (
										<button type='button' className='connection-card__danger' onClick={() => disconnect(connection)} disabled={Boolean(action)}>
											{action === 'disconnect' ? 'Disconnecting...' : 'Disconnect'}
										</button>
									)}
								</footer>
							</article>
						)
					})}
				</section>
			)}
		</div>
	)
}
