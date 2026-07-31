import { environment } from '@/environments'
import type {
	MediaModuleResponse,
	PokemonModuleResponse,
	PokemonTagOption,
	TodayOccurrenceActionResponse,
	TodayModuleResponse,
	WarcraftWeeklyResponse,
} from '@/models/api/Modules'
import type { CalendarEvent as CalendarEventModel } from '@/models/api/Calendar'
import type { PokemonSpriteSource } from '@/models/api/Preferences'
import { customFetch } from '@/utils/customFetch'

const { today, calendar, media, pokemon, warcraft } = environment.apiRoutes

class ModuleService {
	today(date: string, timeZoneId?: string): Promise<TodayModuleResponse> {
		return customFetch<TodayModuleResponse>(today.base, { params: { date, timeZoneId } })
	}

	calendarEvents(from: string, to: string): Promise<CalendarEventModel[]> {
		return customFetch<CalendarEventModel[]>(calendar.events, { params: { from, to } })
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

	pokemon(params: { search: string; tagIds: number[]; skip: number; take: number; spriteSource?: PokemonSpriteSource; favorite?: boolean }): Promise<PokemonModuleResponse> {
		return customFetch<PokemonModuleResponse>(pokemon.base, {
			params: {
				search: params.search,
				tagIds: params.tagIds.join(','),
				skip: params.skip,
				take: params.take,
				spriteSource: params.spriteSource,
				favorite: params.favorite,
			},
		})
	}

	pokemonTags(): Promise<PokemonTagOption[]> {
		return customFetch<PokemonTagOption[]>(pokemon.tags)
	}

	downloadPokemon(id: number): Promise<{ blob: Blob; fileName: string | null }> {
		let fileName: string | null = null
		return customFetch<Blob>(pokemon.download(id), {
			onResponse: (response) => {
				const disposition = response.headers.get('content-disposition')
				const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
				const plain = disposition?.match(/filename="?([^";]+)"?/i)?.[1]
				fileName = encoded ? decodeURIComponent(encoded) : plain ?? null
			},
		}).then((blob) => ({ blob, fileName }))
	}
}

export const moduleService = new ModuleService()
