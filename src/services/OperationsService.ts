import { environment } from '@/environments'
import type {
	GitHubActionsConfig,
	InviteUserRequest,
	JellyfinConfig,
	JellyfinModuleResponse,
	UpdateJellyfinConfigRequest,
	UpdateUserRequest,
	UserInvitation,
	WorkflowsResponse,
} from '@/models/api/Operations'
import type { UserDto } from '@/models/api/Auth'
import { customFetch } from '@/utils/customFetch'

class OperationsService {
	jellyfin(): Promise<JellyfinModuleResponse> {
		return customFetch<JellyfinModuleResponse>(environment.apiRoutes.jellyfin.base)
	}

	jellyfinConfig(): Promise<JellyfinConfig> {
		return customFetch<JellyfinConfig>(environment.apiRoutes.jellyfin.config)
	}

	updateJellyfinConfig(request: UpdateJellyfinConfigRequest): Promise<JellyfinConfig> {
		return customFetch<JellyfinConfig>(environment.apiRoutes.jellyfin.config, { method: 'PUT', body: request })
	}

	workflows(): Promise<WorkflowsResponse> {
		return customFetch<WorkflowsResponse>(environment.apiRoutes.workflows.base)
	}

	githubConfig(): Promise<GitHubActionsConfig> {
		return customFetch<GitHubActionsConfig>(environment.apiRoutes.workflows.config)
	}

	updateGitHubConfig(token: string): Promise<GitHubActionsConfig> {
		return customFetch<GitHubActionsConfig>(environment.apiRoutes.workflows.config, { method: 'PUT', body: { token } })
	}

	users(): Promise<UserDto[]> {
		return customFetch<UserDto[]>(environment.apiRoutes.admin.users)
	}

	updateUser(id: string, request: UpdateUserRequest): Promise<UserDto> {
		return customFetch<UserDto>(environment.apiRoutes.admin.user(id), { method: 'PATCH', body: request })
	}

	resetPassword(id: string): Promise<{ temporaryPassword?: string | null }> {
		return customFetch(environment.apiRoutes.admin.resetPassword(id), { method: 'POST' })
	}

	createInvitation(request: InviteUserRequest): Promise<UserInvitation> {
		return customFetch<UserInvitation>(environment.apiRoutes.admin.invitations, { method: 'POST', body: request })
	}
}

export const operationsService = new OperationsService()
