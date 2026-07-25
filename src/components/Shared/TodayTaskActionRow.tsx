import type { TodayTask } from '@/models/api/Modules'
import { useState } from 'react'
import { DetailDrawer } from './DetailDrawer'
import './TodayTaskActionRow.scss'

const normalizeStatus = (value: string) => value.replace(/[\s_-]/g, '').toLowerCase()

const timeLabel = (task: TodayTask) => {
	const time = task.recommendedTime ?? task.availableFromTime ?? task.availableUntilTime
	const schedule = !time
		? null
		: task.recommendedTime
			? `Recommended ${time.slice(0, 5)}`
			: task.availableFromTime
				? `Available ${time.slice(0, 5)}`
				: `Due ${time.slice(0, 5)}`
	return [schedule, task.zoneName, task.scope].filter(Boolean).join(' - ')
}

const completedLabel = (task: TodayTask, displayTimeZone?: string) => {
	if (!task.completedAt) return null
	const date = new Date(task.completedAt)
	return Number.isNaN(date.getTime()) ? null : `Completed ${new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone: displayTimeZone ?? task.timeZoneId }).format(date)}`
}

interface TodayTaskActionRowProps {
	task: TodayTask
	pending: boolean
	compact?: boolean
	displayTimeZone?: string
	onAction: (task: TodayTask, action: 'complete' | 'undo') => void
}

export const TodayTaskActionRow = ({ task, pending, compact = false, displayTimeZone, onAction }: TodayTaskActionRowProps) => {
	const [detailsOpen, setDetailsOpen] = useState(false)
	const status = normalizeStatus(task.occurrenceStatus)
	const completed = status === 'done' || status === 'completed'
	const actionable = status === 'pending' || completed
	return <>
		<div className={`today-action-row${compact ? ' today-action-row--compact' : ''}${completed ? ' is-completed' : ''}${pending ? ' is-pending' : ''}`}>
			<label className='today-action-row__action'>
				<input
				type='checkbox'
				checked={completed}
				disabled={!actionable || pending}
				onChange={() => onAction(task, completed ? 'undo' : 'complete')}
				aria-label={completed ? `Undo completion for ${task.title}` : `Complete ${task.title}`}
				/>
				<span className='today-action-row__check' aria-hidden='true' />
			</label>
			<button type='button' className='today-action-row__details' onClick={() => setDetailsOpen(true)} aria-label={`View details for ${task.title}`}>
			<span className='today-action-row__content'>
				<strong>{task.title}</strong>
				<small>{[timeLabel(task), completedLabel(task, displayTimeZone)].filter(Boolean).join(' · ')}</small>
			</span>
			<span className='today-action-row__state'>{pending ? 'Saving' : completed ? 'Done' : task.state}</span>
			</button>
		</div>
		<DetailDrawer open={detailsOpen} title={task.title} onClose={() => setDetailsOpen(false)}>
			<dl className='task-detail-list'>
			<div><dt>Zone</dt><dd>{task.zoneName ?? 'No zone'}</dd></div><div><dt>Scope</dt><dd>{task.scope}</dd></div><div><dt>Date</dt><dd>{task.occurrenceDate}</dd></div><div><dt>Availability</dt><dd>{task.availableFromTime ? `From ${task.availableFromTime.slice(0, 5)}` : 'Any time'}{task.availableUntilTime ? ` until ${task.availableUntilTime.slice(0, 5)}` : ''}</dd></div><div><dt>Recommended</dt><dd>{task.recommendedTime?.slice(0, 5) ?? 'Not set'}</dd></div><div><dt>Recurrence</dt><dd>{task.recurrenceType || 'Managed by DoIt'}</dd></div><div><dt>Assignment</dt><dd>{task.assignmentMode || 'Not assigned'}{task.assigneeNames.length ? ` · ${task.assigneeNames.join(', ')}` : ''}</dd></div><div><dt>Timezone</dt><dd>{task.timeZoneId}</dd></div>{task.completedAt && <div><dt>Completed at</dt><dd>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium', timeZone: displayTimeZone ?? task.timeZoneId }).format(new Date(task.completedAt))}</dd></div>}<div><dt>Status</dt><dd>{task.occurrenceStatus}</dd></div>
			</dl>
		</DetailDrawer>
	</>
}
