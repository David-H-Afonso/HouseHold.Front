import { useEffect, useState, type FormEvent } from 'react'
import type { AdminAppCatalogItem, UpdateAppCatalogItemRequest } from '@/models/api/Apps'
import { appCatalogService } from '@/services/AppCatalogService'
import { isApiError } from '@/utils/customFetch'
import './AppCatalogSettingsSection.scss'

interface Props {
	onNotice: (message: string) => void
}

export const AppCatalogSettingsSection = ({ onNotice }: Props) => {
	const [items, setItems] = useState<AdminAppCatalogItem[]>([])
	const [filter, setFilter] = useState('')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let active = true
		void appCatalogService.adminCatalog()
			.then((catalog) => { if (active) setItems(catalog) })
			.catch(() => { if (active) setError('The app catalog could not be loaded.') })
			.finally(() => { if (active) setLoading(false) })
		return () => { active = false }
	}, [])

	const visibleItems = items.filter((item) => {
		const term = filter.trim().toLowerCase()
		return !term || item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term) || item.id.includes(term)
	})

	const replaceItem = (updated: AdminAppCatalogItem) => {
		setItems((current) => current.map((item) => item.id === updated.id ? updated : item))
		onNotice(`${updated.name} catalog settings saved.`)
	}

	return <section className='settings-section app-catalog-settings'>
		<div>
			<h3>App catalog</h3>
			<p>Edit browser-facing metadata and preferred open URLs. Container names and monitoring targets remain server-controlled.</p>
		</div>
		<label className='settings-field app-catalog-settings__search'>
			<span>Find an app</span>
			<input type='search' value={filter} onChange={(event) => setFilter(event.target.value)} placeholder='Name, category, or ID' maxLength={120} />
		</label>
		{loading && <p className='muted' role='status'>Loading app catalog...</p>}
		{error && <p className='error-banner' role='alert'>{error}</p>}
		{!loading && !error && <div className='app-catalog-settings__list'>
			{visibleItems.map((item) => <CatalogEditor key={item.id} item={item} onSaved={replaceItem} />)}
			{visibleItems.length === 0 && <p className='muted'>No catalog entries match this search.</p>}
		</div>}
	</section>
}

const CatalogEditor = ({ item, onSaved }: { item: AdminAppCatalogItem; onSaved: (item: AdminAppCatalogItem) => void }) => {
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		const request: UpdateAppCatalogItemRequest = {
			name: String(form.get('name')).trim(),
			category: String(form.get('category')).trim(),
			description: String(form.get('description')).trim() || null,
			iconUrl: String(form.get('iconUrl')).trim() || null,
			openUrl: String(form.get('openUrl')).trim() || null,
			favorite: form.get('favorite') === 'on',
			enabled: form.get('enabled') === 'on',
		}
		setSaving(true)
		setError(null)
		try {
			onSaved(await appCatalogService.updateCatalogItem(item.id, request))
		} catch (reason) {
			setError(isApiError(reason) && reason.status === 400
				? 'Check the text and HTTP(S) URLs, then try again.'
				: 'This catalog entry could not be saved.')
		} finally {
			setSaving(false)
		}
	}

	return <article className='app-catalog-editor'>
		<header>
			<div><strong>{item.name}</strong><code>{item.id}</code></div>
			<div className='app-catalog-editor__capabilities' aria-label={`${item.name} capabilities`}>
				<span>{item.monitoringEnabled ? 'Monitored' : 'Link only'}</span>
			</div>
		</header>
		<form onSubmit={submit}>
			<div className='app-catalog-editor__grid'>
				<label className='settings-field'><span>Name</span><input name='name' defaultValue={item.name} maxLength={160} required /></label>
				<label className='settings-field'><span>Category</span><input name='category' defaultValue={item.category} maxLength={120} required /></label>
				<label className='settings-field app-catalog-editor__wide'><span>Description</span><textarea name='description' defaultValue={item.description ?? ''} maxLength={1000} rows={2} /></label>
				<label className='settings-field'><span>Preferred open URL</span><input name='openUrl' type='url' defaultValue={item.openUrl ?? ''} placeholder='No web UI' maxLength={500} /></label>
				<label className='settings-field'><span>Icon URL or local path</span><input name='iconUrl' defaultValue={item.iconUrl ?? ''} placeholder='/icons/app.svg' maxLength={500} /></label>
			</div>
			<div className='app-catalog-editor__toggles'>
				<label className='switch-field'><input name='enabled' type='checkbox' defaultChecked={item.enabled} /><span aria-hidden='true' /><div><strong>Visible</strong><small>Show in Apps and dashboard</small></div></label>
				<label className='switch-field'><input name='favorite' type='checkbox' defaultChecked={item.favorite} /><span aria-hidden='true' /><div><strong>Favorite by default</strong><small>Per-user choices still take precedence</small></div></label>
			</div>
			{error && <p className='app-catalog-editor__error' role='alert'>{error}</p>}
			<button className='button-primary' type='submit' disabled={saving}>{saving ? 'Saving...' : `Save ${item.name}`}</button>
		</form>
	</article>
}
