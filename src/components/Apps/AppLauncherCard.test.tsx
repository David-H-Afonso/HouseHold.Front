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
}

describe('App operation disclosure', () => {
	afterEach(() => vi.restoreAllMocks())

	it('exposes count, state, controlled panel, and a usable rollback action', async () => {
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
		expect(screen.getByRole('button', { name: 'Rollback this backup' })).toBeEnabled()
	})

	it('queues an update immediately without opening a dialog', async () => {
		vi.spyOn(appCatalogService, 'operations').mockResolvedValue([])
		const update = vi.spyOn(appCatalogService, 'update').mockResolvedValue()
		const user = userEvent.setup()
		render(<TestProviders><AppLauncherCard app={app} isAdmin onToggleFavorite={vi.fn()} /></TestProviders>)

		await user.click(screen.getByRole('button', { name: 'Check/update' }))

		await waitFor(() => expect(update).toHaveBeenCalledWith('household', { confirmation: 'UPDATE household' }))
		expect(screen.queryByRole('dialog', { name: 'Update Household' })).not.toBeInTheDocument()
	})
})
