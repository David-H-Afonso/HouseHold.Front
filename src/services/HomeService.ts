import { environment } from '@/environments'
import { customFetch } from '@/utils'
import type {
	Room,
	CreateRoomRequest,
	UpdateRoomRequest,
	TaskTemplateDto,
	CreateTaskTemplateRequest,
	UpdateTaskTemplateRequest,
	TaskInstanceDto,
	TodayTasksResponse,
	HomeIssueDto,
	CreateHomeIssueRequest,
	UpdateHomeIssueRequest,
} from '@/models/api/Home'

const { rooms, taskTemplates, tasks, issues } = environment.apiRoutes

class HomeService {
	// ── Rooms ──────────────────────────────────────────────────────────────

	listRooms(): Promise<Room[]> {
		return customFetch<Room[]>(rooms.base)
	}

	getRoom(id: string): Promise<Room> {
		return customFetch<Room>(rooms.byId(id))
	}

	createRoom(request: CreateRoomRequest): Promise<Room> {
		return customFetch<Room>(rooms.base, { method: 'POST', body: request })
	}

	updateRoom(id: string, request: UpdateRoomRequest): Promise<Room> {
		return customFetch<Room>(rooms.byId(id), { method: 'PUT', body: request })
	}

	deleteRoom(id: string): Promise<void> {
		return customFetch<void>(rooms.byId(id), { method: 'DELETE' })
	}

	// ── Task templates ─────────────────────────────────────────────────────

	listTaskTemplates(): Promise<TaskTemplateDto[]> {
		return customFetch<TaskTemplateDto[]>(taskTemplates.base)
	}

	getTaskTemplate(id: string): Promise<TaskTemplateDto> {
		return customFetch<TaskTemplateDto>(taskTemplates.byId(id))
	}

	createTaskTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplateDto> {
		return customFetch<TaskTemplateDto>(taskTemplates.base, { method: 'POST', body: request })
	}

	updateTaskTemplate(id: string, request: UpdateTaskTemplateRequest): Promise<TaskTemplateDto> {
		return customFetch<TaskTemplateDto>(taskTemplates.byId(id), { method: 'PUT', body: request })
	}

	deleteTaskTemplate(id: string): Promise<void> {
		return customFetch<void>(taskTemplates.byId(id), { method: 'DELETE' })
	}

	// ── Task instances ─────────────────────────────────────────────────────

	getTodayTasks(): Promise<TodayTasksResponse> {
		return customFetch<TodayTasksResponse>(tasks.today)
	}

	completeTaskInstance(id: string): Promise<TaskInstanceDto> {
		return customFetch<TaskInstanceDto>(tasks.completeInstance(id), { method: 'POST' })
	}

	// ── Issues ─────────────────────────────────────────────────────────────

	listIssues(): Promise<HomeIssueDto[]> {
		return customFetch<HomeIssueDto[]>(issues.base)
	}

	getIssue(id: string): Promise<HomeIssueDto> {
		return customFetch<HomeIssueDto>(issues.byId(id))
	}

	createIssue(request: CreateHomeIssueRequest): Promise<HomeIssueDto> {
		return customFetch<HomeIssueDto>(issues.base, { method: 'POST', body: request })
	}

	updateIssue(id: string, request: UpdateHomeIssueRequest): Promise<HomeIssueDto> {
		return customFetch<HomeIssueDto>(issues.byId(id), { method: 'PUT', body: request })
	}

	deleteIssue(id: string): Promise<void> {
		return customFetch<void>(issues.byId(id), { method: 'DELETE' })
	}
}

export const homeService = new HomeService()
