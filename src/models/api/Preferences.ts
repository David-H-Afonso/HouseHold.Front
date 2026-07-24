export type DashboardWidgetId =
	| 'app-status'
	| 'games'
	| 'today'
	| 'jellywatch'
	| 'jellyfin'
	| 'warcraft'
	| 'pokemon'
	| 'workflows'

export type DashboardWidgetSize = 'compact' | 'medium' | 'wide'
export type PokemonSpriteSource = 'home' | 'artwork' | 'default' | 'showdown' | 'github'
export type PokemonDashboardMode = 'favorites' | 'recent' | 'tag'

export const monitoredRepositories = [
	'David-H-Afonso/BeastVault.Front',
	'David-H-Afonso/BeastVault.Api',
	'David-H-Afonso/GamesDatabase.Front',
	'David-H-Afonso/GamesDatabase.Api',
	'David-H-Afonso/Jellywatch.Front',
	'David-H-Afonso/Jellywatch.Api',
	'David-H-Afonso/DoIt.Front',
	'David-H-Afonso/DoIt.Api',
	'David-H-Afonso/WarcraftArchive.Front',
	'David-H-Afonso/WarcraftArchive.Api',
	'David-H-Afonso/HouseHold.Front',
	'David-H-Afonso/HouseHold.Api',
] as const

export interface DashboardWidgetPreference {
	id: DashboardWidgetId
	visible: boolean
	order: number
	size: DashboardWidgetSize
}

export interface UserPreferences {
	schemaVersion: 1
	widgets: DashboardWidgetPreference[]
	gameStatusIds: number[]
	visualPreference: 'system' | 'light' | 'dark'
	pokemonSpriteSource: PokemonSpriteSource
	pokemonDashboardMode: PokemonDashboardMode
	pokemonDashboardTagId: number | null
	timezone: string
	jellyfinUserId: string
	repositoryVisibility: Record<string, boolean>
}

export interface ServerUserPreferences {
	schemaVersion: 1
	timeZoneId: string | null
	visualPreference: 'system' | 'light' | 'dark'
	pokemonSpriteSource: PokemonSpriteSource
	gamesStatusOrder: number[]
	hiddenGitHubRepos: string[]
	jellyfinUserId: string | null
	clearJellyfinUserId?: boolean
}

export interface ServerDashboardLayoutItem {
	type: 'apps' | 'games' | 'doit' | 'jellywatch' | 'jellyfin' | 'warcraft' | 'pokemon' | 'github-actions'
	position: number
	visible: boolean
	size: 'small' | 'medium' | 'large'
	settingsJson: string | null
}

export interface ServerDashboardLayout {
	schemaVersion: 1
	widgets: ServerDashboardLayoutItem[]
}

export const dashboardWidgetCatalog: ReadonlyArray<{
	id: DashboardWidgetId
	name: string
	description: string
	defaultSize: DashboardWidgetSize
	allowedSizes: DashboardWidgetSize[]
}> = [
	{ id: 'app-status', name: 'Application status', description: 'Compact service health and account connection LEDs.', defaultSize: 'compact', allowedSizes: ['compact', 'medium', 'wide'] },
	{ id: 'games', name: 'Games', description: 'Games from your selected Games Database statuses.', defaultSize: 'medium', allowedSizes: ['medium', 'wide'] },
	{ id: 'today', name: 'Today', description: 'Relevant DoIt tasks and daily progress.', defaultSize: 'medium', allowedSizes: ['compact', 'medium', 'wide'] },
	{ id: 'jellywatch', name: 'Jellywatch', description: 'Episodes airing in the next seven days.', defaultSize: 'medium', allowedSizes: ['medium', 'wide'] },
	{ id: 'jellyfin', name: 'Jellyfin', description: 'Continue Watching with Next Up as a fallback.', defaultSize: 'medium', allowedSizes: ['medium', 'wide'] },
	{ id: 'warcraft', name: 'Warcraft', description: 'Weekly progress and the first pending actions.', defaultSize: 'medium', allowedSizes: ['compact', 'medium', 'wide'] },
	{ id: 'pokemon', name: 'Pokémon', description: 'Favorites, recent additions, or a selected tag.', defaultSize: 'medium', allowedSizes: ['medium', 'wide'] },
	{ id: 'workflows', name: 'Workflows', description: 'Failed, running, and recently successful builds.', defaultSize: 'medium', allowedSizes: ['compact', 'medium', 'wide'] },
]

export const createDefaultPreferences = (): UserPreferences => ({
	schemaVersion: 1,
	widgets: dashboardWidgetCatalog.map((widget, order) => ({
		id: widget.id,
		visible: !['pokemon', 'workflows'].includes(widget.id),
		order,
		size: widget.defaultSize,
	})),
	gameStatusIds: [],
	visualPreference: 'system',
	pokemonSpriteSource: 'home',
	pokemonDashboardMode: 'favorites',
	pokemonDashboardTagId: null,
	timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
	jellyfinUserId: '',
	repositoryVisibility: {},
})
