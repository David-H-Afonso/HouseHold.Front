export type SeerrMediaType = 'movie' | 'tv'
export type SeerrDiscoverKind = 'trending' | 'movies' | 'tv' | 'upcoming-movies' | 'upcoming-tv'
export type SeerrRequestFilter = 'all' | 'approved' | 'available' | 'pending' | 'processing' | 'unavailable' | 'failed' | 'completed' | 'deleted'
export type SeerrRequestAction = 'approve' | 'decline' | 'retry'
export type SeerrMappingSource = 'jellyfin' | 'override'

export interface SeerrConfig {
	configured: boolean
	internalUrl: string | null
	publicUrl: string | null
	hasApiKey: boolean
	version: string | null
	reachable: boolean
}

export interface UpdateSeerrConfigRequest {
	internalUrl: string
	publicUrl: string
	apiKey?: string | null
}

export interface SeerrQuota {
	limit: number | null
	used: number
	remaining: number | null
	days: number
	restricted: boolean
}

export interface SeerrSession {
	configured: boolean
	mapped: boolean
	seerrUserId: number | null
	displayName: string | null
	mappingSource: string | null
	publicUrl: string | null
	permissions: number
	canRequestMovies: boolean
	canRequestTv: boolean
	canRequest4kMovies: boolean
	canRequest4kTv: boolean
	canManageRequests: boolean
	canViewAllRequests: boolean
	movieQuota: SeerrQuota | null
	tvQuota: SeerrQuota | null
}

export interface SeerrUserMapping {
	householdUserId: string
	userName: string
	jellyfinUserId: string | null
	jellyfinMappingApproved: boolean
	seerrUserIdOverride: number | null
	activeSource: SeerrMappingSource | null
}

export type UpdateSeerrUserMappingRequest =
	| { source: 'jellyfin'; jellyfinUserId: string; seerrUserId?: null }
	| { source: 'override'; jellyfinUserId?: null; seerrUserId: number }

export interface SeerrMediaCard {
	mediaType: SeerrMediaType
	tmdbId: number
	title: string
	year: string | null
	posterPath: string | null
	backdropPath: string | null
	overview: string | null
	voteAverage: number | null
	mediaStatus: number
	mediaStatus4k: number | null
	requestStatus: number | null
}

export interface SeerrSearchResponse {
	page: number
	totalPages: number
	totalResults: number
	results: SeerrMediaCard[]
}

export interface SeerrSeason {
	seasonNumber: number
	name: string | null
	episodeCount: number
	status: number | null
	status4k: number | null
}

export interface SeerrDetail {
	mediaType: SeerrMediaType
	tmdbId: number
	title: string
	year: string | null
	posterPath: string | null
	backdropPath: string | null
	overview: string | null
	voteAverage: number | null
	runtime: number | null
	genres: string[]
	seasons: SeerrSeason[]
	mediaStatus: number
	mediaStatus4k: number | null
	requestStatus: number | null
	imdbId: string | null
	tvdbId: number | null
}

export interface SeerrRequest {
	id: number
	mediaType: SeerrMediaType
	tmdbId: number
	title: string | null
	posterPath: string | null
	requestStatus: number
	mediaStatus: number
	is4k: boolean
	requestedBy: string | null
	requestedByUserId: number | null
	isMine: boolean
	seasons: number[]
	createdAt: string | null
}

export interface SeerrRequestList {
	page: number
	totalPages: number
	totalResults: number
	results: SeerrRequest[]
}

export interface CreateSeerrRequestBody {
	mediaType: SeerrMediaType
	mediaId: number
	is4k: boolean
	seasons?: number[]
}
