import type { IntegrationHealthStatus } from './Integrations'

export interface AppLauncherItem {
	id: string
	name: string
	category: string
	description?: string | null
	iconUrl?: string | null
	openUrl?: string | null
	favorite: boolean
	healthStatus: IntegrationHealthStatus
	frontStatus: string
	apiStatus: string
	userConnectionStatus: string
	containerStatus: string
	image?: string | null
	ports: string[]
	lastUpdated?: string | null
	monitoringEnabled: boolean
}

export interface AppLauncherCategory {
	name: string
	count: number
}

export interface AdminAppCatalogItem {
	id: string
	name: string
	category: string
	description?: string | null
	iconUrl?: string | null
	openUrl?: string | null
	favorite: boolean
	enabled: boolean
	monitoringEnabled: boolean
	updatedAt: string
}

export interface UpdateAppCatalogItemRequest {
	name: string
	category: string
	description?: string | null
	iconUrl?: string | null
	openUrl?: string | null
	favorite: boolean
	enabled: boolean
}
