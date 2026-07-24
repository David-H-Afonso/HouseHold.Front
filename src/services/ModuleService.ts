import { environment } from '@/environments'
import type {
	MediaModuleResponse,
	PokemonModuleResponse,
	PokemonTagOption,
	TodayOccurrenceActionResponse,
	TodayModuleResponse,
	WarcraftWeeklyResponse,
} from '@/models/api/Modules'
import { customFetch } from '@/utils'

const { today, media, pokemon, warcraft } = environment.apiRoutes

class ModuleService {
	today(date: string): Promise<TodayModuleResponse> {
		return customFetch<TodayModuleResponse>(today.base, { params: { date } })
	}

	completeTodayOccurrence(occurrenceId: string): Promise<TodayOccurrenceActionResponse> {
		return customFetch<TodayOccurrenceActionResponse>(today.complete(occurrenceId), { method: 'POST' })
	}

	undoTodayOccurrence(occurrenceId: string): Promise<TodayOccurrenceActionResponse> {
		return customFetch<TodayOccurrenceActionResponse>(today.undo(occurrenceId), { method: 'POST' })
	}

	media(): Promise<MediaModuleResponse> {
		return customFetch<MediaModuleResponse>(media.jellywatch)
	}

	warcraft(): Promise<WarcraftWeeklyResponse> {
		return customFetch<WarcraftWeeklyResponse>(warcraft.weekly)
	}

	pokemon(params: { search: string; tagIds: number[]; skip: number; take: number }): Promise<PokemonModuleResponse> {
		return customFetch<PokemonModuleResponse>(pokemon.base, {
			params: {
				search: params.search,
				tagIds: params.tagIds.join(','),
				skip: params.skip,
				take: params.take,
			},
		})
	}

	pokemonTags(): Promise<PokemonTagOption[]> {
		return customFetch<PokemonTagOption[]>(pokemon.tags)
	}
}

export const moduleService = new ModuleService()
