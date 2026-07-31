import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProviderLinksContext } from '@/contexts/useProviderLinks'
import { createDefaultPreferences } from '@/models/api/Preferences'
import { DashboardPage } from './DashboardPage'

const mocks = vi.hoisted(() => ({
	usePreferences: vi.fn(),
	games: vi.fn(),
	media: vi.fn(),
	warcraft: vi.fn(),
	apps: vi.fn(),
	pokemon: vi.fn(),
	jellyfin: vi.fn(),
	workflows: vi.fn(),
	calendar: vi.fn(),
}))

vi.mock('@/contexts/useUserPreferences', () => ({ useUserPreferences: mocks.usePreferences }))
vi.mock('@/hooks', () => ({
	useTodayModule: () => ({ data: null, loading: false, providerError: false, actionError: null, pendingOccurrences: new Set(), refetch: vi.fn(), runAction: vi.fn() }),
}))
vi.mock('@/services/AppCatalogService', () => ({ appCatalogService: { list: mocks.apps } }))
vi.mock('@/services', () => ({
	gamesService: { list: mocks.games },
	moduleService: { media: mocks.media, warcraft: mocks.warcraft, pokemon: mocks.pokemon, calendarEvents: mocks.calendar },
	operationsService: { jellyfin: mocks.jellyfin, workflows: mocks.workflows },
}))

describe('Dashboard navigation', () => {
	beforeEach(() => {
		const preferences = createDefaultPreferences()
		preferences.gameStatusIds = [1]
		mocks.usePreferences.mockReturnValue({ preferences, ready: true })
		mocks.games.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 30 })
		mocks.media.mockResolvedValue({ profile: { displayName: '', totalSeriesWatching: 0, totalSeriesCompleted: 0, totalMoviesSeen: 0, totalEpisodesSeen: 0 }, activity: [], upcoming: [] })
		mocks.warcraft.mockResolvedValue({ generatedAtUtc: '', summary: { total: 0, notStarted: 0, pending: 0, inProgress: 0, lastDay: 0, lastWeek: 0, finished: 0, remaining: 0, completionPercent: 0 }, items: [] })
		mocks.apps.mockResolvedValue([])
		mocks.pokemon.mockResolvedValue({ items: [], total: 0, skip: 0, take: 12 })
		mocks.jellyfin.mockResolvedValue({ openUrl: 'https://jellyfin.example.test', continueWatching: [], nextUp: [], dashboardItems: [], usedNextUpFallback: false })
		mocks.workflows.mockResolvedValue({ generatedAtUtc: '', degraded: false, repositories: [] })
		mocks.calendar.mockResolvedValue([])
	})

	it('keeps dashboard arrows as explicitly labelled same-tab router links', async () => {
		render(<MemoryRouter>
			<ProviderLinksContext.Provider value={{ links: { 'games-database': 'https://games.example.test' } }}>
				<DashboardPage />
			</ProviderLinksContext.Provider>
		</MemoryRouter>)

		const provider = screen.getByRole('link', { name: /Games Database.*opens in a new tab/ })
		expect(provider).toHaveAttribute('target', '_blank')

		const internal = screen.getByRole('link', { name: 'View Games Database in Household' })
		expect(internal).toHaveAttribute('href', '/games')
		expect(internal).not.toHaveAttribute('target')
		expect(screen.getByRole('region', { name: "Today's tasks" })).toBeInTheDocument()
		expect(screen.queryByRole('heading', { name: "Today's tasks" })).not.toBeInTheDocument()
		await waitFor(() => expect(mocks.games).toHaveBeenCalled())
	})
})
