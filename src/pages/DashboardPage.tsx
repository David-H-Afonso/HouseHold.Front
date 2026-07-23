import { useEffect, useState } from 'react'
import { DashboardGrid, DashboardWidget, HealthCard } from '@/components/Dashboard'
import { ModuleHeader, QuickActionButton } from '@/components/Shared'
import type { DashboardResponse } from '@/models/api/Integrations'
import { dashboardService } from '@/services'

export const DashboardPage = () => {
	const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let mounted = true
		dashboardService
			.getDashboard()
			.then((data) => {
				if (mounted) setDashboard(data)
			})
			.catch((err: Error) => {
				if (mounted) setError(err.message)
			})
			.finally(() => {
				if (mounted) setLoading(false)
			})

		return () => {
			mounted = false
		}
	}, [])

	return (
		<div className='page-stack'>
			<ModuleHeader
				title='Dashboard'
				description='Daily home overview. Integrations can be missing or disabled without breaking Household.'
				actions={<QuickActionButton onClick={() => window.location.reload()}>Refresh</QuickActionButton>}
			/>

			<DashboardGrid>
				<DashboardWidget title='Integration health' description='Gateway status for configured services.'>
					{loading && <p className='muted'>Loading health...</p>}
					{error && <p className='error-text'>{error}</p>}
					{!loading && !error && dashboard?.integrationHealth.length === 0 && (
						<p className='muted'>No integrations configured yet.</p>
					)}
					<div className='health-list'>
						{dashboard?.integrationHealth.map((health) => (
							<HealthCard key={`${health.type}-${health.integrationId ?? health.name}`} health={health} />
						))}
					</div>
				</DashboardWidget>

				<DashboardWidget title='Next modules' description='These routes are ready for phased implementation.'>
					<div className='placeholder-list'>
						<span>Apps launcher</span>
						<span>Games Database</span>
						<span>Media hub</span>
						<span>Downloads</span>
						<span>Pokemon</span>
						<span>Warcraft</span>
						<span>Network</span>
					</div>
				</DashboardWidget>
			</DashboardGrid>
		</div>
	)
}
