import type { TodayTask } from '@/models/api/Modules'
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

interface TodayTaskActionRowProps {
	task: TodayTask
	pending: boolean
	compact?: boolean
	onAction: (task: TodayTask, action: 'complete' | 'undo') => void
}

export const TodayTaskActionRow = ({ task, pending, compact = false, onAction }: TodayTaskActionRowProps) => {
	const status = normalizeStatus(task.occurrenceStatus)
	const completed = status === 'done' || status === 'completed'
	const actionable = status === 'pending' || completed
	return (
		<label className={`today-action-row${compact ? ' today-action-row--compact' : ''}${completed ? ' is-completed' : ''}${pending ? ' is-pending' : ''}`}>
			<input
				type='checkbox'
				checked={completed}
				disabled={!actionable || pending}
				onChange={() => onAction(task, completed ? 'undo' : 'complete')}
				aria-label={completed ? `Undo completion for ${task.title}` : `Complete ${task.title}`}
			/>
			<span className='today-action-row__check' aria-hidden='true' />
			<span className='today-action-row__content'>
				<strong>{task.title}</strong>
				<small>{timeLabel(task)}</small>
			</span>
			<span className='today-action-row__state'>{pending ? 'Saving' : completed ? 'Done' : task.state}</span>
		</label>
	)
}
