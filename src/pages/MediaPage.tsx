import { useEffect, useState } from 'react'
import { FallbackImage, ModuleState } from '@/components/Shared'
import type { MediaModuleResponse, UpcomingMedia } from '@/models/api/Modules'
import { moduleService } from '@/services'
import { safeExternalUrl } from '@/utils'
import './MediaPage.scss'

const episodeCode = (season: number | null, episode: number | null) =>
	season === null || episode === null ? null : `S${season} E${episode}`

const upcomingLabel = (item: UpcomingMedia) => {
	const utcSource = item.airTimeUtc ? new Date(item.airTimeUtc) : null
	const source = utcSource && !Number.isNaN(utcSource.getTime())
		? utcSource
		: new Date(`${item.airDate}T${item.airTime ?? item.airTimeUtc ?? '12:00:00'}`)
	if (Number.isNaN(source.getTime())) return item.airDate
	const today = new Date()
	const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
	const target = new Date(source.getFullYear(), source.getMonth(), source.getDate()).getTime()
	const days = Math.round((target - start) / 86_400_000)
	const time = item.airTimeUtc || item.airTime ? source.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''
	if (days === 0) return `Today${time ? ` - ${time}` : ''}`
	if (days === 1) return `Tomorrow${time ? ` - ${time}` : ''}`
	return source.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

const activityRating = (userRating: number | null, tmdbRating: number | null) => {
	if (userRating !== null) return { label: 'Personal', value: userRating }
	if (tmdbRating !== null) return { label: 'TMDB', value: tmdbRating }
	return null
}

export const MediaPage = () => {
	const [data, setData] = useState<MediaModuleResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [failed, setFailed] = useState(false)

	useEffect(() => {
		let active = true
		moduleService.media()
			.then((response) => { if (active) setData(response) })
			.catch(() => { if (active) setFailed(true) })
			.finally(() => { if (active) setLoading(false) })
		return () => { active = false }
	}, [])

	const stats = data ? [
		['Watching', data.profile.totalSeriesWatching],
		['Series complete', data.profile.totalSeriesCompleted],
		['Movies seen', data.profile.totalMoviesSeen],
		['Episodes seen', data.profile.totalEpisodesSeen],
	] as const : []

	return (
		<div className='media-page'>
			<header className='media-page__header'>
				<div><span>Jellywatch</span><h1>{data?.profile.displayName ? `${data.profile.displayName}'s watchlist` : 'Media'}</h1><p>What's next and what you watched most recently.</p></div>
				{data && !failed && <div className='media-page__signal' aria-label='Jellywatch connected'><i />Live library</div>}
			</header>

			{loading && <ModuleState kind='loading' title='Loading Jellywatch'>Collecting your profile, upcoming episodes and activity.</ModuleState>}
			{failed && <ModuleState kind='error' title='Jellywatch is not available'>Connect or review the Jellywatch provider to see your media.</ModuleState>}

			{data && !failed && <>
				<section className='media-stats' aria-label='Profile totals'>
					{stats.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
				</section>

				<section className='media-section'>
					<header><div><span className='media-section__eyebrow'>On your radar</span><h2>Upcoming</h2></div><span>{data.upcoming.length} scheduled</span></header>
					{data.upcoming.length === 0 ? <ModuleState kind='empty' title='No upcoming episodes'>Nothing is currently scheduled in Jellywatch.</ModuleState> : (
						<div className='media-upcoming'>
							{data.upcoming.map((item, index) => {
								const url = safeExternalUrl(item.openUrl)
								const content = <>
									<div className='media-upcoming__poster'>
									<FallbackImage src={item.posterUrl} alt={`${item.seriesTitle} poster`} fallbackLabel={item.seriesTitle} loading={index < 5 ? 'eager' : 'lazy'} />
										<strong>{upcomingLabel(item)}</strong>
										{item.batchCount > 1 && <b>+{item.batchCount - 1}</b>}
									</div>
								<div className='media-upcoming__info'><h3>{item.seriesTitle}</h3><p>{episodeCode(item.seasonNumber, item.episodeNumber)}{item.episodeName ? ` - ${item.episodeName}` : ''}</p></div>
								</>
								return url ? <a key={`${item.mediaItemId}-${index}`} href={url} target='_blank' rel='noopener noreferrer' className='media-upcoming__card'>{content}</a> : <article key={`${item.mediaItemId}-${index}`} className='media-upcoming__card'>{content}</article>
							})}
						</div>
					)}
				</section>

				<section className='media-section media-activity'>
					<header><div><span className='media-section__eyebrow'>Latest updates</span><h2>Recent activity</h2></div><span>Last 3 events</span></header>
					{data.activity.length === 0 ? <ModuleState kind='empty' title='No recent activity'>Your latest watches will appear here.</ModuleState> : (
						<div className='media-activity__list'>
						{data.activity.slice(0, 3).map((item) => {
							const url = safeExternalUrl(item.openUrl)
							const rating = activityRating(item.userRating, item.tmdbRating)
							const content = <>
								<FallbackImage className='media-activity__poster' src={item.posterUrl} alt={`${item.title} poster`} fallbackLabel={item.title} loading='lazy' />
								<div className='media-activity__main'><strong>{item.title}</strong>{item.episodeName && <span>{episodeCode(item.seasonNumber, item.episodeNumber)} - {item.episodeName}</span>}<time dateTime={item.timestamp}>{new Date(item.timestamp).toLocaleString()}</time></div>
								<div className='media-activity__meta'><span>{String(item.mediaType)}</span>{rating && <strong><small>{rating.label}</small>{rating.value}</strong>}</div>
								</>
								return url ? <a key={item.eventId} href={url} target='_blank' rel='noopener noreferrer' className='media-activity__item'>{content}</a> : <article key={item.eventId} className='media-activity__item'>{content}</article>
							})}
						</div>
					)}
				</section>
			</>}
		</div>
	)
}
