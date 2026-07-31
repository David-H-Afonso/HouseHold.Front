import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ExternalProviderLink, ModuleState } from '@/components/Shared'
import type { WarcraftWeeklyItem, WarcraftWeeklyResponse } from '@/models/api/Modules'
import { moduleService } from '@/services'
import { useUserPreferences } from '@/contexts/useUserPreferences'
import './WarcraftPage.scss'

const statusMeta: Record<string, { label: string; description: string; color: string }> = {
	notstarted: { label: 'Not started', description: 'Not begun this week', color: '#8890b5' },
	pending: { label: 'Pending', description: 'Ready to be worked on', color: '#e8a44a' },
	inprogress: { label: 'In progress', description: 'Started but not complete', color: '#7c8cff' },
	lastday: { label: 'Last day', description: 'Completed yesterday and due again', color: '#a855f7' },
	lastweek: { label: 'Last week', description: 'Completed last week and due again', color: '#7c5cbf' },
	finished: { label: 'Finished', description: 'Completed this week', color: '#57c55a' },
}

const normalizeStatus = (value: string) => {
	const normalized = value.replace(/[\s_-]/g, '').toLowerCase()
	return normalized === 'completedlastday' ? 'lastday' : normalized === 'completedlastweek' ? 'lastweek' : normalized
}
const statusDetails = (status: string) => statusMeta[normalizeStatus(status)] ?? { label: status, description: 'Current tracking state', color: '#8890b5' }

const formatDate = (value: string | null, timeZone: string) => {
	if (!value) return 'Never'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return 'Unknown'
	return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone }).format(date)
}

const nextStatuses = (item: WarcraftWeeklyItem) => {
	const current = normalizeStatus(item.status)
	const transitions: Record<string, string[]> = {
		notstarted: ['Pending'],
		pending: ['NotStarted', 'InProgress'],
		inprogress: ['Pending', 'Finished'],
		finished: ['NotStarted', 'InProgress'],
		lastday: ['NotStarted', 'Finished'],
		lastweek: ['NotStarted', 'Finished'],
	}
	const result = [...(transitions[current] ?? [])]
	if (current === 'finished' && item.period?.toLowerCase() === 'daily') result.push('LastDay')
	if (current === 'finished' && item.period?.toLowerCase() === 'weekly') result.push('LastWeek')
	return result
}

const WarcraftRow = ({ item, pending, error, timeZone, onChange }: { item: WarcraftWeeklyItem; pending: boolean; error?: string; timeZone: string; onChange: (item: WarcraftWeeklyItem, status: string) => void }) => {
	const meta = statusDetails(item.status)
	return (
		<article className='warcraft-row' style={{ '--status-color': meta.color } as CSSProperties}>
			<div className='warcraft-row__content'><span className='warcraft-status-pill'>{meta.label}</span><strong>{item.contentName}</strong><small>{meta.description}</small></div>
			<div><span>Character</span><strong>{item.characterName}</strong><small>{item.characterClass}</small></div>
			<div><span>Expansion</span><strong>{item.expansion}</strong></div>
			<div><span>Difficulty</span><strong>{item.difficulty}</strong></div>
			<div><span>Period</span><strong>{item.period ?? 'Weekly'}</strong></div>
			<div><span>Last completion</span><strong>{formatDate(item.lastCompletedAt, timeZone)}</strong></div>
			<label className='warcraft-row__action'><span>Next status</span><select value='' disabled={pending || nextStatuses(item).length === 0} onChange={(event) => { if (event.target.value) onChange(item, event.target.value) }}><option value=''>{pending ? 'Saving…' : 'Choose next…'}</option>{nextStatuses(item).map((status) => <option key={status} value={status}>{statusDetails(status).label}</option>)}</select></label>
			{error && <p className='warcraft-row__error' role='alert'>{error}</p>}
		</article>
	)
}

export const WarcraftPage = () => {
	const { preferences } = useUserPreferences()
	const [data, setData] = useState<WarcraftWeeklyResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [failed, setFailed] = useState(false)
	const [filter, setFilter] = useState('unfinished')
	const [pending, setPending] = useState<Set<number | string>>(() => new Set())
	const [errors, setErrors] = useState<Record<string, string>>({})

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

	const updateStatus = async (item: WarcraftWeeklyItem, status: string) => {
		if (!data || pending.has(item.id)) return
		const previous = data
		setPending((current) => new Set(current).add(item.id)); setErrors((current) => ({ ...current, [String(item.id)]: '' })); setData({ ...data, items: data.items.map((entry) => entry.id === item.id ? { ...entry, status } : entry) })
		try { const updated = await moduleService.updateWarcraftStatus(item.id, status); setData((current) => current ? { ...current, items: current.items.map((entry) => entry.id === updated.id ? updated : entry) } : current) }
		catch { try { setData(await moduleService.warcraft()) } catch { setData(previous) }; setErrors((current) => ({ ...current, [String(item.id)]: 'This status could not be confirmed. The canonical row was restored.' })) }
		finally { setPending((current) => { const next = new Set(current); next.delete(item.id); return next }) }
	}

	return (
		<div className='warcraft-page'>
			<header className='warcraft-page__header'>
				<div><ExternalProviderLink provider='warcraft-archive'>Warcraft Archive</ExternalProviderLink><h1>Weekly progress</h1><p>Track what is complete, what is due again, and what still needs attention.</p></div>
				{data && <time dateTime={data.generatedAtUtc}>Updated {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: preferences.timezone }).format(new Date(data.generatedAtUtc))}</time>}
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
					{visibleItems.length === 0 ? <p className='warcraft-worklist__empty'>No rows match this status.</p> : <div className='warcraft-rows'>{visibleItems.map((item) => <WarcraftRow key={item.id} item={item} pending={pending.has(item.id)} error={errors[String(item.id)]} timeZone={preferences.timezone} onChange={updateStatus} />)}</div>}
				</section>
			</>}
		</div>
	)
}
