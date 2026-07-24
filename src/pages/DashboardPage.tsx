import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark, FallbackImage, HorizontalScroller, Icon, ModuleHeader, TodayTaskActionRow } from '@/components/Shared'
import { useTodayModule } from '@/hooks'
import { useUserPreferences } from '@/contexts/useUserPreferences'
import type { AppLauncherItem } from '@/models/api/Apps'
import type { GameModuleItem, GameStatusOption } from '@/models/api/Games'
import type { JellyfinModuleResponse, WorkflowRun, WorkflowsResponse } from '@/models/api/Operations'
import type { MediaModuleResponse, PokemonModuleItem, UpcomingMedia, WarcraftWeeklyResponse } from '@/models/api/Modules'
import type { DashboardWidgetId, DashboardWidgetPreference } from '@/models/api/Preferences'
import { appCatalogService } from '@/services/AppCatalogService'
import { gamesService, moduleService, operationsService } from '@/services'
import { safeExternalUrl } from '@/utils'
import './DashboardPage.scss'

interface WidgetState<T> { loading: boolean; data: T | null; error: boolean }
const pendingState = <T,>(): WidgetState<T> => ({ loading: true, data: null, error: false })
const successState = <T,>(data: T): WidgetState<T> => ({ loading: false, data, error: false })
const failedState = <T,>(): WidgetState<T> => ({ loading: false, data: null, error: true })
const dateValueInTimeZone = (timeZone: string) => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const upcomingDate = (item: UpcomingMedia) => {
	const fullUtc = item.airTimeUtc ? new Date(item.airTimeUtc) : null
	if (fullUtc && !Number.isNaN(fullUtc.getTime())) return fullUtc
	return new Date(`${item.airDate}T${item.airTime ?? '12:00:00'}`)
}
const normalize = (value: string) => value.replace(/[\s_-]/g, '').toLowerCase()
const canonicalWarcraftStatus = (value: string) => ({ completedlastday: 'lastday', completedlastweek: 'lastweek' })[normalize(value)] ?? normalize(value)
const statusLabel = (value: string) => ({ notstarted: 'Not started', inprogress: 'In progress', lastday: 'Last day', lastweek: 'Last week', finished: 'Finished', pending: 'Pending' })[canonicalWarcraftStatus(value)] ?? value
const warcraftNextStatuses = (item: WarcraftWeeklyResponse['items'][number]) => {
	const status = canonicalWarcraftStatus(item.status)
	const base: Record<string, string[]> = {
		notstarted: ['Pending'], pending: ['NotStarted', 'InProgress'], inprogress: ['Pending', 'Finished'],
		finished: ['NotStarted', 'InProgress'], lastday: ['NotStarted', 'Finished'], lastweek: ['NotStarted', 'Finished'],
	}
	const next = [...(base[status] ?? [])]
	if (status === 'finished' && item.period?.toLowerCase() === 'daily') next.push('LastDay')
	if (status === 'finished' && item.period?.toLowerCase() === 'weekly') next.push('LastWeek')
	return next
}
const workflowState = (run: WorkflowRun) => run.status === 'completed' ? (run.conclusion ?? 'unknown') : (run.status ?? 'unknown')
const workflowDuration = (run: WorkflowRun) => {
	if (!run.startedAt) return null
	const start = new Date(run.startedAt).getTime()
	const end = run.completedAt ? new Date(run.completedAt).getTime() : Date.now()
	if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null
	const seconds = Math.round((end - start) / 1000)
	return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

const WidgetShell = ({ id, title, provider, link, children, state, size }: { id: DashboardWidgetId; title: string; provider: string; link: string; children: ReactNode; state: WidgetState<unknown>; size: string }) => <section className={`operational-widget operational-widget--${id} is-${size}`}>
	<header><div><span>{provider}</span><h2>{title}</h2></div><Link to={link} aria-label={`Open ${title}`}><Icon name='external' /></Link></header>
	{state.loading ? <div className='widget-skeleton' aria-label={`Loading ${title}`}><i /><i /><i /></div> : state.error ? <div className='widget-state is-error'><strong>Unavailable</strong><span>This provider did not respond.</span><Link to='/settings/integrations'>Review integration</Link></div> : children}
</section>

const DashboardWidgetSlot = ({ widget, index, children }: { widget: DashboardWidgetPreference; index: number; children: ReactNode }) => {
	const slotRef = useRef<HTMLDivElement>(null)
	const contentRef = useRef<HTMLDivElement>(null)
	const lane = widget.id === 'app-status' || widget.size === 'wide' ? 'wide' : index % 2 === 0 ? 'left' : 'right'

	useLayoutEffect(() => {
		const slot = slotRef.current
		const content = contentRef.current
		if (!slot || !content) return
		const updateSpan = () => slot.style.setProperty('--dashboard-row-span', String(Math.ceil((content.getBoundingClientRect().height + 24) / 8)))
		const observer = new ResizeObserver(updateSpan)
		observer.observe(content)
		updateSpan()
		return () => observer.disconnect()
	}, [])

	return <div ref={slotRef} className={`dashboard-widget-slot dashboard-widget-slot--${widget.id} is-${widget.size}`} data-lane={lane}>
		<div ref={contentRef}>{children}</div>
	</div>
}

export const DashboardPage = () => {
	const { preferences, ready } = useUserPreferences()
	const today = useTodayModule(dateValueInTimeZone(preferences.timezone), preferences.timezone)
	const [games, setGames] = useState<WidgetState<GameModuleItem[]>>(pendingState)
	const [statuses, setStatuses] = useState<GameStatusOption[]>([])
	const [media, setMedia] = useState<WidgetState<UpcomingMedia[]>>(pendingState)
	const [warcraft, setWarcraft] = useState<WidgetState<WarcraftWeeklyResponse>>(pendingState)
	const [apps, setApps] = useState<WidgetState<AppLauncherItem[]>>(pendingState)
	const [pokemon, setPokemon] = useState<WidgetState<PokemonModuleItem[]>>(pendingState)
	const [jellyfin, setJellyfin] = useState<WidgetState<JellyfinModuleResponse>>(pendingState)
	const [workflows, setWorkflows] = useState<WidgetState<WorkflowsResponse>>(pendingState)
	const [refreshKey, setRefreshKey] = useState(0)
	const [pendingWarcraft, setPendingWarcraft] = useState<Set<number | string>>(() => new Set())
	const [warcraftErrors, setWarcraftErrors] = useState<Record<string, string>>({})
	const orderedWidgets = [...preferences.widgets].filter((widget) => widget.visible).sort((left, right) => left.order - right.order)

	useEffect(() => {
		if (!ready) return
		let active = true
		const loadGames = async () => {
			const availableStatuses = await gamesService.statuses(); if (active) setStatuses(availableStatuses)
			const selected = preferences.gameStatusIds
			if (!selected.length) return []
			const results = await Promise.all(selected.map((statusId) => gamesService.list({ statusId, page: 1, pageSize: 30 })))
			return [...new Map(results.flatMap((result) => result.items).map((item) => [item.id, item])).values()]
		}
		setGames(pendingState()); setMedia(pendingState()); setWarcraft(pendingState()); setApps(pendingState()); setPokemon(pendingState()); setJellyfin(pendingState()); setWorkflows(pendingState())
		const settle = <T,>(promise: Promise<T>, setter: (state: WidgetState<T>) => void) => promise.then((data) => { if (active) setter(successState(data)) }).catch(() => { if (active) setter(failedState()) })
		void settle(loadGames(), setGames)
		void settle(moduleService.media().then((response: MediaModuleResponse) => [...response.upcoming].sort((a, b) => upcomingDate(a).getTime() - upcomingDate(b).getTime())), setMedia)
		void settle(moduleService.warcraft(), setWarcraft)
		void settle(appCatalogService.list(), setApps)
		if (preferences.pokemonDashboardMode === 'recent') setPokemon(successState([]))
		else if (preferences.pokemonDashboardMode === 'tag' && !preferences.pokemonDashboardTagId) setPokemon(successState([]))
		else void settle(moduleService.pokemon({ search: '', tagIds: preferences.pokemonDashboardMode === 'tag' && preferences.pokemonDashboardTagId ? [preferences.pokemonDashboardTagId] : [], skip: 0, take: 12, spriteSource: preferences.pokemonSpriteSource }).then((result) => result.items.filter((item) => preferences.pokemonDashboardMode !== 'favorites' || item.favorite)), setPokemon)
		void settle(operationsService.jellyfin(), setJellyfin)
		void settle(operationsService.workflows(), setWorkflows)
		return () => { active = false }
	}, [ready, refreshKey, preferences.gameStatusIds.join(','), preferences.pokemonSpriteSource, preferences.pokemonDashboardMode, preferences.pokemonDashboardTagId])

	const updateGame = async (game: GameModuleItem, statusId: number) => {
		setGames((current) => current.data ? successState(current.data.map((item) => item.id === game.id ? { ...item, statusId, statusName: statuses.find((status) => status.id === statusId)?.name } : item)) : current)
		try { const updated = await gamesService.updateStatus(game.id, statusId); setGames((current) => current.data ? successState(current.data.map((item) => item.id === updated.id ? updated : item)) : current) } catch { try { const canonical = await gamesService.get(game.id); setGames((current) => current.data ? successState(current.data.map((item) => item.id === canonical.id ? canonical : item)) : current) } catch { /* keep all other games visible */ } }
	}
	const updateWarcraft = async (item: WarcraftWeeklyResponse['items'][number], status: string) => {
		if (pendingWarcraft.has(item.id)) return
		const previous = warcraft.data
		setWarcraftErrors((current) => ({ ...current, [String(item.id)]: '' }))
		setPendingWarcraft((current) => new Set(current).add(item.id))
		setWarcraft((current) => current.data ? successState({ ...current.data, items: current.data.items.map((entry) => entry.id === item.id ? { ...entry, status } : entry) }) : current)
		try {
			const updated = await moduleService.updateWarcraftStatus(item.id, status)
			setWarcraft((current) => current.data ? successState({ ...current.data, items: current.data.items.map((entry) => entry.id === updated.id ? updated : entry) }) : current)
		} catch {
			try { setWarcraft(successState(await moduleService.warcraft())) }
			catch { if (previous) setWarcraft(successState(previous)) }
			setWarcraftErrors((current) => ({ ...current, [String(item.id)]: 'Status was not confirmed; the canonical list was restored.' }))
		} finally {
			setPendingWarcraft((current) => { const next = new Set(current); next.delete(item.id); return next })
		}
	}
	const visibleWorkflowRuns = (workflows.data?.repositories ?? []).filter((run) => preferences.repositoryVisibility[run.repository] !== false)
	const failedRuns = visibleWorkflowRuns.filter((run) => workflowState(run) === 'failure')
	const runningRuns = visibleWorkflowRuns.filter((run) => ['in_progress', 'queued', 'waiting', 'requested', 'pending'].includes(workflowState(run)))
	const latestSuccess = visibleWorkflowRuns.filter((run) => workflowState(run) === 'success').sort((left, right) => new Date(right.completedAt ?? right.startedAt ?? 0).getTime() - new Date(left.completedAt ?? left.startedAt ?? 0).getTime())[0]
	const workflowSummary = [...failedRuns, ...runningRuns, ...(latestSuccess ? [latestSuccess] : [])].filter((run, index, list) => list.findIndex((item) => item.repository === run.repository) === index).slice(0, 5)
	const jellyfinItems = jellyfin.data?.continueWatching.length ? jellyfin.data.continueWatching : jellyfin.data?.nextUp.slice(0, 3) ?? []
	const appStatusItems = (apps.data ?? []).filter((app) => app.favorite || app.frontStatus !== 'healthy' || app.apiStatus !== 'healthy').slice(0, 8)

	const content: Record<DashboardWidgetId, ReactNode> = {
		'app-status': <section className='app-status-strip'><header><div><span>Catalog health</span><h2>Applications</h2></div><Link to='/apps'>Open catalog</Link></header>{apps.loading ? <div className='status-skeleton' /> : apps.error ? <div className='widget-state is-error'>Application health is unavailable.</div> : appStatusItems.length ? <div>{appStatusItems.map((app) => { const status = app.frontStatus === 'healthy' && app.apiStatus === 'healthy' ? 'ready' : app.frontStatus === 'offline' || app.apiStatus === 'offline' ? 'offline' : 'degraded'; const text = `${app.name}: front ${app.frontStatus}, API ${app.apiStatus}${app.userConnectionStatus !== 'not_applicable' ? `, account ${app.userConnectionStatus}` : ''}`; return <div key={app.id} aria-label={text} title={text}><BrandMark provider={app.id} name={app.name} iconUrl={app.iconUrl} size='small' /><i className={`status-led is-${status}`} aria-hidden='true' /><span>{app.name}<small>{status === 'ready' ? 'Healthy' : status === 'offline' ? 'Offline' : 'Needs attention'}</small></span></div> })}</div> : <p className='widget-empty'>No app catalog entries are configured.</p>}</section>,
		games: <WidgetShell id='games' title='Your games' provider='Games Database' link='/games' state={games} size={orderedWidgets.find((widget) => widget.id === 'games')?.size ?? 'medium'}>{games.data?.length ? <HorizontalScroller label='Dashboard games'><div className='dashboard-carousel dashboard-carousel--games'>{games.data.map((game) => <article key={game.id} className='dashboard-game-card'><div><FallbackImage src={game.cover} alt={`${game.name} cover`} fallbackLabel={game.name} width={132} height={198} />{game.favorite && <b title='Favorite'><Icon name='star' /></b>}</div><strong>{game.name}</strong><select value={game.statusId} aria-label={`Status for ${game.name}`} onChange={(event) => updateGame(game, Number(event.target.value))}>{statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select></article>)}</div></HorizontalScroller> : <p className='widget-empty'>{preferences.gameStatusIds.length ? 'No games match the selected statuses.' : 'Choose game statuses in Dashboard Settings.'}</p>}</WidgetShell>,
		today: <WidgetShell id='today' title="Today's tasks" provider='DoIt' link='/today' state={{ loading: today.loading && !today.data, data: today.data, error: today.providerError }} size={orderedWidgets.find((widget) => widget.id === 'today')?.size ?? 'compact'}>{today.data && <><div className='dashboard-progress'><strong>{today.data.progress.done}/{today.data.progress.total}</strong><span>resolved today</span><i><b style={{ width: `${today.data.progress.total ? (today.data.progress.done / today.data.progress.total) * 100 : 0}%` }} /></i></div><div className='dashboard-task-list'>{today.data.tasks.slice(0, 5).map((task) => <TodayTaskActionRow key={task.occurrenceId} compact task={task} pending={today.pendingOccurrences.has(task.occurrenceId)} onAction={today.runAction} />)}</div></>}</WidgetShell>,
		jellywatch: <WidgetShell id='jellywatch' title='Next 7 days' provider='Jellywatch' link='/media' state={media} size={orderedWidgets.find((widget) => widget.id === 'jellywatch')?.size ?? 'medium'}>{media.data?.length ? <HorizontalScroller label='Upcoming Jellywatch episodes'><div className='dashboard-carousel dashboard-carousel--media'>{media.data.map((item) => <article key={`${item.mediaItemId}-${item.episodeNumber}`}><FallbackImage src={item.posterUrl} alt={`${item.seriesTitle} poster`} fallbackLabel={item.seriesTitle} /><strong>{item.seriesTitle}</strong><span>S{item.seasonNumber} E{item.episodeNumber}</span><time>{new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: preferences.timezone }).format(upcomingDate(item))}</time></article>)}</div></HorizontalScroller> : <p className='widget-empty'>Nothing is scheduled in the provider's 7-day window.</p>}</WidgetShell>,
		jellyfin: <WidgetShell id='jellyfin' title={jellyfin.data?.continueWatching.length ? 'Continue Watching' : 'Next Up'} provider='Jellyfin' link='/jellyfin' state={jellyfin} size={orderedWidgets.find((widget) => widget.id === 'jellyfin')?.size ?? 'medium'}>{jellyfinItems.length ? <HorizontalScroller label='Jellyfin dashboard media'><div className='dashboard-carousel dashboard-carousel--jellyfin'>{jellyfinItems.map((item) => { const url = safeExternalUrl(item.openUrl); const card = <><FallbackImage src={item.imageUrl} alt={`${item.name} artwork`} fallbackLabel={item.seriesName ?? item.name} /><strong>{item.seriesName ?? item.name}</strong><span>{item.name}</span></>; return url ? <a key={item.id} href={url} target='_blank' rel='noopener noreferrer'>{card}</a> : <article key={item.id}>{card}</article> })}</div></HorizontalScroller> : <p className='widget-empty'>No Continue Watching or Next Up items.</p>}</WidgetShell>,
		warcraft: <WidgetShell id='warcraft' title='Weekly progress' provider='Warcraft Archive' link='/warcraft' state={warcraft} size={orderedWidgets.find((widget) => widget.id === 'warcraft')?.size ?? 'medium'}>{warcraft.data && <><div className='warcraft-dashboard-summary'><strong>{warcraft.data.summary.finished}<span>complete</span></strong><strong>{warcraft.data.summary.remaining}<span>remaining</span></strong><b>{warcraft.data.summary.completionPercent}%</b></div><div className='warcraft-dashboard-list'>{warcraft.data.items.filter((item) => canonicalWarcraftStatus(item.status) !== 'finished').slice(0, 4).map((item) => <div key={item.id}><span>{statusLabel(item.status)}</span><strong>{item.contentName}</strong><small>{item.characterName} · {item.difficulty}</small>{warcraftNextStatuses(item).length > 0 && <label><span className='sr-only'>Next status for {item.contentName}</span><select value='' disabled={pendingWarcraft.has(item.id)} onChange={(event) => { if (event.target.value) void updateWarcraft(item, event.target.value) }}><option value=''>{pendingWarcraft.has(item.id) ? 'Saving…' : 'Quick status…'}</option>{warcraftNextStatuses(item).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label>}{warcraftErrors[String(item.id)] && <em role='alert'>{warcraftErrors[String(item.id)]}</em>}</div>)}</div></>}</WidgetShell>,
		pokemon: <WidgetShell id='pokemon' title='Pokémon' provider='Beast Vault' link='/pokemon' state={pokemon} size={orderedWidgets.find((widget) => widget.id === 'pokemon')?.size ?? 'medium'}>{preferences.pokemonDashboardMode === 'recent' ? <p className='widget-empty'>Recent additions are unavailable because Beast Vault does not return an added timestamp. Choose Favorites or Tag in Dashboard Settings.</p> : preferences.pokemonDashboardMode === 'tag' && !preferences.pokemonDashboardTagId ? <p className='widget-empty'>Choose a Pokémon tag in Dashboard Settings.</p> : pokemon.data?.length ? <HorizontalScroller label='Dashboard Pokémon'><div className='dashboard-carousel dashboard-carousel--pokemon'>{pokemon.data.map((item) => <article key={item.id}><FallbackImage src={item.spriteUrl} fallbackSrc={item.fallbackSpriteUrl} alt={item.nickname ?? item.speciesName} fallbackLabel={item.speciesName} /><strong>{item.nickname ?? item.speciesName}</strong><span>Lv. {item.level}</span></article>)}</div></HorizontalScroller> : <p className='widget-empty'>No Pokémon match this dashboard view.</p>}</WidgetShell>,
		workflows: <WidgetShell id='workflows' title='Delivery status' provider='GitHub Actions' link='/workflows' state={workflows} size={orderedWidgets.find((widget) => widget.id === 'workflows')?.size ?? 'medium'}>{workflowSummary.length ? <div className='workflow-dashboard-list'>{workflowSummary.map((run: WorkflowRun) => { const status = workflowState(run); return <div key={run.repository} aria-label={`${run.repository}: ${status.replaceAll('_', ' ')}`}><i className={`is-${status}`} aria-hidden='true' /><strong>{run.repository}</strong><span>{status.replaceAll('_', ' ')}{workflowDuration(run) ? ` · ${workflowDuration(run)}` : ''}</span></div> })}</div> : <p className='widget-empty'>No failures or running workflows. No successful run is cached yet.</p>}</WidgetShell>,
	}

	if (!ready) return <div className='dashboard-page page-stack'><div className='preference-loading' role='status'>Loading dashboard preferences…</div></div>
	return <div className='dashboard-page page-stack'>
		<ModuleHeader title='Home' description='A focused view of what needs attention across your household.' actions={<button className='icon-button-with-label' type='button' onClick={() => { setRefreshKey((value) => value + 1); void today.refetch(true) }}><Icon name='refresh' />Refresh</button>} />
		<div className='dashboard-operational-grid'>{orderedWidgets.map((widget, index) => <DashboardWidgetSlot key={widget.id} widget={widget} index={index}>{content[widget.id]}</DashboardWidgetSlot>)}</div>
	</div>
}
