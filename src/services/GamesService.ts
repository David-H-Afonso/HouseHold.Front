import { environment } from '@/environments'
import type {
	GameModuleItem,
	GamesModuleList,
	GameStatusOption,
	GamesSummary,
	SteamSearchResult,
} from '@/models/api/Games'
import { customFetch } from '@/utils'

const { games } = environment.apiRoutes

class GamesService {
	list(params: { search?: string; statusId?: number; page?: number; pageSize?: number }): Promise<GamesModuleList> {
		return customFetch<GamesModuleList>(games.base, { params })
	}

	get(id: number): Promise<GameModuleItem> {
		return customFetch<GameModuleItem>(games.byId(id))
	}

	statuses(): Promise<GameStatusOption[]> {
		return customFetch<GameStatusOption[]>(games.statuses)
	}

	summary(): Promise<GamesSummary> {
		return customFetch<GamesSummary>(games.summary)
	}

	updateStatus(id: number, statusId: number): Promise<GameModuleItem> {
		return customFetch<GameModuleItem>(games.status(id), { method: 'PATCH', body: { statusId } })
	}

	searchSteam(q: string): Promise<SteamSearchResult[]> {
		return customFetch<SteamSearchResult[]>(games.steamSearch, { params: { q } })
	}

	addSteamGame(result: SteamSearchResult): Promise<unknown> {
		return customFetch(games.steamAdd, {
			method: 'POST',
			body: { appId: result.appId, logoUrl: result.logoUrl, coverUrl: result.coverUrl },
		})
	}
}

export const gamesService = new GamesService()
