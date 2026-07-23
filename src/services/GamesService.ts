import { environment } from '@/environments'
import type {
	GameModuleItem,
	GamesModuleList,
	GameStatusOption,
	GamesSummary,
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

}

export const gamesService = new GamesService()
