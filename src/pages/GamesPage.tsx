import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { DetailDrawer, ModuleHeader, ModuleState, SearchBar } from '@/components/Shared'
import type { GameModuleItem, GameStatusOption } from '@/models/api/Games'
import { gamesService } from '@/services'
import { safeExternalUrl } from '@/utils'
import './GamesPage.scss'

const scoreTone = (score: number | null | undefined) => {
	if (score === null || score === undefined) return '#94a3b8'
	if (score >= 75) return '#35a853'
	if (score >= 50) return '#d99b16'
	return '#dc4a4a'
}

export const GamesPage = () => {
	const [games, setGames] = useState<GameModuleItem[]>([])
	const [statuses, setStatuses] = useState<GameStatusOption[]>([])
	const [statusesReady, setStatusesReady] = useState(false)
	const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null)
	const [search, setSearch] = useState('')
	const [selectedGame, setSelectedGame] = useState<GameModuleItem | null>(null)
	const [loading, setLoading] = useState(true)
	const [failed, setFailed] = useState(false)
	const lastRequestKey = useRef<string | null>(null)
	const requestId = useRef(0)

	useEffect(() => {
		let active = true
		gamesService.statuses()
			.then((items) => {
				if (!active) return
				setStatuses(items)
				setStatusesReady(true)
			})
			.catch(() => {
				if (!active) return
				setFailed(true)
				setLoading(false)
			})
		return () => { active = false }
	}, [])

	useEffect(() => {
		if (!statusesReady) return
		const handle = window.setTimeout(() => {
			const requestKey = `${search.trim()}|${selectedStatusId ?? 'all'}`
			if (lastRequestKey.current === requestKey) return
			lastRequestKey.current = requestKey
			const currentRequest = ++requestId.current
			setLoading(true)
			setFailed(false)
			gamesService.list({
				search: search.trim() || undefined,
				statusId: selectedStatusId ?? undefined,
				page: 1,
				pageSize: 24,
			})
				.then((result) => {
					if (requestId.current === currentRequest) setGames(result.items)
				})
				.catch(() => {
					if (requestId.current === currentRequest) setFailed(true)
				})
				.finally(() => {
					if (requestId.current === currentRequest) setLoading(false)
				})
		}, 250)
		return () => window.clearTimeout(handle)
	}, [search, selectedStatusId, statusesReady])

	const statusById = useMemo(() => new Map(statuses.map((status) => [status.id, status])), [statuses])

	const updateStatus = async (game: GameModuleItem, statusId: number) => {
		try {
			const updated = await gamesService.updateStatus(game.id, statusId)
			setGames((current) => selectedStatusId !== null && updated.statusId !== selectedStatusId
				? current.filter((item) => item.id !== game.id)
				: current.map((item) => item.id === game.id ? updated : item))
			setSelectedGame(updated)
		} catch {
			setFailed(true)
		}
	}

	return (
		<div className='page-stack games-page'>
			<ModuleHeader title='Games' description='Your Games Database shelf, focused on what you are playing now.' />

			<section className='games-page__toolbar' aria-label='Game filters'>
				<SearchBar value={search} placeholder='Search games' onChange={setSearch} />
				<div className='games-page__statuses' aria-label='Filter by status'>
					<button type='button' aria-pressed={selectedStatusId === null} onClick={() => setSelectedStatusId(null)}>All</button>
					{statuses.map((status) => (
						<button key={status.id} type='button' aria-pressed={selectedStatusId === status.id} onClick={() => setSelectedStatusId(status.id)} style={{ '--status-color': status.color || '#7c3aed' } as CSSProperties}>
							<span aria-hidden='true' />{status.name}
						</button>
					))}
				</div>
			</section>

			{loading && games.length === 0 && <ModuleState kind='loading' title='Loading your shelf'>Getting games from Games Database.</ModuleState>}
			{failed && <ModuleState kind='error' title='Games Database is not available'>Connect or review the Games Database provider to browse your collection.</ModuleState>}
			{!loading && !failed && games.length === 0 && <ModuleState kind='empty' title='No games found'>Try another search or choose a different status.</ModuleState>}

			{games.length > 0 && !failed && (
				<div className={`games-page__grid${loading ? ' is-loading' : ''}`} aria-busy={loading}>
					{games.map((game) => {
						const status = statusById.get(game.statusId)
						const score = game.score ?? game.grade
						return <button key={game.id} type='button' className='games-cover-card' onClick={() => setSelectedGame(game)} style={{ '--status-color': status?.color || '#7c3aed' } as CSSProperties}>
							<div className='games-cover-card__art'>
								{game.cover ? <img src={game.cover} alt={`${game.name} cover`} loading='lazy' /> : <span className='games-cover-card__fallback'>{game.name.slice(0, 1)}</span>}
								<div className='games-cover-card__spine' />
								<span className='games-cover-card__status'>{game.statusName ?? status?.name ?? 'No status'}</span>
								{score !== null && score !== undefined && <strong className='games-cover-card__score' style={{ '--score-color': scoreTone(score) } as CSSProperties}>{score}</strong>}
							</div>
							<div className='games-cover-card__meta'><strong title={game.name}>{game.name}</strong><span>{game.platformName ?? 'Platform not set'}</span></div>
						</button>
					})}
				</div>
			)}

			<DetailDrawer open={selectedGame !== null} title={selectedGame?.name ?? 'Game detail'} onClose={() => setSelectedGame(null)}>
				{selectedGame && <div className='game-detail games-page__detail'>
					{selectedGame.cover && <img src={selectedGame.cover} alt={`${selectedGame.name} cover`} />}
					<dl>
						<div><dt>Status</dt><dd>{selectedGame.statusName ?? 'Unknown'}</dd></div>
						<div><dt>Platform</dt><dd>{selectedGame.platformName ?? 'Unknown'}</dd></div>
						<div><dt>Score</dt><dd>{selectedGame.score ?? selectedGame.grade ?? 'Not rated'}</dd></div>
					</dl>
					<label>Status<select value={selectedGame.statusId} onChange={(event) => updateStatus(selectedGame, Number(event.target.value))}>{statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select></label>
					{safeExternalUrl(selectedGame.openUrl) && <a className='app-open-button' href={safeExternalUrl(selectedGame.openUrl)!} target='_blank' rel='noopener noreferrer'>Open original</a>}
				</div>}
			</DetailDrawer>
		</div>
	)
}
