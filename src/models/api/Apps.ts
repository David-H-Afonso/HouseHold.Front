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
	frontStatus: string
	apiStatus: string
	userConnectionStatus: string
	containerStatus: string
	image?: string | null
	ports: string[]
	lastUpdated?: string | null
	updateAvailable?: boolean | null
	adminActionsAvailable: boolean
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
}

export interface UpdateAppRequest {
	confirmation: string
}

export interface RollbackAppRequest {
	backupId?: string | null
	confirmation: string
}
