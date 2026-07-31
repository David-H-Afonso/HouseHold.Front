import { render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { operationsService } from '@/services'
import { createDefaultPreferences } from '@/models/api/Preferences'
import { TestProviders } from '@/test/providers'
import { preferencesValue } from '@/test/preferences'
import { WorkflowsPage } from './WorkflowsPage'

describe('Workflows execution dates', () => {
	afterEach(() => vi.restoreAllMocks())

	it('uses startedAt, falls back to completedAt, and keeps dates in the name area', async () => {
		vi.spyOn(operationsService, 'workflows').mockResolvedValue({
			generatedAtUtc: '2026-07-31T09:00:00Z',
			lastSuccessfulPoll: '2026-07-31T09:00:00Z',
			degraded: false,
			repositories: [
				{ repository: 'Owner/App.Front', status: 'completed', conclusion: 'success', branch: 'main', commit: 'abcdef123', actor: 'Alex', startedAt: '2026-07-31T08:00:00Z', completedAt: '2026-07-31T08:30:00Z', url: null, degraded: false },
				{ repository: 'Owner/App.Api', status: 'completed', conclusion: 'failure', branch: 'main', commit: '123456789', actor: 'Sam', startedAt: 'invalid', completedAt: '2026-07-30T12:15:00Z', url: null, degraded: false },
				{ repository: 'Owner/Worker.Api', status: 'queued', conclusion: null, branch: 'main', commit: null, actor: null, startedAt: null, completedAt: null, url: null, degraded: false },
			],
		})
		const preferences = createDefaultPreferences()
		preferences.timezone = 'UTC'
		const { container } = render(<TestProviders preferences={preferencesValue({ preferences })}><WorkflowsPage /></TestProviders>)

		await waitFor(() => expect(screen.getByText('Owner/App.Front')).toBeInTheDocument())
		const rows = [...container.querySelectorAll<HTMLElement>('.workflow-row')]
		const successRow = rows.find((row) => within(row).queryByText('Owner/App.Front'))!
		const fallbackRow = rows.find((row) => within(row).queryByText('Owner/App.Api'))!
		const missingRow = rows.find((row) => within(row).queryByText('Owner/Worker.Api'))!

		expect(successRow.querySelector('.workflow-row__name time')).toHaveAttribute('datetime', '2026-07-31T08:00:00.000Z')
		expect(fallbackRow.querySelector('.workflow-row__name time')).toHaveAttribute('datetime', '2026-07-30T12:15:00.000Z')
		expect(within(missingRow).getByText('Execution time unavailable')).toBeInTheDocument()
		expect(container.querySelector('.workflow-summary time')).toHaveAttribute('datetime', '2026-07-31T08:00:00.000Z')
	})
})
