import { FallbackImage, ModuleState } from '@/components/Shared'
import type { SeerrRequest, SeerrRequestAction, SeerrRequestFilter, SeerrRequestList } from '@/models/api/Seerr'
import { SeerrPagination } from './SeerrPagination'
import { mediaStatusLabel, requestStatusLabel, seasonLabel, seerrImageSource, statusClassName } from './seerrPresentation'

const filters: Array<{ value: SeerrRequestFilter; label: string }> = [
	{ value: 'all', label: 'All statuses' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'approved', label: 'Approved' },
	{ value: 'processing', label: 'Processing' },
	{ value: 'available', label: 'Available' },
	{ value: 'failed', label: 'Failed' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'unavailable', label: 'Unavailable' },
	{ value: 'deleted', label: 'Deleted' },
]

const formattedDate = (value: string | null) => {
	if (!value) return 'Date unavailable'
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const RequestRow = ({
	request,
	canManage,
	pending,
	onModerate,
	onConfirm,
}: {
	request: SeerrRequest
	canManage: boolean
	pending: boolean
	onModerate: (request: SeerrRequest, action: Extract<SeerrRequestAction, 'approve' | 'retry'>) => void
	onConfirm: (request: SeerrRequest, action: 'decline' | 'delete') => void
}) => {
	const requestStatus = requestStatusLabel(request.requestStatus)
	const mediaStatus = mediaStatusLabel(request.mediaStatus)
	const canDelete = canManage || (request.isMine && request.requestStatus === 1)
	return <article className='seerr-request-row' aria-busy={pending}>
		<FallbackImage className='seerr-request-row__poster' src={seerrImageSource(request.posterPath)} alt={`${request.title ?? 'Requested title'} poster`} fallbackLabel={request.title ?? 'Requested title'} loading='lazy' width={54} height={76} />
		<div className='seerr-request-row__identity'>
			<div><span>{request.mediaType === 'tv' ? 'TV' : 'Movie'}{request.is4k ? ' · 4K' : ''}</span><strong>{request.title ?? `TMDB title ${request.tmdbId}`}</strong></div>
			<p>Requested by {request.requestedBy ?? (request.isMine ? 'you' : 'Unknown user')} · <time dateTime={request.createdAt ?? undefined}>{formattedDate(request.createdAt)}</time></p>
			{request.seasons.length > 0 && <p>{request.seasons.map(seasonLabel).join(', ')}</p>}
		</div>
		<div className='seerr-request-row__statuses'>
			<span className={`seerr-status is-${statusClassName(requestStatus)}`}>{requestStatus}</span>
			<span className={`seerr-status is-${statusClassName(mediaStatus)}`}>{mediaStatus}</span>
		</div>
		{(canManage || canDelete) && <div className='seerr-request-row__actions' aria-label={`Actions for ${request.title ?? `request ${request.id}`}`}>
			{pending ? <span role='status'>Updating…</span> : <>
				{canManage && request.requestStatus === 1 && <button type='button' className='is-approve' onClick={() => onModerate(request, 'approve')}>Approve</button>}
				{canManage && request.requestStatus === 1 && <button type='button' onClick={() => onConfirm(request, 'decline')}>Decline</button>}
				{canManage && request.requestStatus === 4 && <button type='button' onClick={() => onModerate(request, 'retry')}>Retry</button>}
				{canDelete && <button type='button' className='is-delete' onClick={() => onConfirm(request, 'delete')}>Delete</button>}
			</>}
		</div>}
	</article>
}

export const SeerrRequestHistory = ({
	data,
	loading,
	error,
	filter,
	mineOnly,
	canManage,
	canViewAll,
	pendingRows,
	onFilterChange,
	onMineChange,
	onPageChange,
	onRetry,
	onModerate,
	onConfirm,
}: {
	data: SeerrRequestList | null
	loading: boolean
	error: string | null
	filter: SeerrRequestFilter
	mineOnly: boolean
	canManage: boolean
	canViewAll: boolean
	pendingRows: ReadonlySet<number>
	onFilterChange: (filter: SeerrRequestFilter) => void
	onMineChange: (mineOnly: boolean) => void
	onPageChange: (page: number) => void
	onRetry: () => void
	onModerate: (request: SeerrRequest, action: Extract<SeerrRequestAction, 'approve' | 'retry'>) => void
	onConfirm: (request: SeerrRequest, action: 'decline' | 'delete') => void
}) => <section className='seerr-history' aria-labelledby='seerr-history-title'>
	<header>
		<div><span>Seerr activity</span><h2 id='seerr-history-title'>Request history</h2><p>Review request progress and the latest library state.</p></div>
		{data && <strong>{data.totalResults} requests</strong>}
	</header>
	<div className='seerr-history__toolbar'>
		<label><span>Status filter</span><select value={filter} onChange={(event) => onFilterChange(event.target.value as SeerrRequestFilter)}>{filters.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
		{canViewAll ? <fieldset><legend>Request scope</legend><div className='seerr-choice-row'><label><input type='radio' name='request-scope' checked={!mineOnly} onChange={() => onMineChange(false)} /><span>All requests</span></label><label><input type='radio' name='request-scope' checked={mineOnly} onChange={() => onMineChange(true)} /><span>My requests</span></label></div></fieldset> : <p className='seerr-history__scope-note'>Showing requests from your account.</p>}
	</div>
	{loading && !data && <ModuleState kind='loading' title='Loading requests'>Reading canonical request history from Seerr.</ModuleState>}
	{error && !data && <div className='seerr-history__error'><ModuleState kind='error' title='Request history is unavailable'>{error}</ModuleState><button type='button' className='button-secondary' onClick={onRetry}>Try again</button></div>}
	{!loading && !error && data?.results.length === 0 && <ModuleState kind='empty' title='No requests found'>Try another status filter or request a movie or TV season above.</ModuleState>}
	{data && data.results.length > 0 && <div className={`seerr-request-list${loading ? ' is-loading' : ''}`} aria-busy={loading}>
		{data.results.map((request) => <RequestRow key={request.id} request={request} canManage={canManage} pending={pendingRows.has(request.id)} onModerate={onModerate} onConfirm={onConfirm} />)}
	</div>}
	{error && data && <p className='seerr-inline-message is-error' role='alert'>{error}</p>}
	{data && <SeerrPagination page={data.page} totalPages={data.totalPages} label='Request history pages' onChange={onPageChange} />}
</section>
