import { useEffect, useState, type CSSProperties } from 'react'
import { ModuleHeader, ModuleState } from '@/components/Shared'
import { useUserPreferences } from '@/contexts/useUserPreferences'
import { dashboardWidgetCatalog, type DashboardWidgetId, type DashboardWidgetSize } from '@/models/api/Preferences'
import type { GameStatusOption } from '@/models/api/Games'
import type { PokemonTagOption } from '@/models/api/Modules'
import { gamesService, moduleService } from '@/services'

export const SettingsDashboardPage = () => {
	const { preferences, updatePreferences, resetPreferences, ready, saving, persistence } = useUserPreferences()
	const [gameStatuses, setGameStatuses] = useState<GameStatusOption[]>([])
	const [pokemonTags, setPokemonTags] = useState<PokemonTagOption[]>([])
	const [optionsLoading, setOptionsLoading] = useState(true)
	const [optionsError, setOptionsError] = useState(false)
	const ordered = [...preferences.widgets].sort((left, right) => left.order - right.order)
	const selectedGameStatuses = preferences.gameStatusIds

	useEffect(() => {
		if (!ready) return
		let active = true
		setOptionsLoading(true)
		Promise.all([gamesService.statuses(), moduleService.pokemonTags()])
			.then(([statuses, tags]) => { if (active) { setGameStatuses(statuses); setPokemonTags(tags); setOptionsError(false) } })
			.catch(() => { if (active) setOptionsError(true) })
			.finally(() => { if (active) setOptionsLoading(false) })
		return () => { active = false }
	}, [ready])

	const toggleGameStatus = (statusId: number) => updatePreferences({
		gameStatusIds: selectedGameStatuses.includes(statusId)
			? selectedGameStatuses.filter((id) => id !== statusId)
			: [...selectedGameStatuses, statusId],
	})
	const moveGameStatus = (statusId: number, direction: -1 | 1) => {
		const index = selectedGameStatuses.indexOf(statusId)
		const targetIndex = index + direction
		if (index < 0 || targetIndex < 0 || targetIndex >= selectedGameStatuses.length) return
		const next = [...selectedGameStatuses]
		;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
		void updatePreferences({ gameStatusIds: next })
	}
	const updateWidget = (id: DashboardWidgetId, changes: Partial<{ visible: boolean; size: DashboardWidgetSize; order: number }>) => updatePreferences((current) => ({ ...current, widgets: current.widgets.map((widget) => widget.id === id ? { ...widget, ...changes } : widget) }))
	const move = (id: DashboardWidgetId, direction: -1 | 1) => {
		const index = ordered.findIndex((widget) => widget.id === id)
		const target = ordered[index + direction]
		if (!target) return
		updatePreferences((current) => ({ ...current, widgets: current.widgets.map((widget) => widget.id === id ? { ...widget, order: target.order } : widget.id === target.id ? { ...widget, order: ordered[index].order } : widget) }))
	}
	return (
		<div className='page-stack settings-page'>
			<ModuleHeader
				title='Dashboard settings'
				description='Choose which operational summaries appear, their order, and how much room they use.'
				actions={<button className='button-secondary' type='button' onClick={resetPreferences} disabled={saving}>Reset layout</button>}
			/>
			{!ready ? <ModuleState kind='loading' title='Loading preferences'>Preparing your dashboard layout.</ModuleState> : <section className='widget-settings-list' aria-label='Dashboard widgets'>{ordered.map((widget, index) => {
				const catalog = dashboardWidgetCatalog.find((item) => item.id === widget.id)!
				return <article key={widget.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', widget.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const source = event.dataTransfer.getData('text/plain') as DashboardWidgetId; if (source && source !== widget.id) { const sourceWidget = ordered.find((entry) => entry.id === source); if (sourceWidget) updatePreferences((current) => ({ ...current, widgets: current.widgets.map((entry) => entry.id === source ? { ...entry, order: widget.order } : entry.id === widget.id ? { ...entry, order: sourceWidget.order } : entry) })) } }}>
					<label className='switch-field'><input type='checkbox' checked={widget.visible} onChange={(event) => updateWidget(widget.id, { visible: event.target.checked })} /><span aria-hidden='true' /><div><strong>{catalog.name}</strong><small>{catalog.description}</small></div></label>
					<label className='widget-size-field'><span>Size</span><select value={widget.size} onChange={(event) => updateWidget(widget.id, { size: event.target.value as DashboardWidgetSize })}>{catalog.allowedSizes.map((size) => <option key={size} value={size}>{size.charAt(0).toUpperCase() + size.slice(1)}</option>)}</select></label>
					<div className='widget-order-buttons'><button type='button' aria-label={`Move ${catalog.name} up`} disabled={index === 0} onClick={() => move(widget.id, -1)}>↑</button><button type='button' aria-label={`Move ${catalog.name} down`} disabled={index === ordered.length - 1} onClick={() => move(widget.id, 1)}>↓</button></div>
				</article>
			})}</section>}
			{ready && <section className='settings-section dashboard-content-settings'>
				<div><h3>Sidebar links</h3><p>Optional external links can be shown alongside the main Household navigation.</p></div>
				<label className='switch-field'><input type='checkbox' checked={preferences.showShoppation} onChange={(event) => void updatePreferences({ showShoppation: event.target.checked })} /><span aria-hidden='true' /><div><strong>Shoppation</strong><small>Open the connected Bungie shop and show the daily reset countdown.</small></div></label>
			</section>}
			{ready && <section className='settings-section dashboard-content-settings'>
				<div><h3>Games Widget</h3><p>Select the statuses to show and arrange their query/display priority. Leave all statuses clear to keep the widget intentionally empty.</p></div>
				{optionsLoading ? <p className='muted'>Loading Games Database statuses…</p> : gameStatuses.length === 0 ? <p className='muted'>No game statuses are available.</p> : <div className='dashboard-status-options'>
					{gameStatuses.map((status) => {
						const selectedIndex = selectedGameStatuses.indexOf(status.id)
						return <div key={status.id}>
							<label><input type='checkbox' checked={selectedIndex >= 0} onChange={() => void toggleGameStatus(status.id)} /><span style={{ '--status-color': status.color || '#64748b' } as CSSProperties} aria-hidden='true' /><strong>{status.name}</strong></label>
							{selectedIndex >= 0 && <div><button type='button' aria-label={`Move ${status.name} earlier`} disabled={selectedIndex === 0} onClick={() => moveGameStatus(status.id, -1)}>↑</button><button type='button' aria-label={`Move ${status.name} later`} disabled={selectedIndex === selectedGameStatuses.length - 1} onClick={() => moveGameStatus(status.id, 1)}>↓</button></div>}
						</div>
					})}
				</div>}
			</section>}
			{ready && <section className='settings-section dashboard-content-settings'>
				<div><h3>Pokémon Widget</h3><p>Choose favorites, a tag, or recent additions. Recent requires Beast Vault to return a stable added timestamp.</p></div>
				<label className='settings-field'><span>Dashboard mode</span><select value={preferences.pokemonDashboardMode} onChange={(event) => void updatePreferences({ pokemonDashboardMode: event.target.value as 'favorites' | 'recent' | 'tag' })}><option value='favorites'>Favorites</option><option value='recent'>Recent additions</option><option value='tag'>Selected tag</option></select></label>
				{preferences.pokemonDashboardMode === 'tag' && <label className='settings-field'><span>Tag</span><select value={preferences.pokemonDashboardTagId ?? ''} onChange={(event) => void updatePreferences({ pokemonDashboardTagId: event.target.value ? Number(event.target.value) : null })}><option value=''>Choose a tag</option>{pokemonTags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name} ({tag.pokemonCount})</option>)}</select></label>}
				{optionsError && <p className='error-banner' role='alert'>Provider options could not be loaded. Existing settings remain unchanged.</p>}
			</section>}
			<p className='settings-persistence' role='status'>{saving ? 'Saving preferences…' : `Saved to ${persistence === 'server' ? 'your Household account' : 'this device while server persistence is unavailable'}.`}</p>
		</div>
	)
}
