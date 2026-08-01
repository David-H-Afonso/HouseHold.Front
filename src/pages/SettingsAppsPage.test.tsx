import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultPreferences } from '@/models/api/Preferences'
import { SettingsAppsPage } from './SettingsAppsPage'

const mocks = vi.hoisted(() => ({
	usePreferences: vi.fn(),
	useSelector: vi.fn(),
	jellyfinConfig: vi.fn(),
	githubConfig: vi.fn(),
	casaOsConfig: vi.fn(),
	seerrConfig: vi.fn(),
	updateSeerrConfig: vi.fn(),
	mappings: vi.fn(),
	updateMapping: vi.fn(),
	clearMapping: vi.fn(),
	adminCatalog: vi.fn(),
	updateCatalogItem: vi.fn(),
}))

vi.mock('@/contexts/useUserPreferences', () => ({ useUserPreferences: mocks.usePreferences }))
vi.mock('@/store/hooks', () => ({ useAppSelector: mocks.useSelector }))
vi.mock('@/services/AppCatalogService', () => ({
	appCatalogService: {
		adminCatalog: mocks.adminCatalog,
		updateCatalogItem: mocks.updateCatalogItem,
	},
}))
vi.mock('@/services', () => ({
	operationsService: {
		jellyfinConfig: mocks.jellyfinConfig,
		githubConfig: mocks.githubConfig,
		updateJellyfinConfig: vi.fn(),
		updateGitHubConfig: vi.fn(),
	},
	casaOsService: { config: mocks.casaOsConfig, updateConfig: vi.fn() },
	seerrService: {
		config: mocks.seerrConfig,
		updateConfig: mocks.updateSeerrConfig,
		mappings: mocks.mappings,
		updateMapping: mocks.updateMapping,
		clearMapping: mocks.clearMapping,
	},
}))

const mapping = {
	householdUserId: '00000000-0000-0000-0000-000000000001',
	userName: 'Alice',
	jellyfinUserId: 'jellyfin-alice',
	jellyfinMappingApproved: true,
	seerrUserIdOverride: null,
	activeSource: 'jellyfin' as const,
}

describe('SettingsAppsPage Seerr administration', () => {
	beforeEach(() => {
		mocks.usePreferences.mockReturnValue({ preferences: createDefaultPreferences(), updatePreferences: vi.fn(), saving: false, persistence: 'server', ready: true })
		mocks.jellyfinConfig.mockResolvedValue({ configured: true, publicUrl: 'https://jellyfin.example.test', hasApiKey: true })
		mocks.githubConfig.mockResolvedValue({ configured: true, hasToken: true })
		mocks.casaOsConfig.mockResolvedValue({ configured: true, hasToken: true, hasRefreshToken: true })
		mocks.seerrConfig.mockResolvedValue({ configured: true, internalUrl: 'http://seerr:5055', publicUrl: 'https://seerr.example.test', hasApiKey: true, version: '2.7.0', reachable: true })
		mocks.mappings.mockResolvedValue([mapping])
		mocks.updateSeerrConfig.mockResolvedValue({ configured: true, internalUrl: 'http://seerr:5055', publicUrl: 'https://seerr.example.test', hasApiKey: true, version: '2.7.0', reachable: true })
		mocks.updateMapping.mockResolvedValue({ ...mapping, activeSource: 'override', seerrUserIdOverride: 19 })
		mocks.adminCatalog.mockResolvedValue([])
	})

	it('does not call or expose Seerr administration for ordinary Household users', () => {
		mocks.useSelector.mockReturnValue(false)
		render(<SettingsAppsPage />)

		expect(screen.queryByRole('heading', { name: 'Seerr server' })).not.toBeInTheDocument()
		expect(mocks.seerrConfig).not.toHaveBeenCalled()
		expect(mocks.mappings).not.toHaveBeenCalled()
	})

	it('keeps the API key optional after configuration and saves a numeric mapping override', async () => {
		const user = userEvent.setup()
		mocks.useSelector.mockReturnValue(true)
		mocks.mappings
			.mockResolvedValueOnce([mapping])
			.mockResolvedValueOnce([{ ...mapping, activeSource: 'override', seerrUserIdOverride: 19 }])
		render(<SettingsAppsPage />)

		const seerrHeading = await screen.findByRole('heading', { name: 'Seerr server' })
		expect(seerrHeading).toBeInTheDocument()
		const seerrSection = seerrHeading.closest('section')
		expect(seerrSection).not.toBeNull()
		const apiKey = within(seerrSection!).getByLabelText('New API key (leave empty to retain)')
		expect(apiKey).not.toBeRequired()
		await user.click(screen.getByRole('button', { name: 'Save Seerr' }))
		await waitFor(() => expect(mocks.updateSeerrConfig).toHaveBeenCalledWith({ internalUrl: 'http://seerr:5055', publicUrl: 'https://seerr.example.test' }))

		const card = screen.getByText('Alice', { selector: 'strong' }).closest('article')
		expect(card).not.toBeNull()
		const editor = within(card!)
		await user.click(editor.getByLabelText(/Numeric override/))
		await user.type(editor.getByLabelText('Seerr User ID'), '19')
		await user.click(editor.getByRole('button', { name: 'Save mapping' }))

		await waitFor(() => expect(mocks.updateMapping).toHaveBeenCalledWith(mapping.householdUserId, { source: 'override', seerrUserId: 19 }))
		expect(mocks.mappings).toHaveBeenCalledTimes(2)
	})
})
