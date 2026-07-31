import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameModuleItem } from '@/models/api/Games'
import { gamesService } from '@/services'
import { TestProviders } from '@/test/providers'
import { GamesPage } from './GamesPage'

const game = (id: number, name: string, playWithNames?: string[]): GameModuleItem => ({
	id,
	name,
	statusId: 1,
	statusName: 'Playing',
	platformName: 'PC',
	cover: null,
	hero: null,
	grade: null,
	score: null,
	started: null,
	finished: null,
	openUrl: null,
	released: null,
	comment: null,
	critic: null,
	story: null,
	completion: null,
	playedStatusName: null,
	playWithNames,
})

describe('Games page', () => {
	beforeEach(() => {
		vi.spyOn(gamesService, 'statuses').mockResolvedValue([{ id: 1, name: 'Playing', color: '#5268e8', statusType: 'Active' }])
		vi.spyOn(gamesService, 'list').mockResolvedValue({
			items: [game(1, 'Blank party', [' ', '\t']), game(2, 'Shared party', [' Alex ', 'Sam'])],
			totalCount: 2,
			page: 1,
			pageSize: 48,
			totalPages: 1,
		})
	})

	afterEach(() => vi.restoreAllMocks())

	it('links the title, removes the intro, and omits blank Play with metadata', async () => {
		const user = userEvent.setup()
		render(<TestProviders links={{ 'games-database': 'https://games.example.test' }}><GamesPage /></TestProviders>)

		expect(screen.getByRole('link', { name: /Games.*opens in a new tab/ })).toHaveAttribute('href', 'https://games.example.test/')
		expect(screen.queryByText('Your complete Games Database shelf. Select a cover for provider detail and actions.')).not.toBeInTheDocument()
		await waitFor(() => expect(screen.getByRole('button', { name: /Blank party/i })).toBeInTheDocument())
		await user.click(screen.getByRole('button', { name: /Blank party/i }))
		expect(screen.queryByText('Play with')).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Close details' }))
		await user.click(screen.getByRole('button', { name: /Shared party/i }))
		expect(screen.getByText('Play with')).toBeInTheDocument()
		expect(screen.getByText('Alex, Sam')).toBeInTheDocument()
	})
})
