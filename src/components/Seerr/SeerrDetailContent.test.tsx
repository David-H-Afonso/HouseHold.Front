import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { SeerrDetail, SeerrSession } from '@/models/api/Seerr'
import { SeerrDetailContent } from './SeerrDetailContent'

const session: SeerrSession = {
	configured: true,
	mapped: true,
	seerrUserId: 7,
	displayName: 'Alex',
	mappingSource: 'jellyfin',
	publicUrl: null,
	permissions: 0,
	canRequestMovies: true,
	canRequestTv: true,
	canRequest4kMovies: false,
	canRequest4kTv: true,
	canManageRequests: false,
	canViewAllRequests: false,
	movieQuota: null,
	tvQuota: { limit: 5, used: 2, remaining: 3, days: 7, restricted: true },
}

const detail: SeerrDetail = {
	mediaType: 'tv',
	tmdbId: 42,
	title: 'Example series',
	year: '2026',
	posterPath: '/raw.jpg',
	backdropPath: null,
	overview: 'A test series.',
	voteAverage: 8.2,
	runtime: 48,
	genres: ['Drama'],
	seasons: [
		{ seasonNumber: 1, name: 'Season 1', episodeCount: 8, status: 1, status4k: 1 },
		{ seasonNumber: 2, name: 'Season 2', episodeCount: 10, status: 5, status4k: 5 },
	],
	mediaStatus: 4,
	mediaStatus4k: 1,
	requestStatus: null,
	imdbId: null,
	tvdbId: null,
}

describe('SeerrDetailContent', () => {
	it('submits selected TV seasons with the media-specific 4K permission and explains quota', async () => {
		const user = userEvent.setup()
		const onRequest = vi.fn()
		render(<SeerrDetailContent detail={detail} session={session} pending={false} error={null} onRequest={onRequest} />)

		expect(screen.getByText('3 of 5 tv requests remain in the current 7-day window.')).toBeInTheDocument()
		await user.click(screen.getByRole('radio', { name: '4K' }))
		await user.click(screen.getByRole('checkbox', { name: /Season 1/ }))
		expect(screen.getByRole('checkbox', { name: /Season 2/ })).toBeDisabled()
		await user.click(screen.getByRole('button', { name: 'Request in 4K' }))

		expect(onRequest).toHaveBeenCalledWith({ mediaType: 'tv', mediaId: 42, is4k: true, seasons: [1] })
	})

	it('does not borrow TV 4K permission for a movie request', () => {
		render(<SeerrDetailContent detail={{ ...detail, mediaType: 'movie', seasons: [], mediaStatus: 1, mediaStatus4k: null }} session={session} pending={false} error={null} onRequest={vi.fn()} />)

		expect(screen.queryByRole('radio', { name: '4K' })).not.toBeInTheDocument()
		expect(screen.getByRole('radio', { name: 'Standard' })).toBeInTheDocument()
	})
})
