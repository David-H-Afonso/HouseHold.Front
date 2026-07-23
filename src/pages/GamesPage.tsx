import { useEffect, useMemo, useState } from 'react'
import { DetailDrawer, FilterTabs, ModuleHeader, SearchBar } from '@/components/Shared'
import type { GameModuleItem, GameStatusOption } from '@/models/api/Games'
import { gamesService } from '@/services'

export const GamesPage = () => {
	const [games, setGames] = useState<GameModuleItem[]>([])
	const [statuses, setStatuses] = useState<GameStatusOption[]>([])
	const [selectedStatus, setSelectedStatus] = useState('All')
	const [search, setSearch] = useState('')
	const [selectedGame, setSelectedGame] = useState<GameModuleItem | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let mounted = true
		Promise.all([gamesService.statuses(), gamesService.list({ page: 1, pageSize: 24 })])
			.then(([statusItems, gameList]) => {
				if (!mounted) return
				setStatuses(statusItems)
				setGames(gameList.items)
			})
			.catch((err: Error) => {
				if (mounted) setError(err.message)
			})
			.finally(() => {
				if (mounted) setLoading(false)
			})

		return () => {
			mounted = false
		}
	}, [])

	useEffect(() => {
		const handle = window.setTimeout(() => {
			const status = statuses.find((item) => item.name === selectedStatus)
			gamesService
				.list({
					search: search || undefined,
					statusId: status?.id,
					page: 1,
					pageSize: 24,
				})
				.then((result) => setGames(result.items))
				.catch((err: Error) => setError(err.message))
		}, 250)

		return () => window.clearTimeout(handle)
	}, [search, selectedStatus, statuses])

	const tabOptions = useMemo(() => ['All', ...statuses.map((status) => status.name)], [statuses])

	const updateStatus = async (game: GameModuleItem, statusId: number) => {
		const updated = await gamesService.updateStatus(game.id, statusId)
		setGames((current) => current.map((item) => (item.id === game.id ? updated : item)))
		setSelectedGame(updated)
	}

	return (
		<div className='page-stack'>
			<ModuleHeader
				title='Games'
				description='Browse your Games Database collection, open details and update game status.'
			/>

			<section className='apps-toolbar'>
				<SearchBar value={search} placeholder='Search games' onChange={setSearch} />
				<FilterTabs options={tabOptions} value={selectedStatus} onChange={setSelectedStatus} />
			</section>

			{loading && <p className='muted'>Loading games...</p>}
			{error && <p className='error-text'>{error}</p>}
			{!loading && !error && games.length === 0 && (
				<section className='empty-panel'>
					<h2>No games found</h2>
					<p>Games Database may be empty, unconfigured or filtered by the current search.</p>
				</section>
			)}

			<div className='games-grid'>
				{games.map((game) => (
					<button key={game.id} type='button' className='game-card' onClick={() => setSelectedGame(game)}>
						{game.cover && <img src={game.cover} alt='' />}
						<span>{game.name}</span>
						<small>{game.statusName ?? 'No status'}</small>
					</button>
				))}
			</div>

			<DetailDrawer
				open={selectedGame !== null}
				title={selectedGame?.name ?? 'Game detail'}
				onClose={() => setSelectedGame(null)}
			>
				{selectedGame && (
					<div className='game-detail'>
						<p>Status: {selectedGame.statusName ?? 'Unknown'}</p>
						<p>Platform: {selectedGame.platformName ?? 'Unknown'}</p>
						<p>Score: {selectedGame.score ?? selectedGame.grade ?? 'Not rated'}</p>
						<label>
							Status
							<select
								value={selectedGame.statusId}
								onChange={(event) => updateStatus(selectedGame, Number(event.target.value))}
							>
								{statuses.map((status) => (
									<option key={status.id} value={status.id}>
										{status.name}
									</option>
								))}
							</select>
						</label>
						{selectedGame.openUrl && (
							<a className='app-open-button' href={selectedGame.openUrl} target='_blank' rel='noreferrer'>
								Open original
							</a>
						)}
					</div>
				)}
			</DetailDrawer>
		</div>
	)
}
