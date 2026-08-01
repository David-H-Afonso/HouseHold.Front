import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SeerrSession } from '@/models/api/Seerr'
import { SeerrRequestsPage } from './SeerrRequestsPage'

const mocks = vi.hoisted(() => ({
	useSelector: vi.fn(),
	session: vi.fn(),
	search: vi.fn(),
	discover: vi.fn(),
	detail: vi.fn(),
	requests: vi.fn(),
	createRequest: vi.fn(),
	moderateRequest: vi.fn(),
	deleteRequest: vi.fn(),
}))

vi.mock('@/store/hooks', () => ({ useAppSelector: mocks.useSelector }))
vi.mock('@/services', () => ({
	seerrService: {
		session: mocks.session,
		search: mocks.search,
		discover: mocks.discover,
		detail: mocks.detail,
		requests: mocks.requests,
		createRequest: mocks.createRequest,
		moderateRequest: mocks.moderateRequest,
		deleteRequest: mocks.deleteRequest,
	},
}))

const mappedSession = (overrides: Partial<SeerrSession> = {}): SeerrSession => ({
	configured: true,
	mapped: true,
	seerrUserId: 7,
	displayName: 'Alex',
	mappingSource: 'jellyfin',
	publicUrl: 'https://seerr.example.test',
	permissions: 32,
	canRequestMovies: true,
	canRequestTv: true,
	canRequest4kMovies: false,
	canRequest4kTv: false,
	canManageRequests: false,
	canViewAllRequests: false,
	movieQuota: null,
	tvQuota: null,
	...overrides,
})

const emptyMedia = { page: 1, totalPages: 1, totalResults: 0, results: [] }

describe('SeerrRequestsPage', () => {
	beforeEach(() => {
		mocks.useSelector.mockReturnValue(false)
		mocks.discover.mockResolvedValue(emptyMedia)
		mocks.search.mockResolvedValue(emptyMedia)
		mocks.requests.mockResolvedValue({ page: 1, totalPages: 1, totalResults: 0, results: [] })
		mocks.moderateRequest.mockResolvedValue(undefined)
	})

	it('does not browse or load requests while the user is unmapped', async () => {
		mocks.session.mockResolvedValue(mappedSession({ mapped: false, seerrUserId: null, displayName: null, canRequestMovies: false, canRequestTv: false }))
		render(<MemoryRouter><SeerrRequestsPage /></MemoryRouter>)

		expect(await screen.findByRole('heading', { name: 'Your Seerr account is not linked' })).toBeInTheDocument()
		expect(mocks.search).not.toHaveBeenCalled()
		expect(mocks.discover).not.toHaveBeenCalled()
		expect(mocks.requests).not.toHaveBeenCalled()
	})

	it('defaults ordinary users to their own requests and hides moderation', async () => {
		mocks.session.mockResolvedValue(mappedSession())
		mocks.requests.mockResolvedValue({
			page: 1,
			totalPages: 1,
			totalResults: 1,
			results: [{ id: 12, mediaType: 'movie', tmdbId: 42, title: 'Dune', posterPath: '/raw-path.jpg', requestStatus: 1, mediaStatus: 2, is4k: false, requestedBy: 'Alex', requestedByUserId: 7, isMine: true, seasons: [], createdAt: '2026-08-01T10:00:00Z' }],
		})
		render(<MemoryRouter><SeerrRequestsPage /></MemoryRouter>)

		expect(await screen.findByText('Showing requests from your account.')).toBeInTheDocument()
		await waitFor(() => expect(mocks.requests).toHaveBeenCalledWith('all', true, 1, expect.any(AbortSignal)))
		expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
	})

	it('uses the URL query and exposes moderation only from the Seerr session', async () => {
		const user = userEvent.setup()
		mocks.session.mockResolvedValue(mappedSession({ canManageRequests: true, canViewAllRequests: true }))
		mocks.requests.mockResolvedValue({
			page: 1,
			totalPages: 1,
			totalResults: 1,
			results: [{ id: 15, mediaType: 'tv', tmdbId: 99, title: 'Andor', posterPath: null, requestStatus: 1, mediaStatus: 2, is4k: false, requestedBy: 'Sam', requestedByUserId: 8, isMine: false, seasons: [1], createdAt: null }],
		})
		render(<MemoryRouter initialEntries={['/media/requests?q=%20Dune%20']}><SeerrRequestsPage /></MemoryRouter>)

		await waitFor(() => expect(mocks.search).toHaveBeenCalledWith('Dune', 1, expect.any(AbortSignal)))
		await waitFor(() => expect(mocks.requests).toHaveBeenCalledWith('all', false, 1, expect.any(AbortSignal)))
		await user.click(await screen.findByRole('button', { name: 'Decline' }))
		expect(screen.getByRole('dialog', { name: 'Decline this request?' })).toBeInTheDocument()
		expect(mocks.moderateRequest).not.toHaveBeenCalled()
		await user.click(screen.getByRole('button', { name: 'Cancel' }))
		await user.click(screen.getByRole('button', { name: 'Delete' }))
		expect(screen.getByRole('dialog', { name: 'Delete this request?' })).toBeInTheDocument()
		expect(mocks.deleteRequest).not.toHaveBeenCalled()
		await user.click(screen.getByRole('button', { name: 'Cancel' }))
		await user.click(await screen.findByRole('button', { name: 'Approve' }))
		expect(mocks.moderateRequest).toHaveBeenCalledWith(15, 'approve')
		await waitFor(() => expect(mocks.requests.mock.calls.length).toBeGreaterThan(1))
	})
})
