import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { FallbackImage } from '@/components/Shared'
import type { CreateSeerrRequestBody, SeerrDetail, SeerrQuota, SeerrSession } from '@/models/api/Seerr'
import { mediaStatusLabel, qualityStatusBlocksRequest, requestStatusLabel, seasonLabel, seerrImageSource, statusClassName } from './seerrPresentation'

const quotaCopy = (quota: SeerrQuota | null, mediaLabel: string) => {
	if (!quota || !quota.restricted) return `Your Seerr account has no active ${mediaLabel.toLowerCase()} request limit.`
	if (quota.remaining === null || quota.limit === null) return `${quota.used} ${mediaLabel.toLowerCase()} requests used in the current ${quota.days}-day window.`
	return `${quota.remaining} of ${quota.limit} ${mediaLabel.toLowerCase()} requests remain in the current ${quota.days}-day window.`
}

export const SeerrDetailContent = ({
	detail,
	session,
	pending,
	error,
	onRequest,
}: {
	detail: SeerrDetail
	session: SeerrSession
	pending: boolean
	error: string | null
	onRequest: (body: CreateSeerrRequestBody) => void
}) => {
	const standardPermission = detail.mediaType === 'movie' ? session.canRequestMovies : session.canRequestTv
	const fourKPermission = detail.mediaType === 'movie' ? session.canRequest4kMovies : session.canRequest4kTv
	const quota = detail.mediaType === 'movie' ? session.movieQuota : session.tvQuota
	const mediaLabel = detail.mediaType === 'movie' ? 'Movie' : 'TV'
	const [is4k, setIs4k] = useState(!standardPermission && fourKPermission)
	const [selectedSeasons, setSelectedSeasons] = useState<number[]>([])
	const quotaId = useId()

	useEffect(() => {
		setIs4k(!standardPermission && fourKPermission)
		setSelectedSeasons([])
	}, [detail.mediaType, detail.tmdbId, fourKPermission, standardPermission])

	useEffect(() => {
		setSelectedSeasons([])
	}, [is4k])

	const selectedQualityStatus = is4k ? detail.mediaStatus4k : detail.mediaStatus
	const selectableSeasons = useMemo(() => detail.seasons.filter((season) => {
		const status = is4k ? season.status4k : season.status
		return !qualityStatusBlocksRequest(status)
	}), [detail.seasons, is4k])
	const hasPermission = standardPermission || fourKPermission
	const quotaExhausted = Boolean(quota?.restricted && quota.remaining !== null && quota.remaining <= 0)
	const movieUnavailable = detail.mediaType === 'movie' && qualityStatusBlocksRequest(selectedQualityStatus)
	const noTvSeasons = detail.mediaType === 'tv' && selectableSeasons.length === 0
	const selectionMissing = detail.mediaType === 'tv' && selectedSeasons.length === 0
	const requestDisabled = pending || !hasPermission || quotaExhausted || movieUnavailable || noTvSeasons || selectionMissing
	const currentMediaStatus = mediaStatusLabel(detail.mediaStatus)
	const currentRequestStatus = requestStatusLabel(detail.requestStatus)

	const toggleSeason = (seasonNumber: number, selected: boolean) => {
		setSelectedSeasons((current) => selected
			? [...new Set([...current, seasonNumber])].sort((left, right) => left - right)
			: current.filter((value) => value !== seasonNumber))
	}

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (requestDisabled) return
		onRequest({
			mediaType: detail.mediaType,
			mediaId: detail.tmdbId,
			is4k,
			...(detail.mediaType === 'tv' ? { seasons: selectedSeasons } : {}),
		})
	}

	return <div className='seerr-detail'>
		<div className='seerr-detail__hero'>
			<FallbackImage src={seerrImageSource(detail.backdropPath ?? detail.posterPath)} alt={`${detail.title} artwork`} fallbackLabel={detail.title} width={900} height={450} />
		</div>
		<div className='seerr-detail__summary'>
			<div className='seerr-detail__badges'>
				<span>{mediaLabel}</span>
				{detail.year && <span>{detail.year}</span>}
				{detail.runtime !== null && <span>{detail.runtime} min</span>}
				{detail.voteAverage !== null && <span>{detail.voteAverage.toFixed(1)}/10</span>}
			</div>
			{detail.overview && <p>{detail.overview}</p>}
			{detail.genres.length > 0 && <p className='seerr-detail__genres'>{detail.genres.join(' · ')}</p>}
		</div>
		<dl className='seerr-detail__statuses'>
			<div><dt>Library status</dt><dd><span className={`seerr-status is-${statusClassName(currentMediaStatus)}`}>{currentMediaStatus}</span></dd></div>
			{detail.mediaStatus4k !== null && <div><dt>4K status</dt><dd><span className={`seerr-status is-${statusClassName(mediaStatusLabel(detail.mediaStatus4k))}`}>{mediaStatusLabel(detail.mediaStatus4k)}</span></dd></div>}
			<div><dt>Request status</dt><dd><span className={`seerr-status is-${statusClassName(currentRequestStatus)}`}>{currentRequestStatus}</span></dd></div>
		</dl>

		<form className='seerr-request-form' onSubmit={submit} aria-busy={pending}>
			<div><h3>Request this title</h3><p>Household submits this through your mapped Seerr account.</p></div>
			{!hasPermission && <p className='seerr-inline-message is-warning'>Your Seerr account cannot request {mediaLabel.toLowerCase()} titles.</p>}
			{hasPermission && <>
				<fieldset disabled={pending}>
					<legend>Quality</legend>
					<div className='seerr-choice-row'>
						{standardPermission && <label><input type='radio' name='quality' checked={!is4k} onChange={() => setIs4k(false)} /><span>Standard</span></label>}
						{fourKPermission && <label><input type='radio' name='quality' checked={is4k} onChange={() => setIs4k(true)} /><span>4K</span></label>}
					</div>
				</fieldset>
				{detail.mediaType === 'tv' && <fieldset className='seerr-season-picker' disabled={pending || noTvSeasons}>
					<legend>Seasons</legend>
					<div className='seerr-season-picker__tools'>
						<span>{selectedSeasons.length} selected</span>
						<button type='button' onClick={() => setSelectedSeasons(selectableSeasons.map((season) => season.seasonNumber))}>Select available seasons</button>
					</div>
					{detail.seasons.length === 0 ? <p>No seasons were returned by Seerr.</p> : <div className='seerr-season-picker__list'>
						{detail.seasons.map((season) => {
							const status = is4k ? season.status4k : season.status
							const unavailable = qualityStatusBlocksRequest(status)
							return <label key={season.seasonNumber} className={unavailable ? 'is-unavailable' : ''}>
								<input type='checkbox' name='seasons' checked={selectedSeasons.includes(season.seasonNumber)} disabled={unavailable} onChange={(event) => toggleSeason(season.seasonNumber, event.target.checked)} />
								<span><strong>{season.name || seasonLabel(season.seasonNumber)}</strong><small>{season.episodeCount} episodes · {mediaStatusLabel(status)}</small></span>
							</label>
						})}
					</div>}
				</fieldset>}
				<p id={quotaId} className={`seerr-quota${quotaExhausted ? ' is-exhausted' : ''}`}>{quotaCopy(quota, mediaLabel)}</p>
				{movieUnavailable && <p className='seerr-inline-message'>This quality is already {mediaStatusLabel(selectedQualityStatus).toLowerCase()}.</p>}
				{noTvSeasons && <p className='seerr-inline-message'>No seasons are currently available to request in this quality.</p>}
				{error && <p className='seerr-inline-message is-error' role='alert'>{error}</p>}
				<button className='button-primary seerr-request-form__submit' type='submit' disabled={requestDisabled} aria-describedby={quotaId}>{pending ? 'Submitting request…' : `Request${is4k ? ' in 4K' : ''}`}</button>
			</>}
		</form>
	</div>
}
