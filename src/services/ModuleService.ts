import { environment } from '@/environments'
import type {
	MediaModuleResponse,
	PokemonModuleResponse,
	PokemonTagOption,
	TodayOccurrenceActionResponse,
	TodayModuleResponse,
	WarcraftWeeklyResponse,
} from '@/models/api/Modules'
import { customFetch } from '@/utils/customFetch'

const { today, media, pokemon, warcraft } = environment.apiRoutes

class ModuleService {
	today(date: string, timeZoneId?: string): Promise<TodayModuleResponse> {
		return customFetch<TodayModuleResponse>(today.base, { params: { date, timeZoneId } })
	}

	completeTodayOccurrence(occurrenceId: string, date?: string, timeZoneId?: string): Promise<TodayOccurrenceActionResponse> {
		return customFetch<TodayOccurrenceActionResponse>(today.complete(occurrenceId), { method: 'POST', params: { date, timeZoneId } })
	}

	undoTodayOccurrence(occurrenceId: string, date?: string, timeZoneId?: string): Promise<TodayOccurrenceActionResponse> {
		return customFetch<TodayOccurrenceActionResponse>(today.undo(occurrenceId), { method: 'POST', params: { date, timeZoneId } })
	}

	media(): Promise<MediaModuleResponse> {
		return customFetch<MediaModuleResponse>(media.jellywatch)
	}

	warcraft(): Promise<WarcraftWeeklyResponse> {
		return customFetch<WarcraftWeeklyResponse>(warcraft.weekly)
	}

	updateWarcraftStatus(id: number | string, status: string) {
		return customFetch<WarcraftWeeklyResponse['items'][number]>(warcraft.status(id), { method: 'PATCH', body: { status } })
	}

	pokemon(params: { search: string; tagIds: number[]; skip: number; take: number; spriteSource?: string }): Promise<PokemonModuleResponse> {
		return customFetch<PokemonModuleResponse>(pokemon.base, {
			params: {
				search: params.search,
				tagIds: params.tagIds.join(','),
				skip: params.skip,
				take: params.take,
				spriteSource: params.spriteSource,
			},
		})
	}

	pokemonTags(): Promise<PokemonTagOption[]> {
		return customFetch<PokemonTagOption[]>(pokemon.tags)
	}

	downloadPokemon(id: number): Promise<Blob> {
		return customFetch<Blob>(pokemon.download(id))
	}
}

export const moduleService = new ModuleService()
