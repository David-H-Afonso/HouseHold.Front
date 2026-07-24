import { environment } from '@/environments'
import type {
	HouseholdAuthorizationResponse,
	HouseholdConnection,
	HouseholdProviderId,
	Integration,
	IntegrationHealth,
	UpsertIntegrationRequest,
} from '@/models/api/Integrations'
import { customFetch } from '@/utils/customFetch'

const { integrations } = environment.apiRoutes

class IntegrationService {
	list(): Promise<Integration[]> {
		return customFetch<Integration[]>(integrations.base)
	}

	create(request: UpsertIntegrationRequest): Promise<Integration> {
		return customFetch<Integration>(integrations.base, { method: 'POST', body: request })
	}

	update(id: string, request: UpsertIntegrationRequest): Promise<Integration> {
		return customFetch<Integration>(integrations.byId(id), { method: 'PUT', body: request })
	}

	delete(id: string): Promise<void> {
		return customFetch<void>(integrations.byId(id), { method: 'DELETE' })
	}

	health(id: string): Promise<IntegrationHealth> {
		return customFetch<IntegrationHealth>(integrations.healthById(id))
	}

	allHealth(): Promise<IntegrationHealth[]> {
		return customFetch<IntegrationHealth[]>(integrations.health)
	}

	connections(): Promise<HouseholdConnection[]> {
		return customFetch<HouseholdConnection[]>(integrations.connections)
	}

	authorizeConnection(provider: HouseholdProviderId): Promise<HouseholdAuthorizationResponse> {
		return customFetch<HouseholdAuthorizationResponse>(integrations.authorizeConnection(provider), { method: 'POST' })
	}

	testConnection(provider: HouseholdProviderId): Promise<HouseholdConnection> {
		return customFetch<HouseholdConnection>(integrations.testConnection(provider), { method: 'POST' })
	}

	disconnect(provider: HouseholdProviderId): Promise<void> {
		return customFetch<void>(integrations.connection(provider), { method: 'DELETE' })
	}
}

export const integrationService = new IntegrationService()
