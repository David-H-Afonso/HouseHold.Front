export interface CalendarReminder {
	id: string
	offsetMinutes: number
	isEnabled: boolean
	acknowledgedAt: string | null
	dueAtUtc: string
}

export interface CalendarEvent {
	id: string
	title: string
	description: string | null
	zoneId: string | null
	zoneName: string | null
	startAtUtc: string
	endAtUtc: string
	isAllDay: boolean
	timeZoneId: string
	isCancelled: boolean
	createdAt: string
	updatedAt: string
	reminders: CalendarReminder[]
}
