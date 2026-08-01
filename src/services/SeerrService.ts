import { environment } from '@/environments'
import type {
	CreateSeerrRequestBody,
	SeerrConfig,
	SeerrDetail,
	SeerrDiscoverKind,
	SeerrMediaType,
	SeerrRequest,
	SeerrRequestAction,
	SeerrRequestFilter,
	SeerrRequestList,
	SeerrSearchResponse,
	SeerrSession,
	SeerrUserMapping,
	UpdateSeerrConfigRequest,
	UpdateSeerrUserMappingRequest,
} from '@/models/api/Seerr'
import { customFetch } from '@/utils/customFetch'

const { seerr } = environment.apiRoutes

export class SeerrService {
	session(signal?: AbortSignal): Promise<SeerrSession> {
		return customFetch<SeerrSession>(seerr.session, { signal })
	}

	search(query: string, page = 1, signal?: AbortSignal): Promise<SeerrSearchResponse> {
		return customFetch<SeerrSearchResponse>(seerr.search, { params: { query, page }, signal })
	}

	discover(kind: SeerrDiscoverKind, page = 1, signal?: AbortSignal): Promise<SeerrSearchResponse> {
		return customFetch<SeerrSearchResponse>(seerr.discover, { params: { kind, page }, signal })
	}

	detail(mediaType: SeerrMediaType, tmdbId: number, signal?: AbortSignal): Promise<SeerrDetail> {
		return customFetch<SeerrDetail>(mediaType === 'movie' ? seerr.movie(tmdbId) : seerr.tv(tmdbId), { signal })
	}

	requests(filter: SeerrRequestFilter, mine: boolean, page = 1, signal?: AbortSignal): Promise<SeerrRequestList> {
		return customFetch<SeerrRequestList>(seerr.requests, { params: { filter, mine, page }, signal })
	}

	createRequest(body: CreateSeerrRequestBody): Promise<SeerrRequest> {
		return customFetch<SeerrRequest>(seerr.requests, { method: 'POST', body })
	}

	moderateRequest(id: number, action: SeerrRequestAction): Promise<void> {
		return customFetch<void>(seerr.requestAction(id, action), { method: 'POST' })
	}

	deleteRequest(id: number): Promise<void> {
		return customFetch<void>(seerr.request(id), { method: 'DELETE' })
	}

	config(signal?: AbortSignal): Promise<SeerrConfig> {
		return customFetch<SeerrConfig>(seerr.config, { signal })
	}

	updateConfig(body: UpdateSeerrConfigRequest): Promise<SeerrConfig> {
		return customFetch<SeerrConfig>(seerr.config, { method: 'PUT', body })
	}

	mappings(signal?: AbortSignal): Promise<SeerrUserMapping[]> {
		return customFetch<SeerrUserMapping[]>(seerr.mappings, { signal })
	}

	updateMapping(householdUserId: string, body: UpdateSeerrUserMappingRequest): Promise<SeerrUserMapping> {
		return customFetch<SeerrUserMapping>(seerr.mapping(householdUserId), { method: 'PUT', body })
	}

	clearMapping(householdUserId: string): Promise<void> {
		return customFetch<void>(seerr.mapping(householdUserId), { method: 'DELETE' })
	}
}

export const seerrService = new SeerrService()
