import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ModuleState } from '@/components/Shared'
import type { WarcraftWeeklyItem, WarcraftWeeklyResponse } from '@/models/api/Modules'
import { moduleService } from '@/services'
import './WarcraftPage.scss'

const statusMeta: Record<string, { label: string; description: string; color: string }> = {
	notstarted: { label: 'Not started', description: 'Not begun this week', color: '#8890b5' },
	pending: { label: 'Pending', description: 'Ready to be worked on', color: '#e8a44a' },
	inprogress: { label: 'In progress', description: 'Started but not complete', color: '#7c8cff' },
	lastday: { label: 'Last day', description: 'Completed yesterday and due again', color: '#a855f7' },
	lastweek: { label: 'Last week', description: 'Completed last week and due again', color: '#7c5cbf' },
	finished: { label: 'Finished', description: 'Completed this week', color: '#57c55a' },
}

const normalizeStatus = (value: string) => value.replace(/[\s_-]/g, '').toLowerCase()
const statusDetails = (status: string) => statusMeta[normalizeStatus(status)] ?? { label: status, description: 'Current tracking state', color: '#8890b5' }

const formatDate = (value: string | null) => {
	if (!value) return 'Never'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return 'Unknown'
	return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const WarcraftRow = ({ item }: { item: WarcraftWeeklyItem }) => {
	const meta = statusDetails(item.status)
	return (
		<article className='warcraft-row' style={{ '--status-color': meta.color } as CSSProperties}>
			<div className='warcraft-row__content'><span className='warcraft-status-pill'>{meta.label}</span><strong>{item.contentName}</strong><small>{meta.description}</small></div>
			<div><span>Character</span><strong>{item.characterName}</strong><small>{item.characterClass}</small></div>
			<div><span>Expansion</span><strong>{item.expansion}</strong></div>
			<div><span>Difficulty</span><strong>{item.difficulty}</strong></div>
			<div><span>Last completion</span><strong>{formatDate(item.lastCompletedAt)}</strong></div>
		</article>
	)
}

export const WarcraftPage = () => {
	const [data, setData] = useState<WarcraftWeeklyResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [failed, setFailed] = useState(false)
	const [filter, setFilter] = useState('unfinished')

	useEffect(() => {
		let active = true
		moduleService.warcraft()
			.then((response) => { if (active) setData(response) })
			.catch(() => { if (active) setFailed(true) })
			.finally(() => { if (active) setLoading(false) })
		return () => { active = false }
	}, [])

	const visibleItems = useMemo(() => (data?.items ?? []).filter((item) => {
		const status = normalizeStatus(item.status)
		if (filter === 'all') return true
		if (filter === 'unfinished') return status !== 'finished'
		return status === filter
	}), [data, filter])

	const filterOptions = data ? [
		['unfinished', 'Unfinished', data.summary.remaining],
		['finished', 'Finished', data.summary.finished],
		['lastweek', 'Last week', data.summary.lastWeek],
		['inprogress', 'In progress', data.summary.inProgress],
		['all', 'All', data.summary.total],
	] as const : []

	return (
		<div className='warcraft-page'>
			<header className='warcraft-page__header'>
				<div><span>Warcraft Archive</span><h1>Weekly progress</h1><p>Track what is complete, what is due again, and what still needs attention.</p></div>
				{data && <time dateTime={data.generatedAtUtc}>Updated {new Date(data.generatedAtUtc).toLocaleString()}</time>}
			</header>
			{loading && <ModuleState kind='loading' title='Loading the archive'>Reading your latest Warcraft week.</ModuleState>}
			{failed && <ModuleState kind='error' title='Warcraft Archive is not available'>Connect or review the Warcraft Archive provider to see weekly progress.</ModuleState>}
			{data && !failed && <>
				<section className='warcraft-summary' aria-label={`${data.summary.finished} completed and ${data.summary.remaining} remaining`}>
					<div><span>Completed this week</span><strong>{data.summary.finished}</strong></div>
					<div><span>Remaining</span><strong>{data.summary.remaining}</strong></div>
					<div className='warcraft-summary__progress'><span>{data.summary.completionPercent}% complete</span><div aria-hidden='true'><i style={{ width: `${Math.min(100, Math.max(0, data.summary.completionPercent))}%` }} /></div><small>{data.summary.total} tracked activities</small></div>
				</section>

				<div className='warcraft-status-guide'>
					<p><strong>Finished</strong> means completed this week.</p>
					<p><strong>Last week</strong> means completed last week and due again.</p>
				</div>

				<section className='warcraft-worklist'>
					<header><div><span>Worklist</span><h2>Tracked content</h2></div><div className='warcraft-filters' aria-label='Filter Warcraft rows'>{filterOptions.map(([value, label, count]) => <button key={value} type='button' aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}<span>{count}</span></button>)}</div></header>
					{visibleItems.length === 0 ? <p className='warcraft-worklist__empty'>No rows match this status.</p> : <div className='warcraft-rows'>{visibleItems.map((item) => <WarcraftRow key={item.id} item={item} />)}</div>}
				</section>
			</>}
		</div>
	)
}
