export type ProviderState = 'ready' | 'notConnected' | 'permissionMissing' | 'notConfigured' | 'unavailable'

export interface JellyfinMediaItem {
	id: string
	name: string
	seriesName?: string | null
	parentIndexNumber?: number | null
	indexNumber?: number | null
	imageUrl?: string | null
	openUrl?: string | null
	progressPercent?: number | null
	runTimeTicks?: number | null
	playbackPositionTicks?: number | null
}

export interface JellyfinModuleResponse {
	continueWatching: JellyfinMediaItem[]
	nextUp: JellyfinMediaItem[]
	dashboardItems: JellyfinMediaItem[]
	usedNextUpFallback: boolean
}

export interface JellyfinConfig {
	configured: boolean
	publicUrl?: string | null
	hasApiKey: boolean
}

export interface UpdateJellyfinConfigRequest {
	internalUrl?: string | null
	publicUrl?: string | null
	apiKey?: string | null
}

export interface WorkflowRun {
	repository: string
	runId?: number | null
	status?: string | null
	conclusion?: string | null
	branch?: string | null
	commit?: string | null
	actor?: string | null
	startedAt?: string | null
	completedAt?: string | null
	url?: string | null
	lastSuccessfulPoll?: string | null
	degraded: boolean
	errorCode?: string | null
}

export interface WorkflowsResponse {
	generatedAtUtc: string
	lastSuccessfulPoll?: string | null
	degraded: boolean
	repositories: WorkflowRun[]
}

export interface GitHubActionsConfig {
	configured: boolean
	hasToken: boolean
}

export interface InviteUserRequest {
	email: string
	userName: string
	isAdmin: boolean
	expiresInHours: number
}

export interface UserInvitation {
	id: string
	token: string
	expiresAt: string
}

export interface UpdateUserRequest {
	userName: string
	email: string
	isAdmin: boolean
	isActive: boolean
}

export interface RedeemInvitationRequest {
	token: string
	password: string
}
