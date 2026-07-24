import { useEffect, useState } from 'react'
import { FallbackImage, HorizontalScroller, Icon, ModuleState } from '@/components/Shared'
import type { JellyfinMediaItem, JellyfinModuleResponse } from '@/models/api/Operations'
import { operationsService } from '@/services'
import { safeExternalUrl } from '@/utils'
import './JellyfinPage.scss'

const JellyfinCard = ({ item }: { item: JellyfinMediaItem }) => {
	const url = safeExternalUrl(item.openUrl)
	const remainingMinutes = item.runTimeTicks && item.playbackPositionTicks ? Math.max(0, Math.round((item.runTimeTicks - item.playbackPositionTicks) / 600_000_000)) : null
	const content = <><div className='jellyfin-card__art'><FallbackImage src={item.imageUrl} alt={`${item.name} artwork`} fallbackLabel={item.seriesName ?? item.name} /><span><Icon name='media' /></span>{item.progressPercent !== null && item.progressPercent !== undefined && <i style={{ width: `${Math.min(100, Math.max(0, item.progressPercent))}%` }} />}</div><div><strong>{item.seriesName ?? item.name}</strong>{item.seriesName && <span>{item.name}</span>}<small>{item.parentIndexNumber && item.indexNumber ? `S${item.parentIndexNumber} E${item.indexNumber}` : 'Ready to play'}{remainingMinutes ? ` · ${remainingMinutes} min left` : ''}</small></div></>
	return url ? <a className='jellyfin-card' href={url} target='_blank' rel='noopener noreferrer'>{content}</a> : <article className='jellyfin-card'>{content}</article>
}

export const JellyfinPage = () => {
	const [data, setData] = useState<JellyfinModuleResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [failed, setFailed] = useState(false)
	useEffect(() => { let active = true; operationsService.jellyfin().then((result) => { if (active) setData(result) }).catch(() => { if (active) setFailed(true) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
	return <div className='jellyfin-page'>
		<header className='jellyfin-page__header'><div><span>Jellyfin</span><h1>Your screen, ready</h1><p>Resume what you were watching or jump directly into the next episode.</p></div></header>
		{loading && <ModuleState kind='loading' title='Opening Jellyfin'>Loading media for your mapped Jellyfin profile.</ModuleState>}
		{failed && <ModuleState kind='error' title='Jellyfin is not configured'>Ask an administrator to configure the server key and map your Jellyfin User ID in Settings.</ModuleState>}
		{data && !failed && <>
			<section className='jellyfin-section'><header><div><span>Pick up where you left off</span><h2>Continue Watching</h2></div><strong>{data.continueWatching.length}</strong></header>{data.continueWatching.length ? <HorizontalScroller label='Continue Watching'><div className='jellyfin-row'>{data.continueWatching.map((item) => <JellyfinCard key={item.id} item={item} />)}</div></HorizontalScroller> : <ModuleState kind='empty' title='Nothing in progress'>Next Up is ready below.</ModuleState>}</section>
			<section className='jellyfin-section'><header><div><span>From your library</span><h2>Next Up</h2></div><strong>{data.nextUp.length}</strong></header>{data.nextUp.length ? <HorizontalScroller label='Next Up'><div className='jellyfin-row'>{data.nextUp.map((item) => <JellyfinCard key={item.id} item={item} />)}</div></HorizontalScroller> : <ModuleState kind='empty' title='No next episodes'>Your mapped Jellyfin profile has no Next Up items.</ModuleState>}</section>
		</>}
	</div>
}
