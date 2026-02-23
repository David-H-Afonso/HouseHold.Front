import { apiRoutes } from '../apiRoutes'

function getApiBaseUrl(): string {
	// Build-time env var (set in .env or .env.local)
	if (import.meta.env.VITE_API_BASE_URL) {
		return import.meta.env.VITE_API_BASE_URL as string
	}
	// Default: Household.Api dev server
	return 'http://localhost:8080'
}

export const environment = {
	production: false,
	baseUrl: getApiBaseUrl(),
	apiRoutes,
	api: {
		timeout: 30000,
	},
}
