import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AppLauncherItem } from '@/models/api/Apps'
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
	monitoringEnabled: true,
}

describe('AppLauncherCard', () => {
	it('only exposes the app link and favorite control', () => {
		render(<TestProviders><AppLauncherCard app={app} onToggleFavorite={vi.fn()} /></TestProviders>)

		expect(screen.getByRole('link', { name: /open/i })).toHaveAttribute('href', `${app.openUrl}/`)
		expect(screen.queryByRole('button', { name: /update|rollback|operation/i })).not.toBeInTheDocument()
	})
})
