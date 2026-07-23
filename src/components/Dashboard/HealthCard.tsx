import type { IntegrationHealth } from '@/models/api/Integrations'
import { IntegrationStatusBadge } from '@/components/Shared'

interface HealthCardProps {
	health: IntegrationHealth
}

export const HealthCard = ({ health }: HealthCardProps) => {
	return (
		<div className='health-card'>
			<div>
				<strong>{health.name}</strong>
				<span>{health.type}</span>
			</div>
			<IntegrationStatusBadge status={health.status} />
			<p>{health.message}</p>
		</div>
	)
}
