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
	updateAvailable?: boolean | null
	adminActionsAvailable: boolean
	monitoringEnabled: boolean
	canUpdate: boolean
	canRollback: boolean
}

export interface AppLauncherCategory {
	name: string
	count: number
}

export interface CasaOsConfig {
	configured: boolean
	hasToken: boolean
	hasRefreshToken: boolean
}

export interface UpdateCasaOsConfigRequest {
	internalBaseUrl: string
	rawToken?: string
	rawRefreshToken?: string
}

export type AppOperationAction = 'update' | 'rollback' | string

export interface AppOperation {
	actionLogId: string
	appId: string
	action: AppOperationAction
	status: string
	message: string
	startedAt: string
	finishedAt?: string | null
	errorCode?: string | null
	backupId?: string | null
	safetyBackupId?: string | null
	previousImages: string[]
	rollbackAvailable: boolean
}

export interface RollbackAppRequest {
	backupId?: string | null
	confirmation: string
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
	canUpdate: boolean
	canRollback: boolean
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
