export interface GameModuleItem {
	id: number
	name: string
	statusId: number
	statusName?: string | null
	platformName?: string | null
	logo?: string | null
	cover?: string | null
	hero?: string | null
	grade?: number | null
	score?: number | null
	started?: string | null
	finished?: string | null
	steamAppId?: number | null
	steamPlaytimeForever?: number | null
	openUrl?: string | null
	released?: string | null
	comment?: string | null
	critic?: number | null
	criticProvider?: string | null
	story?: number | null
	completion?: number | null
	playedStatusName?: string | null
	playWithNames?: string[]
	favorite?: boolean
	addedAt?: string | null
	updatedAt?: string | null
}

export interface GamesModuleList {
	items: GameModuleItem[]
	totalCount: number
	page: number
	pageSize: number
	totalPages: number
}

export interface GameStatusOption {
	id: number
	name: string
	color: string
	statusType: string
}

export interface GamesSummary {
	totalCount: number
	statuses: GameStatusOption[]
	countsByStatus: Record<string, number>
}
