import { environment } from '@/environments'
import type {
	DashboardWidgetId,
	DashboardWidgetPreference,
	ServerDashboardLayout,
	ServerDashboardLayoutItem,
	ServerUserPreferences,
	UserPreferences,
} from '@/models/api/Preferences'
import { createDefaultPreferences, dashboardWidgetCatalog } from '@/models/api/Preferences'
import { customFetch } from '@/utils/customFetch'

export type PreferencePersistence = 'server' | 'device'

const storageKey = (userId: string) => `household:preferences:${userId}`
const frontendToServerWidget: Record<DashboardWidgetId, ServerDashboardLayoutItem['type']> = {
	'app-status': 'apps', games: 'games', today: 'doit', jellywatch: 'jellywatch', jellyfin: 'jellyfin',
	warcraft: 'warcraft', pokemon: 'pokemon', workflows: 'github-actions',
}
const serverToFrontendWidget = Object.fromEntries(
	Object.entries(frontendToServerWidget).map(([frontend, server]) => [server, frontend])
) as Record<ServerDashboardLayoutItem['type'], DashboardWidgetId>

const normalize = (value: Partial<UserPreferences> | null | undefined): UserPreferences => {
	const defaults = createDefaultPreferences()
	const suppliedWidgets = Array.isArray(value?.widgets) ? value.widgets : []
	const widgetMap = new Map(suppliedWidgets.map((widget) => [widget.id, widget]))
	const widgets: DashboardWidgetPreference[] = dashboardWidgetCatalog.map((entry, order) => {
		const stored = widgetMap.get(entry.id)
		const storedSize = stored?.size
		return {
			id: entry.id,
			visible: typeof stored?.visible === 'boolean' ? stored.visible : defaults.widgets[order].visible,
			order: typeof stored?.order === 'number' ? stored.order : order,
			size: storedSize && entry.allowedSizes.includes(storedSize) ? storedSize : entry.defaultSize,
		}
	})
	return {
		...defaults,
		...value,
		schemaVersion: 1,
		widgets,
		gameStatusIds: Array.isArray(value?.gameStatusIds) ? value.gameStatusIds.filter((id) => Number.isInteger(id) && id > 0) : [],
		repositoryVisibility: value?.repositoryVisibility && typeof value.repositoryVisibility === 'object' ? value.repositoryVisibility : {},
	}
}

const readDevice = (userId: string) => {
	try {
		const value = localStorage.getItem(storageKey(userId))
		return value ? normalize(JSON.parse(value)) : createDefaultPreferences()
	} catch { return createDefaultPreferences() }
}

const writeDevice = (userId: string, preferences: UserPreferences) => {
	try { localStorage.setItem(storageKey(userId), JSON.stringify(preferences)) }
	catch { /* In-memory state remains usable. */ }
}

const fromServer = (preferences: ServerUserPreferences, layout: ServerDashboardLayout): UserPreferences => normalize({
	schemaVersion: 1,
	timezone: preferences.timeZoneId,
	visualPreference: preferences.visualPreference,
	pokemonSpriteSource: preferences.pokemonSpriteSource,
	gameStatusIds: preferences.gamesStatusOrder,
	jellyfinUserId: preferences.jellyfinUserId ?? '',
	repositoryVisibility: Object.fromEntries(preferences.hiddenGitHubRepos.map((repository) => [repository, false])),
	widgets: layout.widgets.map((widget) => ({
			id: serverToFrontendWidget[widget.type],
			order: widget.position,
			visible: widget.visible,
			size: widget.size === 'small' ? 'compact' : widget.size === 'medium' ? 'medium' : 'wide',
	})),
	pokemonDashboardMode: (() => {
		const widget = layout.widgets.find((item) => item.type === 'pokemon')
		try { return widget?.settingsJson ? JSON.parse(widget.settingsJson).dashboardMode : undefined }
		catch { return undefined }
	})(),
	pokemonDashboardTagId: (() => {
		const widget = layout.widgets.find((item) => item.type === 'pokemon')
		try { return widget?.settingsJson ? JSON.parse(widget.settingsJson).dashboardTagId : undefined }
		catch { return undefined }
	})(),
})

const toServerPreferences = (preferences: UserPreferences): ServerUserPreferences => ({
	schemaVersion: 1,
	timeZoneId: preferences.timezone,
	visualPreference: preferences.visualPreference,
	pokemonSpriteSource: preferences.pokemonSpriteSource,
	gamesStatusOrder: preferences.gameStatusIds,
	hiddenGitHubRepos: Object.entries(preferences.repositoryVisibility)
		.filter(([, visible]) => visible === false)
		.map(([repository]) => repository),
	jellyfinUserId: preferences.jellyfinUserId || null,
	clearJellyfinUserId: !preferences.jellyfinUserId,
})

const toServerLayout = (preferences: UserPreferences): ServerDashboardLayout => ({
	schemaVersion: 1,
	widgets: [...preferences.widgets]
		.sort((left, right) => left.order - right.order)
		.map((widget, position) => ({
			type: frontendToServerWidget[widget.id],
			position,
			visible: widget.visible,
			size: widget.size === 'compact' ? 'small' : widget.size === 'medium' ? 'medium' : 'large',
			settingsJson: widget.id === 'pokemon'
				? JSON.stringify({ dashboardMode: preferences.pokemonDashboardMode, dashboardTagId: preferences.pokemonDashboardTagId })
				: null,
		})),
})

class PreferencesService {
	async load(userId: string): Promise<{ preferences: UserPreferences; persistence: PreferencePersistence }> {
		try {
			const [preferences, layout] = await Promise.all([
				customFetch<ServerUserPreferences>(environment.apiRoutes.settings.preferences),
				customFetch<ServerDashboardLayout>(environment.apiRoutes.settings.dashboardLayout),
			])
			const result = fromServer(preferences, layout)
			writeDevice(userId, result)
			return { preferences: result, persistence: 'server' }
		} catch { return { preferences: readDevice(userId), persistence: 'device' } }
	}

	async save(userId: string, preferences: UserPreferences): Promise<PreferencePersistence> {
		const normalized = normalize(preferences)
		writeDevice(userId, normalized)
		try {
			await Promise.all([
				customFetch(environment.apiRoutes.settings.preferences, { method: 'PATCH', body: toServerPreferences(normalized) }),
				customFetch(environment.apiRoutes.settings.dashboardLayout, { method: 'PATCH', body: toServerLayout(normalized) }),
			])
			return 'server'
		} catch { return 'device' }
	}

	async reset(userId: string): Promise<{ preferences: UserPreferences; persistence: PreferencePersistence }> {
		try {
			await customFetch(environment.apiRoutes.settings.resetDashboardLayout, { method: 'POST' })
			return await this.load(userId)
		} catch {
			const preferences = createDefaultPreferences()
			writeDevice(userId, preferences)
			return { preferences, persistence: 'device' }
		}
	}
}

export const preferencesService = new PreferencesService()
