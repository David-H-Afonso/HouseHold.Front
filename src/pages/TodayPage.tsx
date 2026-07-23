import { useEffect, useMemo, useState } from 'react'
import { ModuleState } from '@/components/Shared'
import type { TodayModuleResponse, TodayTask } from '@/models/api/Modules'
import { moduleService } from '@/services'
import './TodayPage.scss'

const toLocalDateValue = (date: Date) => {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const shiftDate = (value: string, days: number) => {
	const date = new Date(`${value}T12:00:00`)
	date.setDate(date.getDate() + days)
	return toLocalDateValue(date)
}

const normalize = (value: string) => value.replace(/[\s_-]/g, '').toLowerCase()

const sectionFor = (task: TodayTask) => {
	const status = normalize(task.occurrenceStatus)
	if (status !== 'pending') return status
	return normalize(task.state) || 'pending'
}

const sectionLabels: Record<string, string> = {
	available: 'Available now',
	overdue: 'Overdue',
	pending: 'Pending',
	unavailable: 'Later today',
	upcoming: 'Upcoming',
	done: 'Done',
	completed: 'Done',
	missed: 'Missed',
	notapplicable: 'Not applicable',
}

const sectionOrder = ['available', 'overdue', 'pending', 'unavailable', 'upcoming', 'done', 'completed', 'missed', 'notapplicable']

const shortTime = (value: string | null) => value?.slice(0, 5) ?? null

const taskTime = (task: TodayTask) => {
	if (task.recommendedTime) return `Recommended ${shortTime(task.recommendedTime)}`
	if (task.availableFromTime && task.availableUntilTime) {
		return `Available ${shortTime(task.availableFromTime)}-${shortTime(task.availableUntilTime)}`
	}
	if (task.availableFromTime) return `Available from ${shortTime(task.availableFromTime)}`
	if (task.availableUntilTime) return `Available until ${shortTime(task.availableUntilTime)}`
	return 'Any time'
}

export const TodayPage = () => {
	const [date, setDate] = useState(() => toLocalDateValue(new Date()))
	const [data, setData] = useState<TodayModuleResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [failed, setFailed] = useState(false)

	useEffect(() => {
		let active = true
		setLoading(true)
		setFailed(false)
		moduleService
			.today(date)
			.then((response) => {
				if (active) setData(response)
			})
			.catch(() => {
				if (active) setFailed(true)
			})
			.finally(() => {
				if (active) setLoading(false)
			})
		return () => {
			active = false
		}
	}, [date])

	const sections = useMemo(() => {
		const grouped = new Map<string, TodayTask[]>()
		for (const task of data?.tasks ?? []) {
			const key = sectionFor(task)
			grouped.set(key, [...(grouped.get(key) ?? []), task])
		}
		return [...grouped.entries()].sort(([left], [right]) => {
			const leftIndex = sectionOrder.indexOf(left)
			const rightIndex = sectionOrder.indexOf(right)
			return (leftIndex < 0 ? 99 : leftIndex) - (rightIndex < 0 ? 99 : rightIndex)
		})
	}, [data])

	const progress = data?.progress
	const completed = progress ? progress.done + progress.missed + progress.notApplicable : 0
	const percent = progress?.total ? Math.round((completed / progress.total) * 100) : 0

	return (
		<div className='today-page'>
			<header className='today-page__header'>
				<div>
					<span className='today-page__eyebrow'>DoIt - read only</span>
					<h1>Today</h1>
					<p>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
				</div>
				<div className='today-page__date-controls' aria-label='Choose task date'>
					<button type='button' onClick={() => setDate((current) => shiftDate(current, -1))} aria-label='Previous day'>
						<svg viewBox='0 0 24 24' aria-hidden='true'><path d='m15 18-6-6 6-6' /></svg>
					</button>
					<label>
						<span className='sr-only'>Task date</span>
						<input type='date' value={date} onChange={(event) => setDate(event.target.value)} />
					</label>
					<button type='button' onClick={() => setDate((current) => shiftDate(current, 1))} aria-label='Next day'>
						<svg viewBox='0 0 24 24' aria-hidden='true'><path d='m9 18 6-6-6-6' /></svg>
					</button>
					<button className='today-page__today-button' type='button' onClick={() => setDate(toLocalDateValue(new Date()))}>Today</button>
				</div>
			</header>

			{progress && !failed && (
				<section className='today-progress' aria-label={`${completed} of ${progress.total} tasks resolved`}>
					<div className='today-progress__summary'>
						<div><strong>{progress.pending}</strong><span>pending</span></div>
						<div className='today-progress__percentage'><strong>{percent}%</strong><span>resolved</span></div>
					</div>
					<div className='today-progress__track' aria-hidden='true'>
						{progress.total > 0 && <>
							<span className='today-progress__done' style={{ flex: progress.done }} />
							<span className='today-progress__missed' style={{ flex: progress.missed }} />
							<span className='today-progress__na' style={{ flex: progress.notApplicable }} />
							<span className='today-progress__pending' style={{ flex: progress.pending }} />
						</>}
					</div>
					<ul className='today-progress__legend'>
						<li><i className='is-done' />Done <strong>{progress.done}</strong></li>
						<li><i className='is-missed' />Missed <strong>{progress.missed}</strong></li>
						<li><i className='is-na' />N/A <strong>{progress.notApplicable}</strong></li>
						<li><i className='is-pending' />Pending <strong>{progress.pending}</strong></li>
					</ul>
				</section>
			)}

			{loading && <ModuleState kind='loading' title='Loading your day'>Getting the latest tasks from DoIt.</ModuleState>}
			{failed && <ModuleState kind='error' title='DoIt is not available'>Connect or review the DoIt provider to see today's tasks.</ModuleState>}
			{!loading && !failed && data?.tasks.length === 0 && <ModuleState kind='empty' title='Nothing scheduled'>There are no tasks for this date.</ModuleState>}

			{!loading && !failed && sections.length > 0 && (
				<div className='today-sections'>
					{sections.map(([key, tasks]) => (
						<section className={`today-section today-section--${key}`} key={key}>
							<header><h2>{sectionLabels[key] ?? key}</h2><span>{tasks.length}</span></header>
							<div className='today-section__list'>
								{tasks.map((task) => (
									<article className='today-task' key={task.occurrenceId}>
										<span className='today-task__state' aria-hidden='true' />
										<div className='today-task__main'>
											<strong>{task.title}</strong>
											<span>{taskTime(task)}</span>
										</div>
										<div className='today-task__meta'>{task.zoneName && <span>{task.zoneName}</span>}<span>{task.scope}</span></div>
									</article>
								))}
							</div>
						</section>
					))}
				</div>
			)}
		</div>
	)
}
