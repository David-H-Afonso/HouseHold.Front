import { useEffect, useState } from 'react'
import { FallbackImage, ModuleState } from '@/components/Shared'
import type { MediaModuleResponse, UpcomingMedia } from '@/models/api/Modules'
import { moduleService } from '@/services'
import { safeExternalUrl } from '@/utils'
import { useUserPreferences } from '@/contexts/useUserPreferences'
import './MediaPage.scss'

const episodeCode = (season: number | null, episode: number | null) =>
	season === null || episode === null ? null : `S${season} E${episode}`

const upcomingTimestamp = (item: UpcomingMedia): number => {
	const timestamp = item.airTimeUtc ? Date.parse(item.airTimeUtc) : NaN
	if (!Number.isNaN(timestamp)) return timestamp

	const fallbackTime = item.airTime ?? (/^\d{1,2}:\d{2}/.test(item.airTimeUtc ?? '') ? item.airTimeUtc : null)
	const fallback = Date.parse(`${item.airDate}T${fallbackTime ?? '00:00'}`)
	return Number.isNaN(fallback) ? Number.MAX_SAFE_INTEGER : fallback
}

const upcomingLabel = (item: UpcomingMedia, timeZone: string) => {
	const utcSource = item.airTimeUtc ? new Date(item.airTimeUtc) : null
	const source = utcSource && !Number.isNaN(utcSource.getTime())
		? utcSource
		: new Date(`${item.airDate}T${item.airTime ?? item.airTimeUtc ?? '12:00:00'}`)
	if (Number.isNaN(source.getTime())) return item.airDate
	const time = item.airTimeUtc || item.airTime ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', timeZone }).format(source) : ''
	const date = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone }).format(source)
	return `${date}${time ? ` · ${time}` : ''}`
}

const activityRating = (userRating: number | null, tmdbRating: number | null) => {
	if (userRating !== null) return { label: 'Personal', value: userRating }
	if (tmdbRating !== null) return { label: 'TMDB', value: tmdbRating }
	return null
}

export const MediaPage = () => {
	const { preferences } = useUserPreferences()
	const [data, setData] = useState<MediaModuleResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [failed, setFailed] = useState(false)

	useEffect(() => {
		let active = true
		moduleService.media()
			.then((response) => {
				if (active) setData({ ...response, upcoming: [...response.upcoming].sort((a, b) => upcomingTimestamp(a) - upcomingTimestamp(b)) })
			})
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
	const upcoming = data?.upcoming ?? []

	return (
		<div className='media-page'>
			<header className='media-page__header'>
				<div><span>Jellywatch</span><h1>{data?.profile.displayName ? `${data.profile.displayName}'s watchlist` : 'Media'}</h1><p>What's next and what you watched most recently.</p></div>
				{data && !failed && <div className='media-page__signal' aria-label='Jellywatch connected'><i aria-hidden='true' />Live library</div>}
			</header>

			{loading && <ModuleState kind='loading' title='Loading Jellywatch'>Collecting your profile, upcoming episodes and activity.</ModuleState>}
			{failed && <ModuleState kind='error' title='Jellywatch is not available'>Connect or review the Jellywatch provider to see your media.</ModuleState>}

			{data && !failed && <>
				<section className='media-stats' aria-label='Profile totals'>
					{stats.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
				</section>

				<section className='media-section'>
					<header><div><span className='media-section__eyebrow'>Today through the next 7 days</span><h2>Upcoming</h2></div><span>{upcoming.length} scheduled</span></header>
					{upcoming.length === 0 ? <ModuleState kind='empty' title='No upcoming episodes'>Nothing is scheduled in [today, today + 7 days).</ModuleState> : (
						<div className='media-upcoming'>
							{upcoming.map((item, index) => {
								const url = safeExternalUrl(item.openUrl)
								const content = <>
									<div className='media-upcoming__poster'>
									<FallbackImage src={item.posterUrl} alt={`${item.seriesTitle} poster`} fallbackLabel={item.seriesTitle} loading={index < 5 ? 'eager' : 'lazy'} />
									<strong>{upcomingLabel(item, preferences.timezone)}</strong>
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
								<div className='media-activity__main'><strong>{item.title}</strong>{item.episodeName && <span>{episodeCode(item.seasonNumber, item.episodeNumber)} - {item.episodeName}</span>}<time dateTime={item.timestamp}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: preferences.timezone }).format(new Date(item.timestamp))}</time></div>
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
