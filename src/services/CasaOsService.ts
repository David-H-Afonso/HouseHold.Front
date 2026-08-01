import { environment } from '@/environments'
import type { CasaOsConfig, UpdateCasaOsConfigRequest } from '@/models/api/Apps'
import { customFetch } from '@/utils/customFetch'

class CasaOsService {
	config(): Promise<CasaOsConfig> {
		return customFetch<CasaOsConfig>(environment.apiRoutes.casaos.config)
	}

	updateConfig(request: UpdateCasaOsConfigRequest): Promise<CasaOsConfig> {
		return customFetch<CasaOsConfig>(environment.apiRoutes.casaos.config, {
			method: 'PUT',
			body: request,
		})
	}
}

export const casaOsService = new CasaOsService()
