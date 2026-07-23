import { environment } from '@/environments'
import type { AppLauncherCategory, AppLauncherItem } from '@/models/api/Apps'
import { customFetch } from '@/utils'

const { apps } = environment.apiRoutes

class AppCatalogService {
	list(): Promise<AppLauncherItem[]> {
		return customFetch<AppLauncherItem[]>(apps.base)
	}

	get(id: string): Promise<AppLauncherItem> {
		return customFetch<AppLauncherItem>(apps.byId(id))
	}

	categories(): Promise<AppLauncherCategory[]> {
		return customFetch<AppLauncherCategory[]>(apps.categories)
	}

	setFavorite(id: string, favorite: boolean): Promise<AppLauncherItem> {
		return customFetch<AppLauncherItem>(apps.favorite(id), {
			method: 'PUT',
			body: { favorite },
		})
	}
}

export const appCatalogService = new AppCatalogService()
