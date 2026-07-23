import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardGrid, DashboardWidget, HealthCard } from '@/components/Dashboard'
import { ModuleHeader, QuickActionButton } from '@/components/Shared'
import type { DashboardResponse, HouseholdConnection, HouseholdProviderId } from '@/models/api/Integrations'
import { dashboardService, integrationService } from '@/services'

const providerMarks: Record<HouseholdProviderId, string> = {
	doit: 'D',
	'games-database': 'G',
	jellywatch: 'J',
	'beast-vault': 'B',
	'warcraft-archive': 'W',
}

const connectionLabels = {
	Disconnected: 'Not connected',
	Connected: 'Connected',
	Expired: 'Reconnect required',
	Error: 'Needs attention',
} as const

export const DashboardPage = () => {
	const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
	const [connections, setConnections] = useState<HouseholdConnection[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [refreshKey, setRefreshKey] = useState(0)

	useEffect(() => {
		let mounted = true
		setLoading(true)
		setError(null)

		Promise.all([dashboardService.getDashboard(), integrationService.connections()])
			.then(async ([dashboardData, connectionData]) => {
				const checkedConnections = await Promise.all(
					connectionData.map(async (connection) => {
						if (connection.status === 'Disconnected') return connection
						try {
							return await integrationService.testConnection(connection.provider)
						} catch {
							return {
								...connection,
								status: 'Error' as const,
								lastError: 'provider_unavailable',
								lastValidatedAt: new Date().toISOString(),
							}
						}
					})
				)

				if (mounted) {
					setDashboard(dashboardData)
					setConnections(checkedConnections)
				}
			})
			.catch(() => {
				if (mounted) setError('Dashboard status could not be loaded. Try again.')
			})
			.finally(() => {
				if (mounted) setLoading(false)
			})

		return () => {
			mounted = false
		}
	}, [refreshKey])

	return (
		<div className='page-stack'>
			<ModuleHeader
				title='Dashboard'
				description='Daily home overview. Integrations can be missing or disabled without breaking Household.'
				actions={<QuickActionButton onClick={() => setRefreshKey((value) => value + 1)}>Refresh</QuickActionButton>}
			/>

			<DashboardGrid>
				<DashboardWidget title='Connected apps' description='Your account connections and their current availability.'>
					{loading && <p className='muted'>Checking connected apps...</p>}
					{error && <p className='error-text'>{error}</p>}
					{!loading && !error && (
						<>
							<div className='dashboard-connections-list'>
								{connections.map((connection) => {
									const isLive = connection.status === 'Connected'
									const availability = !connection.configured
										? 'Unavailable'
										: connection.status === 'Disconnected'
											? 'Not checked'
											: isLive
												? 'Live'
												: 'Unavailable'

									return (
										<div className='dashboard-connection' key={connection.provider}>
											<span className={`connection-card__mark connection-card__mark--${connection.provider}`} aria-hidden='true'>
												{providerMarks[connection.provider]}
											</span>
											<div className='dashboard-connection__identity'>
												<strong>{connection.displayName}</strong>
												<span>{connection.accountDisplayName ?? connectionLabels[connection.status]}</span>
											</div>
											<div className='dashboard-connection__states'>
												<span className={`connection-state connection-state--${connection.status.toLowerCase()}`}>
													{connectionLabels[connection.status]}
												</span>
												<span className={`availability-state availability-state--${isLive ? 'live' : 'unavailable'}`}>
													{availability}
												</span>
											</div>
										</div>
									)
								})}
							</div>
							<Link className='dashboard-connections-link' to='/settings/integrations'>Manage connections</Link>
						</>
					)}
				</DashboardWidget>

				<DashboardWidget title='Integration health' description='Gateway status for configured services.'>
					{loading && <p className='muted'>Loading health...</p>}
					{!loading && !error && dashboard?.integrationHealth.length === 0 && (
						<p className='muted'>No integrations configured yet.</p>
					)}
					<div className='health-list'>
						{dashboard?.integrationHealth.map((health) => (
							<HealthCard key={`${health.type}-${health.integrationId ?? health.name}`} health={health} />
						))}
					</div>
				</DashboardWidget>
			</DashboardGrid>
		</div>
	)
}
