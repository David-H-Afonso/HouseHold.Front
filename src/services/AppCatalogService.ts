import { environment } from '@/environments'
import type {
	AppLauncherCategory,
	AppLauncherItem,
	AppOperation,
	AdminAppCatalogItem,
	RollbackAppRequest,
	UpdateAppCatalogItemRequest,
	UpdateAppRequest,
} from '@/models/api/Apps'
import { customFetch } from '@/utils/customFetch'

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

	update(id: string, request: UpdateAppRequest): Promise<void> {
		return customFetch<void>(apps.update(id), { method: 'POST', body: request })
	}

	rollback(id: string, request: RollbackAppRequest): Promise<void> {
		return customFetch<void>(apps.rollback(id), { method: 'POST', body: request })
	}

	operations(id: string): Promise<AppOperation[]> {
		return customFetch<AppOperation[]>(apps.operations(id))
	}

	adminCatalog(): Promise<AdminAppCatalogItem[]> {
		return customFetch<AdminAppCatalogItem[]>(apps.adminCatalog)
	}

	updateCatalogItem(id: string, request: UpdateAppCatalogItemRequest): Promise<AdminAppCatalogItem> {
		return customFetch<AdminAppCatalogItem>(apps.adminCatalogItem(id), {
			method: 'PATCH',
			body: request,
		})
	}
}

export const appCatalogService = new AppCatalogService()
