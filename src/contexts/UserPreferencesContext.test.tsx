import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDefaultPreferences } from '@/models/api/Preferences'
import { preferencesService, type PreferencePersistence } from '@/services/PreferencesService'
import { UserPreferencesProvider } from './UserPreferencesContext'
import { useUserPreferences } from './useUserPreferences'

vi.mock('@/store/hooks', () => ({ useAppSelector: () => ({ userId: 'user-1' }) }))

const deferred = <T,>() => {
	let resolve!: (value: T) => void
	const promise = new Promise<T>((done) => { resolve = done })
	return { promise, resolve }
}

const PreferenceProbe = () => {
	const { preferences, persistence, saving, updatePreferences, resetPreferences } = useUserPreferences()
	return <div>
		<output aria-label='Sprite preference'>{preferences.pokemonSpriteSource}</output>
		<output aria-label='Visual preference'>{preferences.visualPreference}</output>
		<span>{saving ? 'Saving preferences' : 'Preferences saved'}</span>
		<span>{persistence}</span>
		<button type='button' onClick={() => void updatePreferences({ pokemonSpriteSource: 'artwork' })}>Artwork</button>
		<button type='button' onClick={() => void updatePreferences({ pokemonSpriteSource: 'showdown' })}>Showdown</button>
		<button type='button' onClick={resetPreferences}>Reset</button>
	</div>
}

describe('User preference persistence', () => {
	afterEach(() => vi.restoreAllMocks())

	it('serializes rapid saves so the last optimistic choice persists last', async () => {
		const first = deferred<PreferencePersistence>()
		const second = deferred<PreferencePersistence>()
		vi.spyOn(preferencesService, 'load').mockResolvedValue({ preferences: createDefaultPreferences(), persistence: 'server' })
		const save = vi.spyOn(preferencesService, 'save')
			.mockImplementationOnce(() => first.promise)
			.mockImplementationOnce(() => second.promise)
		const user = userEvent.setup()
		render(<UserPreferencesProvider><PreferenceProbe /></UserPreferencesProvider>)

		await screen.findByRole('button', { name: 'Artwork' })
		await user.click(screen.getByRole('button', { name: 'Artwork' }))
		await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
		await user.click(screen.getByRole('button', { name: 'Showdown' }))

		expect(screen.getByRole('status', { name: 'Sprite preference' })).toHaveTextContent('showdown')
		expect(screen.getByText('Saving preferences')).toBeInTheDocument()
		expect(save).toHaveBeenCalledTimes(1)
		expect(save.mock.calls[0][1].pokemonSpriteSource).toBe('artwork')

		await act(async () => first.resolve('device'))
		await waitFor(() => expect(save).toHaveBeenCalledTimes(2))
		expect(save.mock.calls[1][1].pokemonSpriteSource).toBe('showdown')
		expect(screen.getByText('Saving preferences')).toBeInTheDocument()

		await act(async () => second.resolve('server'))
		await waitFor(() => expect(screen.getByText('Preferences saved')).toBeInTheDocument())
		expect(screen.getByText('server')).toBeInTheDocument()
	})

	it('computes an edit made during reset from the reset result', async () => {
		const pendingReset = deferred<{ preferences: ReturnType<typeof createDefaultPreferences>; persistence: PreferencePersistence }>()
		vi.spyOn(preferencesService, 'load').mockResolvedValue({ preferences: createDefaultPreferences(), persistence: 'server' })
		vi.spyOn(preferencesService, 'reset').mockImplementation(() => pendingReset.promise)
		const save = vi.spyOn(preferencesService, 'save').mockResolvedValue('server')
		const user = userEvent.setup()
		render(<UserPreferencesProvider><PreferenceProbe /></UserPreferencesProvider>)

		await screen.findByRole('button', { name: 'Reset' })
		await user.click(screen.getByRole('button', { name: 'Reset' }))
		await user.click(screen.getByRole('button', { name: 'Artwork' }))
		expect(save).not.toHaveBeenCalled()

		const resetPreferences = { ...createDefaultPreferences(), visualPreference: 'dark' as const }
		await act(async () => pendingReset.resolve({ preferences: resetPreferences, persistence: 'server' }))

		await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
		expect(save.mock.calls[0][1].pokemonSpriteSource).toBe('artwork')
		expect(save.mock.calls[0][1].visualPreference).toBe('dark')
		await waitFor(() => expect(screen.getByRole('status', { name: 'Sprite preference' })).toHaveTextContent('artwork'))
	})
})
