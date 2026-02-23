// ── Enums ──────────────────────────────────────────────────────────────────

export const ScheduleType = {
	Daily: 'Daily',
	Weekly: 'Weekly',
	Monthly: 'Monthly',
	IntervalDays: 'IntervalDays',
} as const
export type ScheduleType = (typeof ScheduleType)[keyof typeof ScheduleType]

export const TimeOfDaySlot = {
	Morning: 'Morning',
	Evening: 'Evening',
	Anytime: 'Anytime',
} as const
export type TimeOfDaySlot = (typeof TimeOfDaySlot)[keyof typeof TimeOfDaySlot]

export const TaskStatus = {
	Pending: 'Pending',
	Done: 'Done',
	Skipped: 'Skipped',
} as const
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]

export const IssueStatus = {
	Open: 'Open',
	InProgress: 'InProgress',
	Done: 'Done',
	WontFix: 'WontFix',
} as const
export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus]

export const IssuePriority = {
	Low: 'Low',
	Medium: 'Medium',
	High: 'High',
	Critical: 'Critical',
} as const
export type IssuePriority = (typeof IssuePriority)[keyof typeof IssuePriority]

// ── Room ──────────────────────────────────────────────────────────────────

export interface Room {
	id: string
	name: string
	icon?: string
	sortOrder: number
	createdAt: string
	updatedAt: string
}

export interface CreateRoomRequest {
	name: string
	icon?: string
	sortOrder?: number
}

export type UpdateRoomRequest = CreateRoomRequest

// ── Task template ─────────────────────────────────────────────────────────

export interface TaskTemplateDto {
	id: string
	title: string
	roomId?: string
	roomName?: string
	description?: string
	assignedToUserId?: string
	assignedToUserName?: string
	scheduleType: ScheduleType
	timeOfDaySlot: TimeOfDaySlot
	daysOfWeekMask?: number
	dayOfMonth?: number
	intervalDays?: number
	startDate: string
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export interface CreateTaskTemplateRequest {
	title: string
	roomId?: string
	description?: string
	assignedToUserId?: string
	scheduleType: ScheduleType
	timeOfDaySlot: TimeOfDaySlot
	daysOfWeekMask?: number
	dayOfMonth?: number
	intervalDays?: number
	startDate?: string
}

export type UpdateTaskTemplateRequest = CreateTaskTemplateRequest

// ── Task instance ─────────────────────────────────────────────────────────

export interface TaskInstanceDto {
	id: string
	taskTemplateId: string
	templateTitle: string
	roomName?: string
	assignedToUserName?: string
	dueDate: string
	timeOfDaySlot: TimeOfDaySlot
	status: TaskStatus
	completedAt?: string
	completedByUserId?: string
	createdAt: string
	updatedAt: string
}

export interface TodayTasksResponse {
	date: string
	morning: TaskInstanceDto[]
	evening: TaskInstanceDto[]
	anytime: TaskInstanceDto[]
	overdue: TaskInstanceDto[]
}

// ── Home issue ────────────────────────────────────────────────────────────

export interface HomeIssueDto {
	id: string
	title: string
	roomId?: string
	roomName?: string
	description?: string
	status: IssueStatus
	priority: IssuePriority
	createdByUserId: string
	createdByUserName: string
	resolvedAt?: string
	createdAt: string
	updatedAt: string
}

export interface CreateHomeIssueRequest {
	title: string
	roomId?: string
	description?: string
	status?: IssueStatus
	priority?: IssuePriority
}

export interface UpdateHomeIssueRequest {
	title: string
	roomId?: string
	description?: string
	status: IssueStatus
	priority: IssuePriority
}
