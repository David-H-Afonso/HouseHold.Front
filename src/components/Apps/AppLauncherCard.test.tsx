import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppLauncherItem } from '@/models/api/Apps'
import { appCatalogService } from '@/services'
import { TestProviders } from '@/test/providers'
import { AppLauncherCard } from './AppLauncherCard'

const app: AppLauncherItem = {
	id: 'household',
	name: 'Household',
	category: 'Home',
	description: null,
	iconUrl: null,
	openUrl: 'https://household.example.test',
	favorite: true,
	healthStatus: 'Healthy',
	frontStatus: 'healthy',
	apiStatus: 'healthy',
	userConnectionStatus: 'not_applicable',
	containerStatus: 'running',
	ports: [],
	adminActionsAvailable: true,
	monitoringEnabled: true,
	canUpdate: true,
	canRollback: false,
}

describe('App operation disclosure', () => {
	afterEach(() => vi.restoreAllMocks())

	it('shows operation history without inferring rollback safety from a backup ID', async () => {
		vi.spyOn(appCatalogService, 'operations').mockResolvedValue([{
			actionLogId: 'operation-1',
			appId: app.id,
			action: 'update',
			status: 'succeeded',
			message: 'Updated',
			startedAt: '2026-07-31T08:00:00Z',
			finishedAt: '2026-07-31T08:05:00Z',
			backupId: 'backup-1',
			errorCode: null,
			safetyBackupId: null,
			previousImages: [],
			rollbackAvailable: false,
		}])
		const user = userEvent.setup()
		render(<TestProviders><AppLauncherCard app={app} isAdmin onToggleFavorite={vi.fn()} /></TestProviders>)

		const toggle = await screen.findByRole('button', { name: 'Operations 1' })
		expect(toggle).toHaveAttribute('aria-expanded', 'false')
		expect(toggle).toHaveAttribute('aria-controls')
		expect(toggle.querySelector('svg')).toBeInTheDocument()
		const controls = toggle.getAttribute('aria-controls')!
		expect(document.getElementById(controls)).not.toBeInTheDocument()

		await user.click(toggle)
		expect(toggle).toHaveAttribute('aria-expanded', 'true')
		await waitFor(() => expect(document.getElementById(controls)).toBeInTheDocument())
		expect(screen.getByRole('list', { name: 'Household operation history' })).toHaveAttribute('id', controls)
		expect(screen.queryByRole('button', { name: 'Rollback this backup' })).not.toBeInTheDocument()
	})

	it('requires explicit confirmation before queuing an update', async () => {
		vi.spyOn(appCatalogService, 'operations').mockResolvedValue([])
		const update = vi.spyOn(appCatalogService, 'update').mockResolvedValue()
		const user = userEvent.setup()
		render(<TestProviders><AppLauncherCard app={app} isAdmin onToggleFavorite={vi.fn()} /></TestProviders>)

		await user.click(screen.getByRole('button', { name: 'Check/update' }))

		const dialog = screen.getByRole('dialog', { name: 'Update Household' })
		expect(dialog).toBeInTheDocument()
		expect(update).not.toHaveBeenCalled()
		await user.type(screen.getByLabelText('Enter UPDATE household to continue'), 'UPDATE household')
		await user.click(screen.getByRole('button', { name: 'Queue update' }))
		await waitFor(() => expect(update).toHaveBeenCalledWith('household', { confirmation: 'UPDATE household' }))
		await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Update Household' })).not.toBeInTheDocument())
	})
})
