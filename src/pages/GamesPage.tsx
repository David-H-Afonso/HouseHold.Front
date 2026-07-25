import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { DetailDrawer, FallbackImage, Icon, ModuleHeader, ModuleState, SearchBar } from '@/components/Shared'
import type { GameModuleItem, GameStatusOption } from '@/models/api/Games'
import { gamesService } from '@/services'
import { safeExternalUrl } from '@/utils'
import { useUserPreferences } from '@/contexts/useUserPreferences'
import './GamesPage.scss'

const formatDate = (value: string | null | undefined, timeZone: string) => value ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone }).format(new Date(value)) : 'Not set'

export const GamesPage = () => {
	const { preferences } = useUserPreferences()
	const [games, setGames] = useState<GameModuleItem[]>([])
	const [statuses, setStatuses] = useState<GameStatusOption[]>([])
	const [statusesReady, setStatusesReady] = useState(false)
	const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null)
	const [search, setSearch] = useState('')
	const [selectedGame, setSelectedGame] = useState<GameModuleItem | null>(null)
	const [loading, setLoading] = useState(true)
	const [providerFailed, setProviderFailed] = useState(false)
	const [mutationError, setMutationError] = useState<Record<number, string>>({})
	const [pending, setPending] = useState<Set<number>>(() => new Set())
	const lastRequestKey = useRef<string | null>(null)
	const requestId = useRef(0)

	useEffect(() => { let active = true; gamesService.statuses().then((items) => { if (active) { setStatuses(items); setStatusesReady(true) } }).catch(() => { if (active) { setProviderFailed(true); setLoading(false) } }); return () => { active = false } }, [])
	useEffect(() => {
		if (!statusesReady) return
		const handle = window.setTimeout(() => {
			const requestKey = `${search.trim()}|${selectedStatusId ?? 'all'}`; if (lastRequestKey.current === requestKey) return; lastRequestKey.current = requestKey
			const currentRequest = ++requestId.current; setLoading(true); setProviderFailed(false)
			gamesService.list({ search: search.trim() || undefined, statusId: selectedStatusId ?? undefined, page: 1, pageSize: 48 }).then((result) => { if (requestId.current === currentRequest) setGames(result.items) }).catch(() => { if (requestId.current === currentRequest) setProviderFailed(true) }).finally(() => { if (requestId.current === currentRequest) setLoading(false) })
		}, 250)
		return () => window.clearTimeout(handle)
	}, [search, selectedStatusId, statusesReady])

	const reconcile = async (id: number) => {
		const canonical = await gamesService.get(id)
		setGames((current) => current.map((item) => item.id === canonical.id ? canonical : item))
		setSelectedGame((current) => current?.id === canonical.id ? canonical : current)
		return canonical
	}
	const updateStatus = async (game: GameModuleItem, statusId: number) => {
		if (pending.has(game.id)) return
		const previous = game; const status = statuses.find((item) => item.id === statusId)
		setPending((current) => new Set(current).add(game.id)); setMutationError((current) => ({ ...current, [game.id]: '' }))
		const optimistic = { ...game, statusId, statusName: status?.name ?? game.statusName }
		setGames((current) => current.map((item) => item.id === game.id ? optimistic : item)); setSelectedGame(optimistic)
		try { const updated = await gamesService.updateStatus(game.id, statusId); setGames((current) => selectedStatusId !== null && updated.statusId !== selectedStatusId ? current.filter((item) => item.id !== game.id) : current.map((item) => item.id === game.id ? updated : item)); setSelectedGame(updated) }
		catch { try { const canonical = await reconcile(game.id); if (canonical.statusId !== statusId) setMutationError((current) => ({ ...current, [game.id]: 'The provider did not confirm this status. Your canonical value was restored.' })) } catch { setGames((current) => current.map((item) => item.id === game.id ? previous : item)); setSelectedGame(previous); setMutationError((current) => ({ ...current, [game.id]: 'Status could not be confirmed. Try again.' })) } }
		finally { setPending((current) => { const next = new Set(current); next.delete(game.id); return next }) }
	}
	return <div className='page-stack games-page'>
		<ModuleHeader title='Games' description='Your complete Games Database shelf. Select a cover for provider detail and actions.' />
		<section className='games-page__toolbar' aria-label='Game filters'><SearchBar value={search} placeholder='Search games' onChange={setSearch} /><div className='games-page__statuses' aria-label='Filter by status'><button type='button' aria-pressed={selectedStatusId === null} onClick={() => setSelectedStatusId(null)}>All</button>{statuses.map((status) => <button key={status.id} type='button' aria-pressed={selectedStatusId === status.id} onClick={() => setSelectedStatusId(status.id)} style={{ '--status-color': status.color || '#64748b' } as CSSProperties}><span aria-hidden='true' />{status.name}</button>)}</div></section>
		{loading && games.length === 0 && <ModuleState kind='loading' title='Loading your shelf'>Getting games from Games Database.</ModuleState>}
		{providerFailed && games.length === 0 && <ModuleState kind='error' title='Games Database is not available'>Connect or review the provider to browse your collection.</ModuleState>}
		{providerFailed && games.length > 0 && <p className='games-page__partial-error' role='alert'>Refresh failed. The last loaded shelf remains available.</p>}
		{!loading && !providerFailed && games.length === 0 && <ModuleState kind='empty' title='No games found'>Try another search or choose a different status.</ModuleState>}
		{games.length > 0 && <div className={`games-page__grid${loading ? ' is-loading' : ''}`} aria-busy={loading}>{games.map((game) => <button key={game.id} type='button' className='games-cover-card' onClick={() => setSelectedGame(game)}><div className='games-cover-card__art'><FallbackImage src={game.cover} alt={`${game.name} cover`} fallbackLabel={game.name} loading='lazy' width={240} height={360} />{game.favorite && <span className='games-cover-card__favorite' title='Favorite'><Icon name='star' /></span>}<span className='games-cover-card__status' style={{ '--status-color': statuses.find((status) => status.id === game.statusId)?.color || '#64748b' } as CSSProperties}>{game.statusName ?? 'No status'}</span>{pending.has(game.id) && <span className='games-cover-card__saving'>Saving…</span>}</div><div className='games-cover-card__meta'><strong title={game.name}>{game.name}</strong><span>{game.platformName ?? 'Platform not set'}</span></div></button>)}</div>}
		<DetailDrawer open={selectedGame !== null} title={selectedGame?.name ?? 'Game detail'} onClose={() => setSelectedGame(null)}>{selectedGame && <div className='games-page__detail'>
			<div className='games-page__detail-cover'><FallbackImage src={selectedGame.cover} alt={`${selectedGame.name} cover`} fallbackLabel={selectedGame.name} width={240} height={360} />{selectedGame.favorite && <span className='games-page__detail-favorite'><Icon name='star' /> Favorite</span>}</div>
			{mutationError[selectedGame.id] && <p className='games-page__mutation-error' role='alert'>{mutationError[selectedGame.id]}</p>}
			<div className='game-score-pair'><div><span>Automatic score</span><strong>{selectedGame.score ?? '—'}</strong></div><div><span>Mi nota</span><strong>{selectedGame.grade ?? '—'}</strong></div></div>
			<dl><div><dt>Status</dt><dd><span className='game-status-chip'>{selectedGame.statusName ?? 'Unknown'}</span></dd></div><div><dt>Played status</dt><dd>{selectedGame.playedStatusName ?? 'Not set'}</dd></div><div><dt>Platform</dt><dd>{selectedGame.platformName ?? 'Unknown'}</dd></div><div><dt>Released</dt><dd>{formatDate(selectedGame.released, preferences.timezone)}</dd></div><div><dt>Started</dt><dd>{formatDate(selectedGame.started, preferences.timezone)}</dd></div><div><dt>Finished</dt><dd>{formatDate(selectedGame.finished, preferences.timezone)}</dd></div><div><dt>Playtime</dt><dd>{selectedGame.steamPlaytimeForever ? `${Math.round(selectedGame.steamPlaytimeForever / 60)} hours` : 'Not available'}</dd></div><div><dt>Critic</dt><dd>{selectedGame.critic !== null && selectedGame.critic !== undefined ? `${selectedGame.critic}${selectedGame.criticProvider ? ` · ${selectedGame.criticProvider}` : ''}` : 'Not set'}</dd></div><div><dt>Story</dt><dd>{selectedGame.story ?? 'Not set'}</dd></div><div><dt>Completion</dt><dd>{selectedGame.completion !== null && selectedGame.completion !== undefined ? `${selectedGame.completion}%` : 'Not set'}</dd></div><div><dt>Play with</dt><dd>{selectedGame.playWithNames?.length ? selectedGame.playWithNames.join(', ') : 'Not set'}</dd></div></dl>
			{selectedGame.comment && <div className='games-page__detail-comment'><span>Comment</span><p>{selectedGame.comment}</p></div>}
			<label className='game-detail-status'><span>Change status</span><select disabled={pending.has(selectedGame.id)} value={selectedGame.statusId} onChange={(event) => updateStatus(selectedGame, Number(event.target.value))}>{statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select></label>
			{safeExternalUrl(selectedGame.openUrl) && <a className='app-open-button' href={safeExternalUrl(selectedGame.openUrl)!} target='_blank' rel='noopener noreferrer'>Open in Games Database <Icon name='external' /></a>}
		</div>}</DetailDrawer>
	</div>
}
