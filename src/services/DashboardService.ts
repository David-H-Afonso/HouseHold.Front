import { environment } from '@/environments'
import type { DashboardResponse } from '@/models/api/Integrations'
import { customFetch } from '@/utils'

class DashboardService {
	getDashboard(): Promise<DashboardResponse> {
		return customFetch<DashboardResponse>(environment.apiRoutes.dashboard.base)
	}
}

export const dashboardService = new DashboardService()
