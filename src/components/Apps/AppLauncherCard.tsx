import { useEffect, useId, useState } from 'react'
import type { AppLauncherItem, AppOperation } from '@/models/api/Apps'
import { BrandMark, ConfirmActionDialog, Icon, IntegrationStatusBadge } from '@/components/Shared'
import { appCatalogService } from '@/services/AppCatalogService'
import { safeExternalUrl } from '@/utils'
import { isApiError } from '@/utils/customFetch'
import { useUserPreferences } from '@/contexts/useUserPreferences'
import './AppLauncherCard.scss'

interface AppLauncherCardProps {
	app: AppLauncherItem
	isAdmin: boolean
	onToggleFavorite: (app: AppLauncherItem) => void
}

type AppAction = { type: 'update' } | { type: 'rollback'; backupId: string }

const actionLabel = (action: string) => action.toLowerCase().includes('rollback') ? 'Rollback' : action.toLowerCase().includes('update') ? 'Update' : 'Operation'
const statusLabel = (status: string) => {
	const normalized = status.toLowerCase()
	if (['accepted', 'queued', 'running', 'succeeded', 'completed', 'failed', 'cancelled'].includes(normalized)) {
		return normalized.charAt(0).toUpperCase() + normalized.slice(1)
	}
	return 'Pending'
}

export const AppLauncherCard = ({ app, isAdmin, onToggleFavorite }: AppLauncherCardProps) => {
	const openUrl = safeExternalUrl(app.openUrl)
	const { preferences } = useUserPreferences()
	const dateTime = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: preferences.timezone }).format(new Date(value))
	const canAdminister = isAdmin && app.adminActionsAvailable
	const isHousehold = app.id.toLowerCase().includes('household') || app.name.toLowerCase() === 'household'
	const [operations, setOperations] = useState<AppOperation[]>([])
	const [historyOpen, setHistoryOpen] = useState(false)
	const [dialogAction, setDialogAction] = useState<AppAction | null>(null)
	const [submitting, setSubmitting] = useState(false)
	const [actionError, setActionError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)
	const historyId = useId()

	useEffect(() => {
		if (!canAdminister) return
		let active = true
		void appCatalogService.operations(app.id)
			.then((items) => { if (active && Array.isArray(items)) setOperations(items) })
			.catch(() => { /* History is optional until the endpoint is available. */ })
		return () => { active = false }
	}, [app.id, canAdminister])

	const executeAction = async (actionToRun: AppAction) => {
		setSubmitting(true)
		setActionError(null)
		try {
			if (actionToRun.type === 'update') {
				await appCatalogService.update(app.id, { confirmation: `UPDATE ${app.id}` })
			} else {
				await appCatalogService.rollback(app.id, {
					backupId: actionToRun.backupId,
					confirmation: `ROLLBACK ${app.id}`,
				})
			}
			const action = actionToRun.type === 'update' ? 'Update' : 'Rollback'
			setNotice(`${action} accepted and queued. ${app.name} may restart.${isHousehold ? ' Updating Household may disconnect this page.' : ''}`)
			setDialogAction(null)
			void appCatalogService.operations(app.id).then((items) => {
				if (Array.isArray(items)) setOperations(items)
			}).catch(() => { /* The accepted state remains useful while history catches up. */ })
		} catch (error) {
			setActionError(isApiError(error) && error.code === 'casaos_reconnect_required'
				? 'CasaOS rejected the saved token. Reconnect CasaOS in Settings → Apps, then try again.'
				: isApiError(error) && error.status === 429
					? 'CasaOS actions are temporarily rate-limited. Wait a few minutes before trying again.'
					: 'The operation could not be queued. Check the app state and try again.')
		} finally {
			setSubmitting(false)
		}
	}

	const submitAction = async () => {
		if (dialogAction) await executeAction(dialogAction)
	}

	const requiredPhrase = dialogAction?.type === 'rollback' ? `ROLLBACK ${app.id}` : `UPDATE ${app.id}`

	return (
		<article className='app-launcher-card'>
			<header className='app-launcher-card__header'>
				<BrandMark provider={app.id} name={app.name} iconUrl={app.iconUrl} />
				<div>
					<h2>{app.name}</h2>
					<span>{app.category}</span>
				</div>
				<button
					type='button'
					className={app.favorite ? 'app-favorite app-favorite--active' : 'app-favorite'}
					onClick={() => onToggleFavorite(app)}
					aria-label={app.favorite ? `Remove ${app.name} from favorites` : `Add ${app.name} to favorites`}
				>
					{app.favorite ? 'Saved' : 'Save'}
				</button>
			</header>

			{app.description && <p className='app-launcher-card__description'>{app.description}</p>}

			<div className='app-launcher-card__meta'>
				<IntegrationStatusBadge status={app.healthStatus} />
				<span>Front: {app.frontStatus.replaceAll('_', ' ')}</span>
				<span>API: {app.apiStatus.replaceAll('_', ' ')}</span>
				{app.userConnectionStatus !== 'not_applicable' && <span>Account: {app.userConnectionStatus.replaceAll('_', ' ')}</span>}
				<span>Container: {app.containerStatus}</span>
				{app.image && <span>Image: {app.image}</span>}
				{app.lastUpdated && <span>Checked: {dateTime(app.lastUpdated)}</span>}
			</div>

			<div className='app-launcher-card__actions'>
				{canAdminister && (
					<button type='button' className='app-admin-button' disabled={submitting} onClick={() => { setActionError(null); void executeAction({ type: 'update' }) }}>
						{app.updateAvailable === true ? 'Update' : 'Check/update'}
					</button>
				)}
				{openUrl ? (
					<a className='app-open-button' href={openUrl} target='_blank' rel='noopener noreferrer'>
						Open <Icon name='external' />
					</a>
				) : (
					<span className='app-open-button app-open-button--disabled'>No URL</span>
				)}
			</div>

			{actionError && !dialogAction && <p className='error-banner' role='alert'>{actionError}</p>}
			{notice && <p className='app-operation-notice' role='status'>{notice}</p>}

			{canAdminister && operations.length > 0 && <div className='app-operation-history'>
				<button type='button' className='app-history-toggle' aria-expanded={historyOpen} aria-controls={historyId} onClick={() => setHistoryOpen((current) => !current)}>
					<span>Operations</span><span className='app-history-toggle__count'>{operations.length}</span><Icon name={historyOpen ? 'arrowUp' : 'arrowDown'} />
				</button>
				{historyOpen && <ul id={historyId} aria-label={`${app.name} operation history`}>
					{operations.map((operation) => <li key={operation.actionLogId}>
						<div>
							<strong>{actionLabel(operation.action)}</strong>
							<span>{statusLabel(operation.status)}</span>
						</div>
						<time dateTime={operation.startedAt}>{dateTime(operation.startedAt)}</time>
						{operation.finishedAt && <small>Finished {dateTime(operation.finishedAt)}</small>}
						{operation.errorCode && <small className='error-text'>Operation failed. Check the server logs.</small>}
						{operation.backupId && <button type='button' className='app-rollback-button' onClick={() => { setActionError(null); setDialogAction({ type: 'rollback', backupId: operation.backupId! }) }}>Rollback this backup</button>}
					</li>)}
				</ul>}
			</div>}

			<ConfirmActionDialog
				open={dialogAction !== null}
				title={`${dialogAction?.type === 'rollback' ? 'Rollback' : 'Update'} ${app.name}`}
				description={`${app.name} may restart while this operation runs.${isHousehold ? ' Updating Household may disconnect this page.' : ''}`}
				confirmLabel={dialogAction?.type === 'rollback' ? 'Queue rollback' : 'Queue update'}
				requiredPhrase={requiredPhrase}
				busy={submitting}
				error={actionError}
				onCancel={() => { setDialogAction(null); setActionError(null) }}
				onConfirm={() => void submitAction()}
			/>
		</article>
	)
}
