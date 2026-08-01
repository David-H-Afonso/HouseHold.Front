import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppCatalogSettingsSection } from './AppCatalogSettingsSection'

const mocks = vi.hoisted(() => ({ adminCatalog: vi.fn(), updateCatalogItem: vi.fn() }))

vi.mock('@/services/AppCatalogService', () => ({
	appCatalogService: {
		adminCatalog: mocks.adminCatalog,
		updateCatalogItem: mocks.updateCatalogItem,
	},
}))

const casaos = {
	id: 'casaos',
	name: 'CasaOS',
	category: 'System',
	description: 'Server dashboard',
	iconUrl: null,
	openUrl: 'http://192.168.0.32',
	favorite: true,
	enabled: true,
	monitoringEnabled: false,
	canUpdate: false,
	canRollback: false,
	updatedAt: '2026-08-01T12:00:00Z',
}

describe('AppCatalogSettingsSection', () => {
	beforeEach(() => {
		mocks.adminCatalog.mockResolvedValue([casaos])
		mocks.updateCatalogItem.mockResolvedValue(casaos)
	})

	it('shows server-controlled capabilities and persists browser metadata only', async () => {
		const user = userEvent.setup()
		render(<AppCatalogSettingsSection onNotice={vi.fn()} />)

		expect(await screen.findByText('Link only')).toBeInTheDocument()
		expect(screen.getByText('No updates')).toBeInTheDocument()
		expect(screen.getByText('No automatic rollback')).toBeInTheDocument()
		const openUrl = screen.getByLabelText('Preferred open URL')
		await user.clear(openUrl)
		await user.type(openUrl, 'http://casaos.lan')
		await user.click(screen.getByRole('button', { name: 'Save CasaOS' }))

		await waitFor(() => expect(mocks.updateCatalogItem).toHaveBeenCalledWith('casaos', {
			name: 'CasaOS',
			category: 'System',
			description: 'Server dashboard',
			iconUrl: null,
			openUrl: 'http://casaos.lan',
			favorite: true,
			enabled: true,
		}))
	})
})
