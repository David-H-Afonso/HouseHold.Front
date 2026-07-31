import { useState, type ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProviderLinksContext } from '@/contexts/useProviderLinks'
import { UserPreferencesContext } from '@/contexts/useUserPreferences'
import { createDefaultPreferences, type UserPreferences } from '@/models/api/Preferences'
import { moduleService } from '@/services'
import { PokemonPage } from './PokemonPage'

const PreferencesHarness = ({ children }: { children: ReactNode }) => {
	const [preferences, setPreferences] = useState(createDefaultPreferences)
	const updatePreferences = async (update: Partial<UserPreferences> | ((current: UserPreferences) => UserPreferences)) => {
		setPreferences((current) => typeof update === 'function' ? update(current) : { ...current, ...update })
	}
	return <UserPreferencesContext.Provider value={{ preferences, ready: true, saving: false, persistence: 'server', updatePreferences, resetPreferences: () => {} }}>{children}</UserPreferencesContext.Provider>
}

describe('Pokémon sprite selection', () => {
	afterEach(() => vi.restoreAllMocks())

	it('updates immediately, requests the selected typed source, and keeps labels accessible', async () => {
		const pokemon = vi.spyOn(moduleService, 'pokemon').mockImplementation(async ({ spriteSource }) => ({
			items: [{ id: 1, speciesId: 25, speciesName: 'Pikachu', formName: null, nickname: null, level: 42, isShiny: false, favorite: true, isEgg: false, type1: 'electric', type2: null, spriteUrl: `https://assets.example.test/${spriteSource}.png`, fallbackSpriteUrl: null, addedAt: null, tags: [], openUrl: 'https://beast.example.test/pokemon/1' }],
			total: 1,
			skip: 0,
			take: spriteSource === 'artwork' ? 24 : 24,
		}))
		vi.spyOn(moduleService, 'pokemonTags').mockResolvedValue([])
		const user = userEvent.setup()
		render(<MemoryRouter><PreferencesHarness><ProviderLinksContext.Provider value={{ links: { 'beast-vault': 'https://beast.example.test' } }}><PokemonPage /></ProviderLinksContext.Provider></PreferencesHarness></MemoryRouter>)

		const select = screen.getByLabelText('Sprite source')
		await waitFor(() => expect(pokemon).toHaveBeenCalledWith(expect.objectContaining({ spriteSource: 'home' })))
		pokemon.mockClear()
		await user.selectOptions(select, 'artwork')

		expect(select).toHaveValue('artwork')
		await waitFor(() => expect(pokemon).toHaveBeenCalledWith(expect.objectContaining({ spriteSource: 'artwork' })))
		await waitFor(() => expect(screen.getByRole('img', { name: 'Pikachu' })).toHaveAttribute('src', 'https://assets.example.test/artwork.png'))
		expect(screen.getByText('Sprite source')).toHaveClass('sr-only')
		expect(screen.queryByText('Browse companions by species, nickname or tags.')).not.toBeInTheDocument()
		const titleRow = screen.getByRole('heading', { name: 'Pokémon collection' }).closest('.pokemon-page__title-row')!
		expect(within(titleRow).getByText('1')).toBeInTheDocument()
		const cardLink = screen.getByRole('link', { name: 'Open Pikachu in Beast Vault' })
		expect(cardLink).not.toContainElement(screen.getByRole('button', { name: 'Download Pikachu' }))
	})
})
