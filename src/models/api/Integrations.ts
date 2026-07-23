export type IntegrationType =
	| 'CasaOS'
	| 'Docker'
	| 'GamesDatabase'
	| 'Jellywatch'
	| 'Jellyfin'
	| 'Seerr'
	| 'QBittorrent'
	| 'Sonarr'
	| 'Radarr'
	| 'WgEasy'
	| 'WarcraftArchive'
	| 'BeastVault'

export type IntegrationHealthStatus = 'NotConfigured' | 'Unknown' | 'Healthy' | 'Degraded' | 'Offline'

export interface Integration {
	id: string
	type: IntegrationType
	name: string
	baseUrl?: string | null
	openUrl?: string | null
	enabled: boolean
	lastHealthStatus: IntegrationHealthStatus
	lastCheckedAt?: string | null
	createdAt: string
	updatedAt: string
	secretKeys: string[]
}

export interface UpsertIntegrationRequest {
	type: IntegrationType
	name: string
	baseUrl?: string | null
	openUrl?: string | null
	enabled: boolean
	secrets?: Record<string, string>
}

export interface IntegrationHealth {
	integrationId?: string | null
	type: IntegrationType
	name: string
	status: IntegrationHealthStatus
	message: string
	checkedAt: string
}

export type HouseholdProviderId =
	| 'doit'
	| 'games-database'
	| 'jellywatch'
	| 'beast-vault'
	| 'warcraft-archive'

export type HouseholdConnectionStatus = 'Disconnected' | 'Connected' | 'Expired' | 'Error'

export interface HouseholdConnection {
	provider: HouseholdProviderId
	displayName: string
	configured: boolean
	openUrl?: string | null
	status: HouseholdConnectionStatus
	accountDisplayName?: string | null
	accountId?: string | null
	grantedScopes: string[]
	connectedAt?: string | null
	lastValidatedAt?: string | null
	lastError?: string | null
}

export interface HouseholdAuthorizationResponse {
	authorizationUrl: string
}

export interface DashboardWidget {
	id: string
	widgetType: string
	integrationId?: string | null
	position: number
	enabled: boolean
	settingsJson?: string | null
}

export interface DashboardResponse {
	generatedAt: string
	integrationHealth: IntegrationHealth[]
	widgets: DashboardWidget[]
}
