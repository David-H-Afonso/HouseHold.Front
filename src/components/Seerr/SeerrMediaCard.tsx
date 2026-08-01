import { FallbackImage } from '@/components/Shared'
import type { SeerrMediaCard as SeerrMediaCardModel } from '@/models/api/Seerr'
import { mediaStatusLabel, requestStatusLabel, seerrImageSource, statusClassName } from './seerrPresentation'

export const SeerrMediaCard = ({ media, onSelect }: { media: SeerrMediaCardModel; onSelect: (media: SeerrMediaCardModel) => void }) => {
	const mediaStatus = mediaStatusLabel(media.mediaStatus)
	const requestStatus = requestStatusLabel(media.requestStatus)
	return <li className='seerr-media-card'>
		<button type='button' onClick={() => onSelect(media)} aria-label={`View details for ${media.title}${media.year ? ` (${media.year})` : ''}`}>
			<div className='seerr-media-card__art'>
				<FallbackImage src={seerrImageSource(media.posterPath)} alt={`${media.title} poster`} fallbackLabel={media.title} loading='lazy' width={342} height={513} />
				<span className='seerr-media-card__type'>{media.mediaType === 'tv' ? 'TV' : 'Movie'}</span>
			</div>
			<div className='seerr-media-card__copy'>
				<div><strong>{media.title}</strong><span>{media.year ?? 'Year unavailable'}{media.voteAverage !== null ? ` · ${media.voteAverage.toFixed(1)}/10` : ''}</span></div>
				<span className={`seerr-status is-${statusClassName(mediaStatus)}`}>{mediaStatus}</span>
				{media.requestStatus !== null && <span className={`seerr-status is-${statusClassName(requestStatus)}`}>{requestStatus}</span>}
			</div>
		</button>
	</li>
}
