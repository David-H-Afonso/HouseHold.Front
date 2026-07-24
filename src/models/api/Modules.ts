export interface TodayProgress {
	total: number
	done: number
	missed: number
	notApplicable: number
	pending: number
}

export interface TodayTask {
	occurrenceId: string
	id: string
	title: string
	zoneName: string | null
	scope: string
	state: string
	occurrenceStatus: string
	occurrenceDate: string
	availableFromTime: string | null
	availableUntilTime: string | null
	recommendedTime: string | null
	assignmentMode: string
	assigneeIds: string[]
	assigneeNames: string[]
	timeZoneId: string
	recurrenceType: string
	completedAt?: string | null
	completedByUserId?: string | null
}

export interface TodayModuleResponse {
	date: string
	scope: string
	progress: TodayProgress
	tasks: TodayTask[]
}

export interface TodayOccurrenceActionResponse {
	occurrenceId: string
	taskId: string
	occurrenceDate: string
	occurrenceStatus: string
}

export interface MediaProfile {
	displayName: string
	totalSeriesWatching: number
	totalSeriesCompleted: number
	totalMoviesSeen: number
	totalEpisodesSeen: number
}

export interface MediaActivity {
	eventId: number | string
	title: string
	mediaType: string
	episodeName: string | null
	seasonNumber: number | null
	episodeNumber: number | null
	eventType: string | number
	timestamp: string
	userRating: number | null
	tmdbRating: number | null
	posterUrl: string | null
	openUrl: string | null
}

export interface UpcomingMedia {
	mediaItemId: number | string
	seriesId: number | string
	seriesTitle: string
	seasonNumber: number
	episodeNumber: number
	episodeName: string | null
	airDate: string
	airTime: string | null
	airTimeUtc: string | null
	batchCount: number
	posterUrl: string | null
	openUrl: string | null
}

export interface MediaModuleResponse {
	profile: MediaProfile
	activity: MediaActivity[]
	upcoming: UpcomingMedia[]
}

export interface WarcraftWeeklySummary {
	total: number
	notStarted: number
	pending: number
	inProgress: number
	lastDay: number
	lastWeek: number
	finished: number
	remaining: number
	completionPercent: number
}

export interface WarcraftWeeklyItem {
	id: number | string
	characterName: string
	characterClass: string
	contentName: string
	expansion: string
	difficulty: string
	status: string
	lastCompletedAt: string | null
	updatedAt: string
	period?: string | null
}

export interface WarcraftWeeklyResponse {
	generatedAtUtc: string
	summary: WarcraftWeeklySummary
	items: WarcraftWeeklyItem[]
}

export interface PokemonTag {
	id: number
	name: string
	colorHex: string | null
	imageUrl: string | null
}

export interface PokemonModuleItem {
	id: number
	speciesId: number
	speciesName: string
	nickname: string | null
	level: number
	isShiny: boolean
	favorite: boolean
	isEgg: boolean
	type1: string | null
	type2: string | null
	spriteUrl: string | null
	fallbackSpriteUrl: string | null
	tags: PokemonTag[]
	openUrl: string | null
}

export interface PokemonModuleResponse {
	items: PokemonModuleItem[]
	total: number
	skip: number
	take: number
}

export interface PokemonTagOption extends PokemonTag {
	pokemonCount: number
	category: string | null
}
