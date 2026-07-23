import type { IntegrationHealthStatus } from './Integrations'

export interface AppLauncherItem {
	id: string
	name: string
	category: string
	description?: string | null
	iconUrl?: string | null
	internalUrl?: string | null
	externalUrl?: string | null
	openUrl?: string | null
	favorite: boolean
	healthStatus: IntegrationHealthStatus
	containerStatus: string
	image?: string | null
	ports: string[]
	lastUpdated?: string | null
	adminActionsAvailable: boolean
}

export interface AppLauncherCategory {
	name: string
	count: number
}
