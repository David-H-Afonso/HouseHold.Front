import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ConfirmActionDialog, DetailDrawer, ModuleHeader, ModuleState } from '@/components/Shared'
import { SeerrDetailContent, SeerrMediaCard, SeerrPagination, SeerrRequestHistory } from '@/components/Seerr'
import type {
	CreateSeerrRequestBody,
	SeerrDetail,
	SeerrDiscoverKind,
	SeerrMediaCard as SeerrMediaCardModel,
	SeerrRequest,
	SeerrRequestAction,
	SeerrRequestFilter,
	SeerrRequestList,
	SeerrSearchResponse,
	SeerrSession,
} from '@/models/api/Seerr'
import { seerrService } from '@/services'
import { useAppSelector } from '@/store/hooks'
import { selectIsAdmin } from '@/store/features/auth/selector'
import { isApiError } from '@/utils/customFetch'
import { safeExternalUrl } from '@/utils'
import './SeerrRequestsPage.scss'

const discoverOptions: Array<{ value: SeerrDiscoverKind; label: string }> = [
	{ value: 'trending', label: 'Trending' },
	{ value: 'movies', label: 'Popular movies' },
	{ value: 'tv', label: 'Popular TV' },
	{ value: 'upcoming-movies', label: 'Upcoming movies' },
	{ value: 'upcoming-tv', label: 'Upcoming TV' },
]

const normalizedQuery = (value: string | null) => (value ?? '').trim().slice(0, 256)

const errorMessage = (reason: unknown, fallback: string) => {
	if (!isApiError(reason)) return fallback
	const byCode: Record<string, string> = {
		seerr_duplicate_request: 'A request for this title already exists.',
		seerr_no_seasons: 'None of the selected seasons are currently available to request.',
		seerr_user_not_mapped: 'Your Household account is not linked to a Seerr user.',
		seerr_forbidden: 'Your Seerr account does not allow this action.',
	}
	return reason.code && byCode[reason.code] ? byCode[reason.code] : reason.message || fallback
}

type PendingConfirmation = { request: SeerrRequest; action: 'decline' | 'delete' }

export const SeerrRequestsPage = () => {
	const isAdmin = useAppSelector(selectIsAdmin)
	const [searchParams, setSearchParams] = useSearchParams()
	const urlQuery = normalizedQuery(searchParams.get('q'))
	const [searchInput, setSearchInput] = useState(urlQuery)
	const [submittedQuery, setSubmittedQuery] = useState(urlQuery)
	const [discoverKind, setDiscoverKind] = useState<SeerrDiscoverKind>('trending')
	const [browsePage, setBrowsePage] = useState(1)
	const [browseData, setBrowseData] = useState<SeerrSearchResponse | null>(null)
	const [browseLoading, setBrowseLoading] = useState(false)
	const [browseError, setBrowseError] = useState<string | null>(null)
	const [session, setSession] = useState<SeerrSession | null>(null)
	const [sessionLoading, setSessionLoading] = useState(true)
	const [sessionError, setSessionError] = useState<string | null>(null)
	const [selectedMedia, setSelectedMedia] = useState<SeerrMediaCardModel | null>(null)
	const [detail, setDetail] = useState<SeerrDetail | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const [detailError, setDetailError] = useState<string | null>(null)
	const [requestPending, setRequestPending] = useState(false)
	const [requestError, setRequestError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)
	const [historyFilter, setHistoryFilter] = useState<SeerrRequestFilter>('all')
	const [mineOnly, setMineOnly] = useState(true)
	const [historyPage, setHistoryPage] = useState(1)
	const [historyData, setHistoryData] = useState<SeerrRequestList | null>(null)
	const [historyLoading, setHistoryLoading] = useState(false)
	const [historyError, setHistoryError] = useState<string | null>(null)
	const [historyMutationError, setHistoryMutationError] = useState<string | null>(null)
	const [pendingRows, setPendingRows] = useState<Set<number>>(() => new Set())
	const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null)
	const [confirmationError, setConfirmationError] = useState<string | null>(null)
	const [canonicalRevision, setCanonicalRevision] = useState(0)
	const sessionInitialized = useRef(false)
	const browseRequestId = useRef(0)
	const historyRequestId = useRef(0)
	const detailRequestId = useRef(0)

	useEffect(() => {
		setSearchInput(urlQuery)
		setSubmittedQuery(urlQuery)
		setBrowsePage(1)
	}, [urlQuery])

	const loadSession = useCallback(async (signal?: AbortSignal) => {
		setSessionLoading(true)
		setSessionError(null)
		try {
			const response = await seerrService.session(signal)
			setSession(response)
			if (!response.canViewAllRequests) setMineOnly(true)
			else if (!sessionInitialized.current) setMineOnly(false)
			sessionInitialized.current = true
		} catch (reason) {
			if (!signal?.aborted) setSessionError(errorMessage(reason, 'The Seerr session could not be loaded.'))
		} finally {
			if (!signal?.aborted) setSessionLoading(false)
		}
	}, [])

	useEffect(() => {
		const controller = new AbortController()
		void loadSession(controller.signal)
		return () => controller.abort()
	}, [loadSession])

	const loadBrowse = useCallback(async (signal?: AbortSignal) => {
		if (!session?.mapped) return
		const requestId = ++browseRequestId.current
		setBrowseLoading(true)
		setBrowseError(null)
		try {
			const response = submittedQuery
				? await seerrService.search(submittedQuery, browsePage, signal)
				: await seerrService.discover(discoverKind, browsePage, signal)
			if (browseRequestId.current === requestId) setBrowseData(response)
		} catch (reason) {
			if (!signal?.aborted && browseRequestId.current === requestId) setBrowseError(errorMessage(reason, 'Media could not be loaded from Seerr.'))
		} finally {
			if (!signal?.aborted && browseRequestId.current === requestId) setBrowseLoading(false)
		}
	}, [browsePage, discoverKind, session?.mapped, submittedQuery])

	useEffect(() => {
		if (!session?.mapped) return
		const controller = new AbortController()
		void loadBrowse(controller.signal)
		return () => controller.abort()
	}, [canonicalRevision, loadBrowse, session?.mapped])

	const loadHistory = useCallback(async (signal?: AbortSignal) => {
		if (!session?.mapped) return
		const effectiveMineOnly = session.canViewAllRequests ? mineOnly : true
		const requestId = ++historyRequestId.current
		setHistoryLoading(true)
		setHistoryError(null)
		try {
			const response = await seerrService.requests(historyFilter, effectiveMineOnly, historyPage, signal)
			if (historyRequestId.current === requestId) setHistoryData(response)
		} catch (reason) {
			if (!signal?.aborted && historyRequestId.current === requestId) setHistoryError(errorMessage(reason, 'Request history could not be loaded.'))
		} finally {
			if (!signal?.aborted && historyRequestId.current === requestId) setHistoryLoading(false)
		}
	}, [historyFilter, historyPage, mineOnly, session?.canViewAllRequests, session?.mapped])

	useEffect(() => {
		if (!session?.mapped) return
		const controller = new AbortController()
		void loadHistory(controller.signal)
		return () => controller.abort()
	}, [canonicalRevision, loadHistory, session?.mapped])

	const loadDetail = useCallback(async (media: SeerrMediaCardModel, signal?: AbortSignal) => {
		if (!session?.mapped) return
		const requestId = ++detailRequestId.current
		setDetailLoading(true)
		setDetailError(null)
		try {
			const response = await seerrService.detail(media.mediaType, media.tmdbId, signal)
			if (detailRequestId.current === requestId) setDetail(response)
		} catch (reason) {
			if (!signal?.aborted && detailRequestId.current === requestId) setDetailError(errorMessage(reason, 'Title details could not be loaded.'))
		} finally {
			if (!signal?.aborted && detailRequestId.current === requestId) setDetailLoading(false)
		}
	}, [session?.mapped])

	useEffect(() => {
		if (!selectedMedia || !session?.mapped) return
		const controller = new AbortController()
		setDetail(null)
		void loadDetail(selectedMedia, controller.signal)
		return () => controller.abort()
	}, [canonicalRevision, loadDetail, selectedMedia, session?.mapped])

	const refreshCanonicalState = () => setCanonicalRevision((value) => value + 1)

	const submitSearch = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const query = normalizedQuery(searchInput)
		setBrowsePage(1)
		setSubmittedQuery(query)
		setBrowseData(null)
		if (query) setSearchParams({ q: query })
		else setSearchParams({})
		if (query === submittedQuery) refreshCanonicalState()
	}

	const selectDiscoverKind = (kind: SeerrDiscoverKind) => {
		setDiscoverKind(kind)
		setBrowsePage(1)
		setSubmittedQuery('')
		setSearchInput('')
		setBrowseData(null)
		setSearchParams({})
	}

	const createRequest = async (body: CreateSeerrRequestBody) => {
		if (!session?.mapped || requestPending) return
		setRequestPending(true)
		setRequestError(null)
		setNotice(null)
		try {
			await seerrService.createRequest(body)
			setNotice(`${detail?.title ?? 'Title'} was submitted to Seerr.`)
		} catch (reason) {
			setRequestError(errorMessage(reason, 'The request could not be submitted.'))
		} finally {
			refreshCanonicalState()
			setRequestPending(false)
		}
	}

	const setRowPending = (id: number, pending: boolean) => setPendingRows((current) => {
		const next = new Set(current)
		if (pending) next.add(id)
		else next.delete(id)
		return next
	})

	const moderateRequest = async (request: SeerrRequest, action: Extract<SeerrRequestAction, 'approve' | 'retry'>) => {
		if (!session?.mapped || !session.canManageRequests || pendingRows.has(request.id)) return
		setRowPending(request.id, true)
		setHistoryError(null)
		setHistoryMutationError(null)
		try {
			await seerrService.moderateRequest(request.id, action)
			setNotice(`${request.title ?? 'Request'} was ${action === 'approve' ? 'approved' : 'queued for retry'}.`)
		} catch (reason) {
			setHistoryMutationError(errorMessage(reason, `The request could not be ${action === 'approve' ? 'approved' : 'retried'}. Refresh the request and try again.`))
		} finally {
			refreshCanonicalState()
			setRowPending(request.id, false)
		}
	}

	const confirmPendingAction = async () => {
		if (!confirmation || !session?.mapped || pendingRows.has(confirmation.request.id)) return
		if (confirmation.action === 'decline' && !session.canManageRequests) return
		if (confirmation.action === 'delete' && !confirmation.request.isMine && !session.canManageRequests) return
		const { request, action } = confirmation
		setRowPending(request.id, true)
		setConfirmationError(null)
		try {
			if (action === 'decline') await seerrService.moderateRequest(request.id, 'decline')
			else await seerrService.deleteRequest(request.id)
			setNotice(`${request.title ?? 'Request'} was ${action === 'decline' ? 'declined' : 'deleted'}.`)
			setConfirmation(null)
		} catch (reason) {
			setConfirmationError(errorMessage(reason, `The request could not be ${action === 'decline' ? 'declined' : 'deleted'}.`))
		} finally {
			refreshCanonicalState()
			setRowPending(request.id, false)
		}
	}

	const publicUrl = safeExternalUrl(session?.publicUrl)
	const selectedDiscoverLabel = discoverOptions.find((option) => option.value === discoverKind)?.label ?? 'Discover'

	return <div className='seerr-page page-stack'>
		<ModuleHeader
			title='Requests'
			description='Find movies and TV shows, submit requests, and follow their progress without leaving Household.'
			actions={publicUrl && session?.mapped ? <a className='button-secondary seerr-page__external' href={publicUrl} target='_blank' rel='noopener noreferrer'>Open Seerr</a> : undefined}
		/>
		{notice && <p className='notice-banner seerr-page__notice' role='status'>{notice}<button type='button' onClick={() => setNotice(null)} aria-label='Dismiss notification'>×</button></p>}
		{sessionLoading && <ModuleState kind='loading' title='Connecting to Seerr'>Checking configuration, account mapping, permissions, and quotas.</ModuleState>}
		{sessionError && !sessionLoading && <section className='seerr-gate is-error' role='alert'><span aria-hidden='true'>!</span><div><h2>Seerr is unavailable</h2><p>{sessionError}</p><button type='button' className='button-secondary' onClick={() => void loadSession()}>Try again</button></div></section>}
		{session && !sessionLoading && !session.configured && <section className='seerr-gate'><span aria-hidden='true'>S</span><div><h2>Seerr is not configured</h2><p>{isAdmin ? 'Add the internal URL, public URL, and write-only API key in Apps & providers.' : 'Ask a Household administrator to configure the Seerr server.'}</p>{isAdmin && <Link className='button-primary' to='/settings/apps'>Configure Seerr</Link>}</div></section>}
		{session?.configured && !session.mapped && !sessionLoading && <section className='seerr-gate'><span aria-hidden='true'>S</span><div><h2>Your Seerr account is not linked</h2><p>{isAdmin ? 'Approve a Jellyfin mapping or enter a Seerr user ID in Apps & providers.' : 'Ask a Household administrator to map your Household account to Seerr.'}</p>{isAdmin && <Link className='button-primary' to='/settings/apps'>Manage user mappings</Link>}</div></section>}

		{session?.mapped && !sessionLoading && <>
			<div className='seerr-session-strip' role='status'><span><i aria-hidden='true' />Connected as <strong>{session.displayName ?? `Seerr user ${session.seerrUserId}`}</strong></span><span>Mapping: {session.mappingSource ?? 'linked account'}</span></div>
			<section className='seerr-browse' aria-labelledby='seerr-browse-title' aria-busy={browseLoading}>
				<form className='seerr-search' role='search' aria-label='Search Seerr media' onSubmit={submitSearch}>
					<label htmlFor='seerr-search-query'>Search movies and TV</label>
					<div><input id='seerr-search-query' name='query' type='search' value={searchInput} maxLength={256} autoComplete='off' placeholder='Title, series, or keyword…' onChange={(event) => setSearchInput(event.target.value)} /><button className='button-primary' type='submit' disabled={!searchInput.trim()}>Search</button></div>
					<small>Searches are limited to 256 characters.</small>
				</form>
				<nav className='seerr-discover-nav' aria-label='Discover categories'>{discoverOptions.map((option) => <button key={option.value} type='button' aria-pressed={!submittedQuery && discoverKind === option.value} onClick={() => selectDiscoverKind(option.value)}>{option.label}</button>)}</nav>
				<header className='seerr-browse__header'><div><span>{submittedQuery ? 'Search results' : 'Discover'}</span><h2 id='seerr-browse-title'>{submittedQuery ? `Results for “${submittedQuery}”` : selectedDiscoverLabel}</h2></div>{browseData && <strong>{browseData.totalResults} titles</strong>}</header>
				{browseLoading && !browseData && <ModuleState kind='loading' title={submittedQuery ? 'Searching Seerr' : 'Loading recommendations'}>{submittedQuery ? 'Looking for matching movies and TV shows.' : `Loading ${selectedDiscoverLabel.toLowerCase()} from Seerr.`}</ModuleState>}
				{browseError && !browseData && <div className='seerr-browse__error'><ModuleState kind='error' title='Media is unavailable'>{browseError}</ModuleState><button className='button-secondary' type='button' onClick={() => void loadBrowse()}>Try again</button></div>}
				{!browseLoading && !browseError && browseData?.results.length === 0 && <ModuleState kind='empty' title='No titles found'>{submittedQuery ? 'Try a different title or browse a discover category.' : 'Seerr did not return any titles in this category.'}</ModuleState>}
				{browseData && browseData.results.length > 0 && <ul className='seerr-media-grid'>{browseData.results.map((media) => <SeerrMediaCard key={`${media.mediaType}-${media.tmdbId}`} media={media} onSelect={setSelectedMedia} />)}</ul>}
				{browseData && <SeerrPagination page={browseData.page} totalPages={browseData.totalPages} label='Media result pages' onChange={(page) => { setBrowsePage(page); setBrowseData(null) }} />}
			</section>

			<SeerrRequestHistory
				data={historyData}
				loading={historyLoading}
				error={historyError ?? historyMutationError}
				filter={historyFilter}
				mineOnly={session.canViewAllRequests ? mineOnly : true}
				canManage={session.canManageRequests}
				canViewAll={session.canViewAllRequests}
				pendingRows={pendingRows}
				onFilterChange={(filter) => { setHistoryMutationError(null); setHistoryFilter(filter); setHistoryPage(1); setHistoryData(null) }}
				onMineChange={(value) => { if (session.canViewAllRequests) { setHistoryMutationError(null); setMineOnly(value); setHistoryPage(1); setHistoryData(null) } }}
				onPageChange={(page) => { setHistoryMutationError(null); setHistoryPage(page); setHistoryData(null) }}
				onRetry={() => { setHistoryMutationError(null); void loadHistory() }}
				onModerate={(request, action) => void moderateRequest(request, action)}
				onConfirm={(request, action) => { setConfirmationError(null); setConfirmation({ request, action }) }}
			/>
		</>}

		<DetailDrawer open={selectedMedia !== null} title={selectedMedia?.title ?? 'Title details'} onClose={() => { detailRequestId.current += 1; setSelectedMedia(null); setDetail(null); setRequestError(null) }}>
			{detailLoading && <ModuleState kind='loading' title='Loading title details'>Reading availability, seasons, and request status from Seerr.</ModuleState>}
			{detailError && !detailLoading && selectedMedia && <div className='seerr-detail__error'><ModuleState kind='error' title='Details are unavailable'>{detailError}</ModuleState><button className='button-secondary' type='button' onClick={() => void loadDetail(selectedMedia)}>Try again</button></div>}
			{detail && session?.mapped && !detailLoading && <SeerrDetailContent detail={detail} session={session} pending={requestPending} error={requestError} onRequest={(body) => void createRequest(body)} />}
		</DetailDrawer>

		<ConfirmActionDialog
			open={confirmation !== null}
			title={confirmation?.action === 'decline' ? 'Decline this request?' : 'Delete this request?'}
			description={confirmation?.action === 'decline' ? `Declining ${confirmation.request.title ?? 'this request'} will stop it from being approved.` : `Deleting ${confirmation?.request.title ?? 'this request'} removes it from Seerr request history.`}
			confirmLabel={confirmation?.action === 'decline' ? 'Decline request' : 'Delete request'}
			busy={Boolean(confirmation && pendingRows.has(confirmation.request.id))}
			error={confirmationError}
			onConfirm={() => void confirmPendingAction()}
			onCancel={() => { setConfirmation(null); setConfirmationError(null) }}
		/>
	</div>
}
