import type { AppLauncherItem } from '@/models/api/Apps'
import { IntegrationStatusBadge } from '@/components/Shared'

interface AppLauncherCardProps {
	app: AppLauncherItem
	onToggleFavorite: (app: AppLauncherItem) => void
}

export const AppLauncherCard = ({ app, onToggleFavorite }: AppLauncherCardProps) => {
	const openUrl = app.openUrl ?? app.externalUrl ?? app.internalUrl

	return (
		<article className='app-launcher-card'>
			<header className='app-launcher-card__header'>
				<div className='app-launcher-card__icon' aria-hidden='true'>
					{app.iconUrl ? <img src={app.iconUrl} alt='' /> : app.name.slice(0, 2).toUpperCase()}
				</div>
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
				<span>container: {app.containerStatus}</span>
			</div>

			<div className='app-launcher-card__actions'>
				{openUrl ? (
					<a className='app-open-button' href={openUrl} target='_blank' rel='noreferrer'>
						Open
					</a>
				) : (
					<span className='app-open-button app-open-button--disabled'>No URL</span>
				)}
			</div>
		</article>
	)
}
