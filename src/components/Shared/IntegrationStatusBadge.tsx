import type { IntegrationHealthStatus } from '@/models/api/Integrations'

interface IntegrationStatusBadgeProps {
	status: IntegrationHealthStatus
}

const labelByStatus: Record<IntegrationHealthStatus, string> = {
	NotConfigured: 'not configured',
	Unknown: 'unknown',
	Healthy: 'healthy',
	Degraded: 'degraded',
	Offline: 'offline',
}

export const IntegrationStatusBadge = ({ status }: IntegrationStatusBadgeProps) => {
	return <span className={`integration-status integration-status--${status.toLowerCase()}`}>{labelByStatus[status]}</span>
}
