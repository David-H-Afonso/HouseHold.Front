import { useEffect, useState, type FormEvent } from 'react'
import type { SeerrConfig, SeerrMappingSource, SeerrUserMapping, UpdateSeerrUserMappingRequest } from '@/models/api/Seerr'
import { seerrService } from '@/services'
import { isApiError } from '@/utils/customFetch'

const adminError = (reason: unknown, fallback: string) => isApiError(reason) ? reason.message : fallback

const SeerrMappingEditor = ({
	mapping,
	pending,
	error,
	onSave,
	onClear,
}: {
	mapping: SeerrUserMapping
	pending: boolean
	error: string | null
	onSave: (mapping: SeerrUserMapping, request: UpdateSeerrUserMappingRequest) => void
	onClear: (mapping: SeerrUserMapping) => void
}) => {
	const [source, setSource] = useState<SeerrMappingSource>(mapping.activeSource ?? 'jellyfin')
	const [jellyfinUserId, setJellyfinUserId] = useState(mapping.jellyfinUserId ?? '')
	const [seerrUserId, setSeerrUserId] = useState(mapping.seerrUserIdOverride?.toString() ?? '')

	useEffect(() => {
		setSource(mapping.activeSource ?? 'jellyfin')
		setJellyfinUserId(mapping.jellyfinUserId ?? '')
		setSeerrUserId(mapping.seerrUserIdOverride?.toString() ?? '')
	}, [mapping])

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (source === 'jellyfin') onSave(mapping, { source, jellyfinUserId: jellyfinUserId.trim() })
		else onSave(mapping, { source, seerrUserId: Number(seerrUserId) })
	}

	const hasMapping = mapping.activeSource !== null || mapping.jellyfinMappingApproved || mapping.seerrUserIdOverride !== null
	return <article className='seerr-mapping-card' aria-busy={pending}>
		<header><div><strong>{mapping.userName}</strong><span>{mapping.activeSource ? `Active source: ${mapping.activeSource === 'jellyfin' ? 'Jellyfin' : 'Numeric override'}` : 'Not mapped'}</span></div>{mapping.activeSource && <span className='seerr-mapping-card__status'>Mapped</span>}</header>
		<form onSubmit={submit}>
			<fieldset disabled={pending}>
				<legend>Mapping source</legend>
				<div className='seerr-mapping-source'>
					<label><input type='radio' name={`mapping-source-${mapping.householdUserId}`} checked={source === 'jellyfin'} onChange={() => setSource('jellyfin')} /><span><strong>Jellyfin</strong><small>Resolve the matching Seerr user from a Jellyfin user ID.</small></span></label>
					<label><input type='radio' name={`mapping-source-${mapping.householdUserId}`} checked={source === 'override'} onChange={() => setSource('override')} /><span><strong>Numeric override</strong><small>Link directly to a known Seerr user ID.</small></span></label>
				</div>
			</fieldset>
			{source === 'jellyfin' ? <label className='settings-field'><span>Jellyfin User ID</span><input name={`jellyfinUserId-${mapping.householdUserId}`} value={jellyfinUserId} onChange={(event) => setJellyfinUserId(event.target.value)} autoComplete='off' spellCheck={false} maxLength={128} required disabled={pending} /></label> : <label className='settings-field'><span>Seerr User ID</span><input name={`seerrUserId-${mapping.householdUserId}`} type='number' min='1' step='1' inputMode='numeric' value={seerrUserId} onChange={(event) => setSeerrUserId(event.target.value)} autoComplete='off' required disabled={pending} /></label>}
			{error && <p className='seerr-mapping-card__error' role='alert'>{error}</p>}
			<div className='seerr-mapping-card__actions'><button className='button-primary' type='submit' disabled={pending}>{pending ? 'Saving…' : 'Save mapping'}</button><button className='button-secondary' type='button' disabled={pending || !hasMapping} onClick={() => onClear(mapping)}>Clear mapping</button></div>
		</form>
	</article>
}

export const SeerrAdminSettings = ({ onNotice }: { onNotice: (message: string) => void }) => {
	const [config, setConfig] = useState<SeerrConfig | null>(null)
	const [mappings, setMappings] = useState<SeerrUserMapping[]>([])
	const [internalUrl, setInternalUrl] = useState('')
	const [publicUrl, setPublicUrl] = useState('')
	const [apiKey, setApiKey] = useState('')
	const [loading, setLoading] = useState(true)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [configPending, setConfigPending] = useState(false)
	const [configError, setConfigError] = useState<string | null>(null)
	const [pendingMappings, setPendingMappings] = useState<Set<string>>(() => new Set())
	const [mappingErrors, setMappingErrors] = useState<Record<string, string>>({})

	const load = async (signal?: AbortSignal) => {
		setLoading(true)
		setLoadError(null)
		try {
			const [nextConfig, nextMappings] = await Promise.all([seerrService.config(signal), seerrService.mappings(signal)])
			setConfig(nextConfig)
			setMappings(nextMappings)
			setInternalUrl(nextConfig.internalUrl ?? '')
			setPublicUrl(nextConfig.publicUrl ?? '')
		} catch (reason) {
			if (!signal?.aborted) setLoadError(adminError(reason, 'Seerr administration settings could not be loaded.'))
		} finally {
			if (!signal?.aborted) setLoading(false)
		}
	}

	useEffect(() => {
		const controller = new AbortController()
		void load(controller.signal)
		return () => controller.abort()
	}, [])

	const saveConfig = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setConfigPending(true)
		setConfigError(null)
		try {
			const next = await seerrService.updateConfig({
				internalUrl: internalUrl.trim(),
				publicUrl: publicUrl.trim(),
				...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
			})
			setConfig(next)
			setInternalUrl(next.internalUrl ?? internalUrl.trim())
			setPublicUrl(next.publicUrl ?? publicUrl.trim())
			setApiKey('')
			onNotice('Seerr configuration saved. The API key remains write-only.')
		} catch (reason) {
			setConfigError(adminError(reason, 'Seerr configuration could not be saved.'))
		} finally {
			setConfigPending(false)
		}
	}

	const setMappingPending = (householdUserId: string, pending: boolean) => setPendingMappings((current) => {
		const next = new Set(current)
		if (pending) next.add(householdUserId)
		else next.delete(householdUserId)
		return next
	})

	const saveMapping = async (mapping: SeerrUserMapping, request: UpdateSeerrUserMappingRequest) => {
		setMappingPending(mapping.householdUserId, true)
		setMappingErrors((current) => ({ ...current, [mapping.householdUserId]: '' }))
		try {
			await seerrService.updateMapping(mapping.householdUserId, request)
			setMappings(await seerrService.mappings())
			onNotice(`${mapping.userName}'s Seerr mapping was saved.`)
		} catch (reason) {
			setMappingErrors((current) => ({ ...current, [mapping.householdUserId]: adminError(reason, 'This user mapping could not be saved.') }))
		} finally {
			setMappingPending(mapping.householdUserId, false)
		}
	}

	const clearMapping = async (mapping: SeerrUserMapping) => {
		setMappingPending(mapping.householdUserId, true)
		setMappingErrors((current) => ({ ...current, [mapping.householdUserId]: '' }))
		try {
			await seerrService.clearMapping(mapping.householdUserId)
			setMappings(await seerrService.mappings())
			onNotice(`${mapping.userName}'s Seerr mapping was cleared.`)
		} catch (reason) {
			setMappingErrors((current) => ({ ...current, [mapping.householdUserId]: adminError(reason, 'This user mapping could not be cleared.') }))
		} finally {
			setMappingPending(mapping.householdUserId, false)
		}
	}

	return <>
		<section className='settings-section seerr-admin-config' aria-busy={loading || configPending}>
			<div><h3>Seerr server</h3><p>Status: <strong>{loading ? 'Checking…' : config?.configured ? config.reachable ? 'Connected' : 'Configured, unreachable' : 'Not configured'}</strong>{config?.version ? ` · Version ${config.version}` : ''}. Household keeps the API key server-side and write-only.</p></div>
			{loadError ? <div className='seerr-settings-error' role='alert'><p>{loadError}</p><button className='button-secondary' type='button' onClick={() => void load()}>Try again</button></div> : <form onSubmit={saveConfig}>
				<label className='settings-field'><span>Internal server URL</span><input name='seerrInternalUrl' type='url' value={internalUrl} onChange={(event) => setInternalUrl(event.target.value)} placeholder='http://seerr:5055…' autoComplete='url' maxLength={2048} required disabled={configPending} /></label>
				<label className='settings-field'><span>Public browser URL</span><input name='seerrPublicUrl' type='url' value={publicUrl} onChange={(event) => setPublicUrl(event.target.value)} placeholder='https://seerr.example.com…' autoComplete='url' maxLength={2048} required disabled={configPending} /></label>
				<label className='settings-field'><span>{config?.hasApiKey ? 'New API key (leave empty to retain)' : 'API key'}</span><input name='seerrApiKey' type='password' value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete='new-password' maxLength={1000} required={!config?.hasApiKey} disabled={configPending} /></label>
				{configError && <p className='seerr-settings-error' role='alert'>{configError}</p>}
				<button className='button-primary' type='submit' disabled={configPending}>{configPending ? 'Saving Seerr…' : 'Save Seerr'}</button>
			</form>}
		</section>
		<section className='settings-section seerr-mappings-section' aria-busy={loading}>
			<div><h3>Seerr user mappings</h3><p>Choose one verified identity source per Household user. Jellyfin resolves the linked Seerr account; numeric override targets a specific Seerr user ID.</p></div>
			{loading && <p role='status'>Loading Seerr user mappings…</p>}
			{!loading && !loadError && mappings.length === 0 && <p>No Household users are available to map.</p>}
			{!loading && mappings.length > 0 && <div className='seerr-mapping-list'>{mappings.map((mapping) => <SeerrMappingEditor key={mapping.householdUserId} mapping={mapping} pending={pendingMappings.has(mapping.householdUserId)} error={mappingErrors[mapping.householdUserId] || null} onSave={saveMapping} onClear={clearMapping} />)}</div>}
		</section>
	</>
}
