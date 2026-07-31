import { useEffect, useState } from 'react'
import { BrandMark, Icon, ModuleState } from '@/components/Shared'
import { useUserPreferences } from '@/contexts/useUserPreferences'
import type { AppLauncherItem } from '@/models/api/Apps'
import type { WorkflowRun, WorkflowsResponse } from '@/models/api/Operations'
import { appCatalogService, operationsService } from '@/services'
import { safeExternalUrl } from '@/utils'
import './WorkflowsPage.scss'

const displayStatus = (run: WorkflowRun) => run.status === 'completed' ? (run.conclusion ?? 'unknown') : (run.status ?? 'unknown')

const brandKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const buildIconMap = (apps: AppLauncherItem[]) => apps.reduce<Record<string, string>>((result, app) => {
	if (!app.iconUrl) return result
	for (const value of [app.id, app.name]) if (value) result[brandKey(value)] = app.iconUrl
	return result
}, {})

const executionDate = (run: WorkflowRun) => {
	for (const value of [run.startedAt, run.completedAt]) {
		if (!value) continue
		const date = new Date(value)
		if (!Number.isNaN(date.getTime())) return date
	}
	return null
}

const WorkflowExecutionTime = ({ run, timeZone, className }: { run: WorkflowRun; timeZone: string; className?: string }) => {
	const date = executionDate(run)
	if (!date) return <span className={className}>Execution time unavailable</span>
	return <time className={className} dateTime={date.toISOString()}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date)}</time>
}

const runDuration = (run: WorkflowRun) => {
	if (!run.startedAt) return '—'
	const start = new Date(run.startedAt).getTime()
	const end = run.completedAt ? new Date(run.completedAt).getTime() : Date.now()
	if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return '—'
	const seconds = Math.round((end - start) / 1000)
	return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

const WorkflowRow = ({ run, timeZone }: { run: WorkflowRun; timeZone: string }) => {
	const url = safeExternalUrl(run.url)
	const status = displayStatus(run)
	return <article className='workflow-row'>
		<span className={`workflow-state is-${status}`} aria-label={`Workflow status: ${status.replaceAll('_', ' ')}`}><i aria-hidden='true' />{status.replaceAll('_', ' ')}</span>
		<div className='workflow-row__name'><strong>{run.repository}</strong><span>{run.degraded ? 'Status unavailable' : 'Latest run'}</span><WorkflowExecutionTime run={run} timeZone={timeZone} className='workflow-row__date' /></div>
		<div><span>Branch</span><strong>{run.branch ?? '—'}</strong></div><div><span>Commit</span><strong>{run.commit?.slice(0, 7) ?? '—'}</strong></div><div><span>Actor</span><strong>{run.actor ?? '—'}</strong></div><div><span>Duration</span><strong>{runDuration(run)}</strong></div>
		{url ? <a href={url} target='_blank' rel='noopener noreferrer' aria-label={`Open ${run.repository} workflow on GitHub`}><Icon name='external' /></a> : <span />}
	</article>
}

export const WorkflowsPage = () => {
	const [data, setData] = useState<WorkflowsResponse | null>(null)
	const [failed, setFailed] = useState(false)
	const [loading, setLoading] = useState(true)
	const [iconMap, setIconMap] = useState<Record<string, string>>({})
	const { preferences } = useUserPreferences()
	useEffect(() => {
		let active = true
		appCatalogService.list().then((apps) => { if (active) setIconMap(buildIconMap(apps)) }).catch(() => {})
		return () => { active = false }
	}, [])
	useEffect(() => {
		let active = true
		const load = () => operationsService.workflows().then((result) => { if (active) { setData(result); setFailed(false) } }).catch(() => { if (active) setFailed(true) }).finally(() => { if (active) setLoading(false) })
		void load(); const interval = window.setInterval(load, 30_000); return () => { active = false; window.clearInterval(interval) }
	}, [])
	const visible = (data?.repositories ?? []).filter((run) => preferences.repositoryVisibility[run.repository] !== false)
	const failedCount = visible.filter((run) => displayStatus(run) === 'failure').length
	const runningCount = visible.filter((run) => ['in_progress', 'queued', 'waiting', 'requested', 'pending'].includes(displayStatus(run))).length
	const latestSuccess = visible.filter((run) => displayStatus(run) === 'success').sort((left, right) => new Date(right.completedAt ?? right.startedAt ?? 0).getTime() - new Date(left.completedAt ?? left.startedAt ?? 0).getTime())[0]
	const groups = Object.entries(visible.reduce<Record<string, WorkflowRun[]>>((result, run) => { const application = run.repository.split('/').at(-1)?.replace(/\.(Api|Front)$/i, '') ?? 'Household'; return { ...result, [application]: [...(result[application] ?? []), run] } }, {}))
	return <div className='workflows-page page-stack'>
		<header className='workflows-header'><div><span>GitHub Actions</span><h1>Workflows</h1><p>Latest cached delivery state for every Household application repository.</p></div><div role='status'><i className={failed || data?.degraded ? 'is-degraded' : ''} aria-hidden='true' />{data?.lastSuccessfulPoll ? `Updated ${new Intl.DateTimeFormat(undefined, { timeStyle: 'short', timeZone: preferences.timezone }).format(new Date(data.lastSuccessfulPoll))}` : 'Waiting for server cache'}</div></header>
		{loading && <ModuleState kind='loading' title='Loading workflows'>Reading the Household GitHub Actions cache.</ModuleState>}
		{failed && <ModuleState kind='error' title='Workflows are not configured'>Configure the server-side GitHub integration in Settings. No GitHub token is requested by this page.</ModuleState>}
		{!loading && !failed && visible.length === 0 && <ModuleState kind='empty' title='No repositories visible'>Enable repositories in Settings or configure the server-side GitHub integration.</ModuleState>}
		{!loading && !failed && visible.length > 0 && <section className='workflow-summary' aria-label='Workflow summary'><div><strong>{failedCount}</strong><span>Failed</span></div><div><strong>{runningCount}</strong><span>Running</span></div><div><strong>{latestSuccess ? latestSuccess.repository.split('/').at(-1) : 'None'}</strong><span>Latest success</span>{latestSuccess && <WorkflowExecutionTime run={latestSuccess} timeZone={preferences.timezone} />}</div></section>}
		{groups.map(([application, runs]) => <section className='workflow-group' key={application}><header><BrandMark provider={application.toLowerCase().replaceAll(' ', '-')} name={application} iconUrl={iconMap[brandKey(application)]} /><div><h2>{application}</h2><span>{runs.length} repositories</span></div></header><div>{runs.map((run) => <WorkflowRow key={run.repository} run={run} timeZone={preferences.timezone} />)}</div></section>)}
	</div>
}
