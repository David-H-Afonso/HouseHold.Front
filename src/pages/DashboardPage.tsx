import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FallbackImage, ModuleHeader, QuickActionButton, TodayTaskActionRow } from '@/components/Shared'
import { useTodayModule } from '@/hooks'
import type { GameModuleItem } from '@/models/api/Games'
import type { HouseholdConnection, HouseholdProviderId } from '@/models/api/Integrations'
import type { MediaModuleResponse, UpcomingMedia, WarcraftWeeklyResponse } from '@/models/api/Modules'
import { gamesService, integrationService, moduleService } from '@/services'
import './DashboardPage.scss'

interface WidgetState<T> {
	loading: boolean
	data: T | null
	error: boolean
}

const emptyState = <T,>(): WidgetState<T> => ({ loading: true, data: null, error: false })

const providerMarks: Record<HouseholdProviderId, string> = {
	doit: 'D',
	'games-database': 'G',
	jellywatch: 'J',
	'beast-vault': 'B',
	'warcraft-archive': 'W',
}

const localDateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const upcomingDate = (item: UpcomingMedia) => {
	const fullUtc = item.airTimeUtc ? new Date(item.airTimeUtc) : null
	if (fullUtc && !Number.isNaN(fullUtc.getTime())) return fullUtc
	return new Date(`${item.airDate}T${item.airTime ?? item.airTimeUtc ?? '12:00:00'}`)
}

const currentWeekUpcoming = (response: MediaModuleResponse) => {
	const now = new Date()
	const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const day = monday.getDay()
	monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))
	const nextMonday = new Date(monday)
	nextMonday.setDate(nextMonday.getDate() + 7)
	return response.upcoming
		.filter((item) => {
			const date = upcomingDate(item)
			return !Number.isNaN(date.getTime()) && date >= monday && date < nextMonday
		})
		.sort((left, right) => upcomingDate(left).getTime() - upcomingDate(right).getTime())
}

const WidgetError = ({ provider }: { provider: string }) => (
	<p className='dashboard-quick__error'>
		{provider} is unavailable. <Link to='/settings/integrations'>Review integration</Link>
	</p>
)

export const DashboardPage = () => {
	const todayDate = useMemo(() => localDateValue(new Date()), [])
	const today = useTodayModule(todayDate)
	const [games, setGames] = useState<WidgetState<GameModuleItem[]>>(emptyState)
	const [media, setMedia] = useState<WidgetState<UpcomingMedia[]>>(emptyState)
	const [warcraft, setWarcraft] = useState<WidgetState<WarcraftWeeklyResponse>>(emptyState)
	const [connections, setConnections] = useState<HouseholdConnection[]>([])
	const [connectionsLoading, setConnectionsLoading] = useState(true)
	const [connectionsError, setConnectionsError] = useState(false)
	const [refreshKey, setRefreshKey] = useState(0)

	useEffect(() => {
		let active = true
		setGames(emptyState())
		setMedia(emptyState())
		setWarcraft(emptyState())

		const loadPlayingGames = async () => {
			const statuses = await gamesService.statuses()
			const playing = statuses.find((status) => status.statusType === 'Playing')
			if (!playing) return []
			const result = await gamesService.list({ statusId: playing.id, page: 1, pageSize: 4 })
			return result.items.slice(0, 4)
		}

		void Promise.allSettled([loadPlayingGames(), moduleService.media(), moduleService.warcraft()]).then(([gamesResult, mediaResult, warcraftResult]) => {
			if (!active) return
			setGames(gamesResult.status === 'fulfilled'
				? { loading: false, data: gamesResult.value, error: false }
				: { loading: false, data: null, error: true })
			setMedia(mediaResult.status === 'fulfilled'
				? { loading: false, data: currentWeekUpcoming(mediaResult.value), error: false }
				: { loading: false, data: null, error: true })
			setWarcraft(warcraftResult.status === 'fulfilled'
				? { loading: false, data: warcraftResult.value, error: false }
				: { loading: false, data: null, error: true })
		})

		return () => { active = false }
	}, [refreshKey])

	useEffect(() => {
		let active = true
		setConnectionsLoading(true)
		setConnectionsError(false)
		integrationService.connections()
			.then((response) => { if (active) setConnections(response) })
			.catch(() => { if (active) setConnectionsError(true) })
			.finally(() => { if (active) setConnectionsLoading(false) })
		return () => { active = false }
	}, [refreshKey])

	const todayTasks = (today.data?.tasks ?? [])
		.filter((task) => ['pending', 'done', 'completed'].includes(task.occurrenceStatus.toLowerCase()))
		.sort((left, right) => {
			const rank = (status: string) => status.toLowerCase() === 'pending' ? 0 : 1
			return rank(left.occurrenceStatus) - rank(right.occurrenceStatus)
		})
		.slice(0, 4)
	const unfinishedWarcraft = warcraft.data?.items.filter((item) => item.status.toLowerCase() !== 'finished').slice(0, 3) ?? []

	const refreshAll = () => {
		setRefreshKey((value) => value + 1)
		void today.refetch(true)
	}

	return (
		<div className='page-stack dashboard-page'>
			<ModuleHeader title='Dashboard' description='What needs attention across your connected apps.' actions={<QuickActionButton onClick={refreshAll}>Refresh</QuickActionButton>} />

			<div className='dashboard-quick-grid'>
				<section className='dashboard-quick dashboard-quick--games'>
					<header><div><span>Games Database</span><h2>Playing now</h2></div><Link to='/games'>View games</Link></header>
					{games.loading && <p className='muted'>Loading games...</p>}
					{games.error && <WidgetError provider='Games Database' />}
					{!games.loading && !games.error && games.data?.length === 0 && <p className='muted'>No games are currently marked Playing.</p>}
					{games.data && games.data.length > 0 && <div className='dashboard-games-list'>{games.data.map((game) => <div key={game.id} className='dashboard-game'><FallbackImage src={game.cover} alt={`${game.name} cover`} fallbackLabel={game.name} /><strong>{game.name}</strong></div>)}</div>}
				</section>

				<section className='dashboard-quick dashboard-quick--today'>
					<header><div><span>DoIt</span><h2>Today's tasks</h2></div><Link to='/today'>Open today</Link></header>
					{today.loading && !today.data && <p className='muted'>Loading tasks...</p>}
					{today.providerError && <WidgetError provider='DoIt' />}
					{today.actionError && <p className='dashboard-quick__action-error' role='alert'>{today.actionError}</p>}
					{!today.loading && !today.providerError && todayTasks.length === 0 && <p className='muted'>No pending or completed tasks today.</p>}
					{todayTasks.length > 0 && <div className='dashboard-today-list'>{todayTasks.map((task) => <TodayTaskActionRow key={task.occurrenceId} task={task} compact pending={today.pendingOccurrences.has(task.occurrenceId)} onAction={today.runAction} />)}</div>}
				</section>

				<section className='dashboard-quick dashboard-quick--media'>
					<header><div><span>Jellywatch</span><h2>This week's episodes</h2></div><Link to='/media'>View media</Link></header>
					{media.loading && <p className='muted'>Loading upcoming episodes...</p>}
					{media.error && <WidgetError provider='Jellywatch' />}
					{!media.loading && !media.error && media.data?.length === 0 && <p className='muted'>No episodes scheduled through Sunday.</p>}
					{media.data && media.data.length > 0 && <div className='dashboard-media-list'>{media.data.slice(0, 4).map((item) => <article key={`${item.mediaItemId}-${item.episodeNumber}`}><FallbackImage src={item.posterUrl} alt={`${item.seriesTitle} poster`} fallbackLabel={item.seriesTitle} /><div><strong>{item.seriesTitle}</strong><span>S{item.seasonNumber} E{item.episodeNumber}{item.episodeName ? ` - ${item.episodeName}` : ''}</span><time dateTime={item.airDate}>{upcomingDate(item).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</time></div></article>)}</div>}
				</section>

				<section className='dashboard-quick dashboard-quick--warcraft'>
					<header><div><span>Warcraft Archive</span><h2>Weekly progress</h2></div><Link to='/warcraft'>View Warcraft</Link></header>
					{warcraft.loading && <p className='muted'>Loading weekly progress...</p>}
					{warcraft.error && <WidgetError provider='Warcraft Archive' />}
					{warcraft.data && <>
						<div className='dashboard-warcraft-summary'><strong>{warcraft.data.summary.finished}<span>completed</span></strong><strong>{warcraft.data.summary.remaining}<span>remaining</span></strong><span>{warcraft.data.summary.completionPercent}% this week</span></div>
						<div className='dashboard-warcraft-list'>{unfinishedWarcraft.map((item) => <div key={item.id}><span className={`dashboard-warcraft-status is-${item.status.toLowerCase()}`}>{item.status}</span><strong>{item.contentName}</strong><small>{item.characterName} - {item.difficulty}</small></div>)}</div>
					</>}
				</section>
			</div>

			<section className='dashboard-connections-panel'>
				<header><div><h2>Connected apps</h2><p>Account connections used by the dashboard.</p></div><Link to='/settings/integrations'>Manage connections</Link></header>
				{connectionsLoading && <p className='muted'>Loading connections...</p>}
				{connectionsError && <p className='dashboard-quick__error'>Connections could not be loaded. <Link to='/settings/integrations'>Review integrations</Link></p>}
				{!connectionsLoading && !connectionsError && <div className='dashboard-connections-compact'>{connections.map((connection) => <div key={connection.provider}><span className={`connection-card__mark connection-card__mark--${connection.provider}`} aria-hidden='true'>{providerMarks[connection.provider]}</span><div><strong>{connection.displayName}</strong><span>{connection.accountDisplayName ?? 'No account'}</span></div><b className={`is-${connection.status.toLowerCase()}`}>{connection.status}</b></div>)}</div>}
			</section>
		</div>
	)
}
