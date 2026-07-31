import { useEffect, useMemo, useState } from 'react'
import { ExternalProviderLink, ModuleState } from '@/components/Shared'
import { useUserPreferences } from '@/contexts/useUserPreferences'
import type { CalendarEvent } from '@/models/api/Calendar'
import { moduleService } from '@/services'
import './CalendarPage.scss'

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const monthBounds = (date: Date) => ({
	from: new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1)).toISOString(),
	to: new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)).toISOString(),
})
const shiftMonth = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, 1)

const eventDay = (event: CalendarEvent, timeZone: string) => new Intl.DateTimeFormat('en-CA', {
	timeZone,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
}).format(new Date(event.startAtUtc))

const formatEventTime = (event: CalendarEvent, timeZone: string) => event.isAllDay
	? 'All day'
	: new Intl.DateTimeFormat(undefined, { timeStyle: 'short', timeZone }).format(new Date(event.startAtUtc))

const buildDays = (month: Date) => {
	const first = new Date(month.getFullYear(), month.getMonth(), 1)
	const mondayOffset = (first.getDay() + 6) % 7
	return Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - mondayOffset + 1))
}

export const CalendarPage = () => {
	const { preferences } = useUserPreferences()
	const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
	const [events, setEvents] = useState<CalendarEvent[]>([])
	const [loading, setLoading] = useState(true)
	const [failed, setFailed] = useState(false)
	const bounds = monthBounds(month)

	useEffect(() => {
		let active = true
		setLoading(true)
		setFailed(false)
		moduleService.calendarEvents(bounds.from, bounds.to)
			.then((result) => { if (active) setEvents(result) })
			.catch(() => { if (active) setFailed(true) })
			.finally(() => { if (active) setLoading(false) })
		return () => { active = false }
	}, [bounds.from, bounds.to])

	const days = useMemo(() => buildDays(month), [month])
	const eventsByDay = useMemo(() => {
		const grouped = new Map<string, CalendarEvent[]>()
		for (const event of events) {
			const key = eventDay(event, preferences.timezone)
			grouped.set(key, [...(grouped.get(key) ?? []), event])
		}
		return grouped
	}, [events, preferences.timezone])
	const title = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(month)
	const currentMonth = monthKey(new Date())

	return <div className='calendar-page page-stack'>
		<header className='calendar-page__header'>
			<div><ExternalProviderLink provider='doit'>DoIt</ExternalProviderLink><h1>Calendar</h1><p>Events and reminders connected to your DoIt account.</p></div>
			<div className='calendar-page__controls'>
				<button type='button' onClick={() => setMonth((current) => shiftMonth(current, -1))} aria-label='Previous month'>‹</button>
				<strong>{title}</strong>
				<button type='button' onClick={() => setMonth((current) => shiftMonth(current, 1))} aria-label='Next month'>›</button>
				<button type='button' onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} disabled={monthKey(month) === currentMonth}>Today</button>
			</div>
		</header>

		{failed && <ModuleState kind='error' title='DoIt calendar is not available'>Reconnect DoIt with calendar permission to see your events.</ModuleState>}
		{loading && !events.length && <ModuleState kind='loading' title='Loading calendar'>Reading events from DoIt.</ModuleState>}
		{!failed && <section className='calendar-grid' aria-label={`${title} calendar`} aria-busy={loading}>
			{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((weekday) => <span className='calendar-grid__weekday' key={weekday}>{weekday}</span>)}
			{days.map((day) => {
				const key = dayKey(day)
				const dayEvents = eventsByDay.get(key) ?? []
				const outside = day.getMonth() !== month.getMonth()
				return <article className={`calendar-day${outside ? ' is-outside' : ''}${key === dayKey(new Date()) ? ' is-today' : ''}`} key={key}>
					<header><time dateTime={key}>{day.getDate()}</time>{dayEvents.length > 0 && <span>{dayEvents.length}</span>}</header>
					<div>{dayEvents.slice(0, 4).map((event) => <div className={`calendar-event${event.isCancelled ? ' is-cancelled' : ''}`} key={event.id} title={event.description ?? event.title}><strong>{event.title}</strong><small>{formatEventTime(event, preferences.timezone)}</small></div>)}{dayEvents.length > 4 && <small className='calendar-day__more'>+{dayEvents.length - 4} more</small>}</div>
				</article>
			})}
		</section>}
		{!loading && !failed && events.length === 0 && <p className='calendar-page__empty'>No events are scheduled for this month.</p>}
	</div>
}
