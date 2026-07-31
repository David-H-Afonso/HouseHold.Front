import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { appCatalogService, moduleService, operationsService } from '@/services'
import { TestProviders } from '@/test/providers'
import { AppsPage } from './AppsPage'
import { JellyfinPage } from './JellyfinPage'
import { MediaPage } from './MediaPage'

vi.mock('@/store/hooks', () => ({ useAppSelector: () => false }))

describe('removed module descriptions', () => {
	afterEach(() => vi.restoreAllMocks())

	it('does not render the Apps intro description', async () => {
		vi.spyOn(appCatalogService, 'list').mockResolvedValue([])
		render(<TestProviders><AppsPage /></TestProviders>)
		await waitFor(() => expect(screen.getByRole('heading', { name: 'No app launcher config found' })).toBeInTheDocument())
		expect(screen.queryByText('Open every available service safely and compare service health, deployed image, and last check at a glance.')).not.toBeInTheDocument()
	})

	it('does not render the Jellyfin header description', async () => {
		vi.spyOn(operationsService, 'jellyfin').mockResolvedValue({ openUrl: 'https://jellyfin.example.test', continueWatching: [], nextUp: [], dashboardItems: [], usedNextUpFallback: false })
		render(<TestProviders><JellyfinPage /></TestProviders>)
		await screen.findByRole('link', { name: /Jellyfin.*opens in a new tab/ })
		expect(screen.queryByText('Resume what you were watching or jump directly into the next episode.')).not.toBeInTheDocument()
	})

	it('does not render the Jellywatch header description', async () => {
		vi.spyOn(moduleService, 'media').mockResolvedValue({
			profile: { displayName: 'Alex', totalSeriesWatching: 0, totalSeriesCompleted: 0, totalMoviesSeen: 0, totalEpisodesSeen: 0 },
			activity: [],
			upcoming: [],
		})
		render(<TestProviders links={{ jellywatch: 'https://jellywatch.example.test' }}><MediaPage /></TestProviders>)
		await screen.findByRole('heading', { name: "Alex's watchlist" })
		expect(screen.queryByText("What's next and what you watched most recently.")).not.toBeInTheDocument()
	})
})
