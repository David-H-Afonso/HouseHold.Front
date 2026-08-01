import type { AppLauncherItem } from '@/models/api/Apps'
import { BrandMark, Icon, IntegrationStatusBadge } from '@/components/Shared'
import { safeExternalUrl } from '@/utils'
import { useUserPreferences } from '@/contexts/useUserPreferences'

interface AppLauncherCardProps {
	app: AppLauncherItem
	onToggleFavorite: (app: AppLauncherItem) => void
}

export const AppLauncherCard = ({ app, onToggleFavorite }: AppLauncherCardProps) => {
	const openUrl = safeExternalUrl(app.openUrl)
	const { preferences } = useUserPreferences()
	const dateTime = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: preferences.timezone }).format(new Date(value))

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
				{app.monitoringEnabled ? <>
					<IntegrationStatusBadge status={app.healthStatus} />
					{app.frontStatus !== 'not_configured' && <span>Front: {app.frontStatus.replaceAll('_', ' ')}</span>}
					{app.apiStatus !== 'not_configured' && <span>API: {app.apiStatus.replaceAll('_', ' ')}</span>}
					{app.userConnectionStatus !== 'not_applicable' && <span>Account: {app.userConnectionStatus.replaceAll('_', ' ')}</span>}
					<span>Container: {app.containerStatus}</span>
					{app.image && <span>Image: {app.image}</span>}
					{app.lastUpdated && <span>Started: {dateTime(app.lastUpdated)}</span>}
				</> : <span>Link only · monitoring disabled</span>}
			</div>

			<div className='app-launcher-card__actions'>
				{openUrl ? (
					<a className='app-open-button' href={openUrl} target='_blank' rel='noopener noreferrer'>
						Open <Icon name='external' />
					</a>
				) : (
					<span className='app-open-button app-open-button--disabled'>No URL</span>
				)}
			</div>
		</article>
	)
}
