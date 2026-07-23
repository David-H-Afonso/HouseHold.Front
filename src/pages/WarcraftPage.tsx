import { useEffect, useState, type CSSProperties } from 'react'
import { ModuleState } from '@/components/Shared'
import type { WarcraftQuickStatus } from '@/models/api/Modules'
import { moduleService } from '@/services'
import './WarcraftPage.scss'

const statusCards = [
	['notStarted', 'Not started', '#8890b5'],
	['pending', 'Pending', '#e8a44a'],
	['inProgress', 'In progress', '#7c8cff'],
	['lastDay', 'Last day', '#a855f7'],
	['lastWeek', 'Last week', '#7c5cbf'],
	['finished', 'Finished', '#57c55a'],
] as const

export const WarcraftPage = () => {
	const [data, setData] = useState<WarcraftQuickStatus | null>(null)
	const [loading, setLoading] = useState(true)
	const [failed, setFailed] = useState(false)

	useEffect(() => {
		let active = true
		moduleService.warcraft()
			.then((response) => { if (active) setData(response) })
			.catch(() => { if (active) setFailed(true) })
			.finally(() => { if (active) setLoading(false) })
		return () => { active = false }
	}, [])

	const completion = data?.total ? Math.round((data.finished / data.total) * 100) : 0

	return (
		<div className='warcraft-page'>
			<header className='warcraft-page__header'>
				<div><span>Warcraft Archive</span><h1>Quick status</h1><p>Your weekly progression at a glance.</p></div>
				{data && <time dateTime={data.generatedAtUtc}>Updated {new Date(data.generatedAtUtc).toLocaleString()}</time>}
			</header>
			{loading && <ModuleState kind='loading' title='Loading the archive'>Reading your latest Warcraft status.</ModuleState>}
			{failed && <ModuleState kind='error' title='Warcraft Archive is not available'>Connect or review the Warcraft Archive provider to see quick status.</ModuleState>}
			{data && !failed && <>
				<section className='warcraft-overview'>
					<div className='warcraft-overview__ring' style={{ '--progress': `${completion * 3.6}deg` } as CSSProperties} role='img' aria-label={`${completion}% finished`}><div><strong>{completion}%</strong><span>finished</span></div></div>
					<div><span className='warcraft-overview__eyebrow'>Tracked activities</span><strong>{data.total}</strong><p>{data.finished} completed - {Math.max(0, data.total - data.finished)} still active</p></div>
				</section>
				<div className='warcraft-status-grid'>
					{statusCards.map(([key, label, color]) => (
						<article key={key} style={{ '--status-color': color } as CSSProperties}>
							<span className='warcraft-status-grid__dot' aria-hidden='true' /><span>{label}</span><strong>{data[key]}</strong>
							<div aria-hidden='true'><i style={{ width: `${data.total ? (data[key] / data.total) * 100 : 0}%` }} /></div>
						</article>
					))}
				</div>
			</>}
		</div>
	)
}
