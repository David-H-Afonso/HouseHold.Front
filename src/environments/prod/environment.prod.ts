// environment.prod.ts
import { apiRoutes } from '../apiRoutes'

const PLACEHOLDER = 'HOUSEHOLD_API_URL_PLACEHOLDER'

function getApiBaseUrl(): string {
	// Docker: env-config.js sets window.API_BASE_URL at container startup.
	// Empty string is valid: means "use relative URLs → nginx proxies API calls".
	// Guard against the placeholder not being replaced (e.g. local npm run build).
	const runtimeUrl = typeof window !== 'undefined' ? (window as any).API_BASE_URL : undefined
	if (runtimeUrl !== undefined && runtimeUrl !== PLACEHOLDER) {
		return runtimeUrl as string
	}
	if (import.meta.env.VITE_API_BASE_URL) {
		return import.meta.env.VITE_API_BASE_URL as string
	}
	return 'http://localhost:8080'
}

export const environment = {
	production: true,
	baseUrl: getApiBaseUrl(),
	apiRoutes,
	api: {
		timeout: 30000,
	},
}
